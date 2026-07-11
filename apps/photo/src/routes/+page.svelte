<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import gsap from 'gsap';
	import SEOHead from '$lib/components/SEOHead.svelte';
	import ImageOptimized from '$lib/components/ImageOptimized.svelte';
	import { CONSTELLATION_COLUMNS } from '$lib/data/editorial-home.js';
	import {
		DRAG_MOMENTUM_MAX_PX,
		DRAG_MOMENTUM_MULTIPLIER,
		INTRO_HEADLINE_DURATION_S,
		INTRO_PHOTO_DURATION_S,
		INTRO_PHOTO_STAGGER_S,
		INTRO_PHOTOS_START_OFFSET_S,
		SURF_LERP_FACTOR,
		SURF_SETTLE_PX,
		WHEEL_TO_SCROLL,
		averageDepth,
		clamp,
		computeParallaxOffset,
		lerp
	} from '$lib/constellation-motion.js';

	let { data } = $props();

	/**
	 * The single breakpoint at which the page switches from a normal-flow,
	 * vertically-scrolling document (mobile stream / tablet 2-col
	 * constellation) into the full-bleed, corner-pinned "surf" stage. Kept
	 * as one source of truth referenced by both the CSS below (`@media
	 * (min-width: 1100px)`) and the JS layout sync in onMount.
	 */
	const DESKTOP_LAYOUT_QUERY = '(min-width: 1100px)';

	// Tracks whether the desktop stage layout is currently active, so the
	// scrollable region's aria-label and keyboard-tab behavior can match
	// reality. Defaults to false (safe for SSR/no-JS: the region simply
	// isn't part of the tab order and its label doesn't mention scrolling —
	// both harmless on a layout that, without JS, is a normal in-flow
	// stream at every breakpoint anyway).
	let isDesktopLayout = $state(false);

	let regionLabel = $derived(
		isDesktopLayout
			? `Photo constellation — ${data.photoCount} photographs, scroll or use left and right arrow keys to browse`
			: `Photo constellation — ${data.photoCount} photographs`
	);

	function pad(n: number): string {
		return String(n).padStart(2, '0');
	}

	let instagramUrl = $derived(
		data.site.socials.find((s) => s.platform === 'instagram')?.url ??
			'https://instagram.com/rama'
	);
	// site.json has no "vsco" entry in socials yet — falls back to a
	// placeholder handle; swap in the real VSCO profile URL once it exists.
	let vscoUrl = $derived(
		data.site.socials.find((s) => s.platform === 'vsco')?.url ?? 'https://vsco.co/rama'
	);

	// --- Motion: refs -----------------------------------------------------
	// Elements below render fully visible via plain SSR markup/CSS — any
	// "hidden" starting state for the intro is applied from JS only (inside
	// runIntro(), below), never from static CSS, so the page is complete
	// without JavaScript.
	let headlineTextEl: HTMLSpanElement | undefined = $state();
	let bylineEl: HTMLParagraphElement | undefined = $state();
	let bioEl: HTMLParagraphElement | undefined = $state();
	let countEl: HTMLParagraphElement | undefined = $state();
	let stripEl: HTMLDivElement | undefined = $state();
	let itemEls: (HTMLLIElement | undefined)[] = [];

	function prefersReducedMotion(): boolean {
		try {
			return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		} catch {
			return false;
		}
	}

	function pointerIsFine(): boolean {
		try {
			return window.matchMedia('(pointer: fine)').matches;
		} catch {
			return false;
		}
	}

	/**
	 * Orchestrated intro: headline mask-reveals first, byline/bio/count rise
	 * in on its heels, then photos stagger in ordered by their contact-sheet
	 * number (not DOM order). Skipped entirely under reduced motion — in
	 * that case nothing is ever hidden, so the SSR-visible state simply
	 * stands (instant, no stagger).
	 */
	function runIntro(reducedMotion: boolean): () => void {
		if (reducedMotion) return () => {};

		const tl = gsap.timeline();

		if (headlineTextEl) {
			tl.fromTo(
				headlineTextEl,
				{ yPercent: 100 },
				{ yPercent: 0, duration: INTRO_HEADLINE_DURATION_S, ease: 'expo.out' }
			);
		}

		const riseEls = [bylineEl, bioEl, countEl].filter((el): el is HTMLParagraphElement =>
			Boolean(el)
		);
		if (riseEls.length) {
			tl.fromTo(
				riseEls,
				{ opacity: 0, y: 14 },
				{ opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', stagger: 0.08 },
				'-=0.55'
			);
		}

		const orderedPhotoEls = itemEls
			.filter((el): el is HTMLLIElement => Boolean(el))
			.map((el) => ({ el, number: Number(el.dataset.number ?? 0) }))
			.sort((a, b) => a.number - b.number)
			.map((entry) => entry.el);

		if (orderedPhotoEls.length) {
			tl.fromTo(
				orderedPhotoEls,
				{ opacity: 0, '--intro-y': '32px' },
				{
					opacity: 1,
					'--intro-y': '0px',
					duration: INTRO_PHOTO_DURATION_S,
					ease: 'power3.out',
					stagger: INTRO_PHOTO_STAGGER_S
				},
				INTRO_PHOTOS_START_OFFSET_S
			);
		}

		return () => tl.kill();
	}

	/**
	 * Desktop-only "surf" mechanics on the horizontal constellation strip:
	 * vertical wheel -> horizontal scroll with rAF/lerp damping, pointer
	 * drag-to-surf with release momentum, and a subtle per-item depth
	 * parallax tied to scroll position. Native scroll (keyboard arrows,
	 * scrollbar) stays fully functional as the baseline fallback and this
	 * layer resyncs to it whenever it drives the scroll itself.
	 */
	function setupSurf(reducedMotion: boolean): () => void {
		if (!stripEl) return () => {};
		// Re-bind through an explicitly non-optional local: TS's flow
		// narrowing above doesn't carry into the nested closures below, but
		// a const with a non-optional *declared* type does.
		const strip: HTMLDivElement = stripEl;

		const midDepth = averageDepth(data.constellation.map((entry) => entry.depth));

		let current = strip.scrollLeft;
		let target = strip.scrollLeft;
		let rafId: number | undefined;
		let dragging = false;
		let dragPointerId: number | undefined;
		let dragStartX = 0;
		let dragStartScroll = 0;
		let lastMoveX = 0;
		let lastMoveTime = 0;
		let velocity = 0;

		function maxScroll(): number {
			return Math.max(0, strip.scrollWidth - strip.clientWidth);
		}

		function applyParallax() {
			if (reducedMotion) return;
			const scrollLeft = strip.scrollLeft;
			for (let i = 0; i < data.constellation.length; i++) {
				const el = itemEls[i];
				if (!el) continue;
				const offset = computeParallaxOffset(scrollLeft, data.constellation[i].depth, midDepth);
				el.style.setProperty('--parallax-x', `${offset}px`);
			}
		}

		function tick() {
			current = lerp(current, target, SURF_LERP_FACTOR);
			if (Math.abs(target - current) < SURF_SETTLE_PX) {
				current = target;
				strip.scrollLeft = current;
				rafId = undefined;
				return;
			}
			strip.scrollLeft = current;
			rafId = requestAnimationFrame(tick);
		}

		function ensureLoop() {
			if (rafId === undefined) rafId = requestAnimationFrame(tick);
		}

		function scrollBy(delta: number) {
			const next = clamp(target + delta, 0, maxScroll());
			target = next;
			if (reducedMotion) {
				current = next;
				strip.scrollLeft = next;
			} else {
				ensureLoop();
			}
		}

		function onWheel(e: WheelEvent) {
			const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
			if (delta === 0) return;
			e.preventDefault();
			scrollBy(delta * WHEEL_TO_SCROLL);
		}

		let scrollTicking = false;
		function onNativeScroll() {
			// A scroll we didn't drive ourselves (keyboard arrows, etc.) —
			// resync so the next wheel/drag continues from the real position.
			if (rafId === undefined) {
				current = strip.scrollLeft;
				target = strip.scrollLeft;
			}
			if (!scrollTicking) {
				scrollTicking = true;
				requestAnimationFrame(() => {
					applyParallax();
					scrollTicking = false;
				});
			}
		}

		function onPointerDown(e: PointerEvent) {
			if (e.pointerType !== 'mouse' || e.button !== 0) return;
			dragging = true;
			dragPointerId = e.pointerId;
			dragStartX = e.clientX;
			dragStartScroll = strip.scrollLeft;
			lastMoveX = e.clientX;
			lastMoveTime = e.timeStamp;
			velocity = 0;
			current = strip.scrollLeft;
			target = strip.scrollLeft;
			strip.classList.add('is-dragging');
			document.documentElement.classList.add('constellation-no-select');
			try {
				strip.setPointerCapture(e.pointerId);
			} catch {
				// Pointer capture unsupported/unavailable — move/up listeners still work.
			}
		}

		function onPointerMove(e: PointerEvent) {
			if (!dragging || e.pointerId !== dragPointerId) return;
			const dx = e.clientX - dragStartX;
			const next = clamp(dragStartScroll - dx, 0, maxScroll());
			current = next;
			target = next;
			strip.scrollLeft = next;

			const dt = e.timeStamp - lastMoveTime;
			if (dt > 0) velocity = (lastMoveX - e.clientX) / dt;
			lastMoveX = e.clientX;
			lastMoveTime = e.timeStamp;
		}

		function endDrag(e: PointerEvent) {
			if (!dragging || e.pointerId !== dragPointerId) return;
			dragging = false;
			dragPointerId = undefined;
			strip.classList.remove('is-dragging');
			document.documentElement.classList.remove('constellation-no-select');
			try {
				strip.releasePointerCapture(e.pointerId);
			} catch {
				// Already released (e.g. pointercancel) — nothing to do.
			}

			if (!reducedMotion && Math.abs(velocity) > 0.02) {
				const flick = clamp(
					velocity * DRAG_MOMENTUM_MULTIPLIER,
					-DRAG_MOMENTUM_MAX_PX,
					DRAG_MOMENTUM_MAX_PX
				);
				scrollBy(flick);
			}
		}

		strip.addEventListener('wheel', onWheel, { passive: false });
		strip.addEventListener('scroll', onNativeScroll, { passive: true });
		strip.addEventListener('pointerdown', onPointerDown);
		strip.addEventListener('pointermove', onPointerMove);
		strip.addEventListener('pointerup', endDrag);
		strip.addEventListener('pointercancel', endDrag);

		applyParallax();

		return () => {
			strip.removeEventListener('wheel', onWheel);
			strip.removeEventListener('scroll', onNativeScroll);
			strip.removeEventListener('pointerdown', onPointerDown);
			strip.removeEventListener('pointermove', onPointerMove);
			strip.removeEventListener('pointerup', endDrag);
			strip.removeEventListener('pointercancel', endDrag);
			if (rafId !== undefined) {
				cancelAnimationFrame(rafId);
				rafId = undefined;
			}
			document.documentElement.classList.remove('constellation-no-select');
			for (const el of itemEls) el?.style.removeProperty('--parallax-x');
		};
	}

	onMount(() => {
		if (!browser) return;

		const reducedMotion = prefersReducedMotion();
		const introTeardown = runIntro(reducedMotion);

		// The horizontal "surf" mechanics (wheel-hijack, drag, parallax) are
		// desktop-stage-only: below DESKTOP_LAYOUT_QUERY the constellation is
		// a normal in-flow vertical stream with nothing to scroll
		// horizontally, so wheel/drag handlers must be fully detached there —
		// left attached, `onWheel`'s unconditional preventDefault() would
		// silently break normal page scrolling on tablet/mobile. Re-evaluated
		// on every breakpoint crossing (e.g. resizing a desktop window
		// narrower, or rotating a tablet) so a live resize never leaves the
		// wrong mode attached for the rest of the session.
		const desktopQuery = window.matchMedia(DESKTOP_LAYOUT_QUERY);
		let surfTeardown: (() => void) | undefined;

		function syncLayout() {
			isDesktopLayout = desktopQuery.matches;
			// Keyboard users can only usefully tab into the region when it's
			// actually the scrollable stage; elsewhere it's inert chrome and
			// should be skipped so Tab goes straight to the photo links.
			if (stripEl) stripEl.tabIndex = isDesktopLayout ? 0 : -1;

			const shouldSurf = isDesktopLayout && pointerIsFine();
			if (shouldSurf && !surfTeardown) {
				surfTeardown = setupSurf(reducedMotion);
			} else if (!shouldSurf && surfTeardown) {
				surfTeardown();
				surfTeardown = undefined;
			}
		}

		syncLayout();
		desktopQuery.addEventListener('change', syncLayout);

		return () => {
			introTeardown();
			desktopQuery.removeEventListener('change', syncLayout);
			surfTeardown?.();
		};
	});
</script>

<SEOHead
	title="{data.site.title} — Photography Portfolio"
	description={data.site.description}
	url={data.site.url}
/>

<main class="stage w-full bg-[#0a0a09] font-sans text-[#ececea]">
	<!-- Nav: normal in-flow row on mobile/tablet, corner-pinned overlay once
	     the desktop stage kicks in (see .site-header below). -->
	<header class="site-header pointer-events-none z-30 flex items-start justify-end gap-6 sm:justify-between">
		<span
			class="pointer-events-auto hidden font-mono text-[11px] uppercase tracking-[0.3em] text-[#8f8c86] sm:inline-block"
		>
			{data.site.title}
		</span>

		<nav aria-label="Primary" class="pointer-events-auto">
			<ul
				class="flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.25em] text-[#8f8c86] sm:gap-6 sm:text-[11px] sm:tracking-[0.3em] md:gap-8"
			>
				<li>
					<a
						href="/gallery"
						class="inline-flex items-center gap-2 transition-colors hover:text-[#ececea] focus-visible:text-[#ececea] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#c99b6a]"
					>
						<span aria-hidden="true" class="h-1.5 w-1.5 rounded-full bg-[#c99b6a]"></span>
						Works
					</a>
				</li>
				<li>
					<a
						href="/about"
						class="transition-colors hover:text-[#ececea] focus-visible:text-[#ececea] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#c99b6a]"
					>
						About
					</a>
				</li>
				<li>
					<a
						href="mailto:chainederama@gmail.com"
						class="transition-colors hover:text-[#ececea] focus-visible:text-[#ececea] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#c99b6a]"
					>
						Contact
					</a>
				</li>
			</ul>
		</nav>
	</header>

	<!-- Headline block: first thing in the vertical stream on mobile/tablet,
	     floats above the constellation once the desktop stage kicks in. -->
	<section aria-labelledby="hero-heading" class="hero pointer-events-none z-20 px-6 sm:px-10">
		<h1
			id="hero-heading"
			class="hero-heading max-w-[20ch] leading-[0.85] font-black tracking-tight break-words text-[#ececea] uppercase"
		>
			<span class="block overflow-hidden">
				<span bind:this={headlineTextEl} class="block">Photography</span>
			</span>
		</h1>
		<p
			bind:this={bylineEl}
			class="mt-3 font-mono text-sm uppercase tracking-[0.4em] text-[#c99b6a] sm:text-base"
		>
			Rama Herbin
		</p>
		<p bind:this={bioEl} class="mt-4 max-w-sm text-sm leading-relaxed text-[#8f8c86] sm:text-base">
			{data.site.about.bio}
		</p>
		<p bind:this={countEl} class="mt-3 font-mono text-xs text-[#8f8c86]">({data.photoCount})</p>
	</section>

	<!-- The constellation. Below DESKTOP_LAYOUT_QUERY it's a normal in-flow
	     block (single-column stream on mobile, 2-column staggered grid on
	     tablet) — plain document scroll, no JS required. From 1100px up it
	     becomes a horizontally-scrollable strip wider than the viewport;
	     native overflow-x scrolling works without JS there too, and
	     setupSurf() above progressively layers wheel/drag lerp-smoothing +
	     depth parallax on top (desktop pointer-fine only). tabindex is set
	     to 0 by default (WAI-ARIA "scrollable region" pattern, so ← → keys
	     scroll natively without JS) and flipped to -1 by JS once it's
	     confirmed the region isn't the scrollable desktop stage. -->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<div
		bind:this={stripEl}
		class="constellation-strip z-0"
		tabindex="0"
		role="region"
		aria-label={regionLabel}
	>
		<ul class="constellation-grid" style="--cols: {CONSTELLATION_COLUMNS};">
			{#each data.constellation as entry, i (entry.photoId)}
				<li
					bind:this={itemEls[i]}
					class="constellation-item"
					data-highlight={entry.highlight ? 'true' : undefined}
					data-number={entry.number}
					style="--col-start: {entry.columnStart}; --col-span: {entry.columnSpan}; --align: {entry.align}; --depth: {entry.depth}; --nudge: {entry.offset};"
				>
					<a
						href="/gallery/{entry.photo.slug}"
						class="constellation-link group block transition-transform duration-500 ease-out hover:-translate-y-1 focus-visible:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c99b6a]"
						aria-label="Photo {pad(entry.number)} — {entry.photo.title}, view in gallery"
					>
						<figure class="m-0">
							<div class="w-full overflow-hidden bg-[#141412]" style="aspect-ratio: {entry.photo.aspectRatio};">
								<ImageOptimized
									variants={entry.photo.variants}
									alt={entry.photo.title}
									size={entry.highlight ? 'large' : 'medium'}
									loading={entry.number <= 2 ? 'eager' : 'lazy'}
									class="transition-[filter,transform] duration-500 ease-out group-hover:scale-[1.02] group-hover:brightness-110 group-focus-visible:scale-[1.02] group-focus-visible:brightness-110"
								/>
							</div>
							<figcaption
								aria-hidden="true"
								class="mt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[#8f8c86] transition-colors duration-300 group-hover:text-[#c99b6a] group-focus-visible:text-[#c99b6a]"
							>
								{pad(entry.number)} —
							</figcaption>
						</figure>
					</a>
				</li>
			{/each}
		</ul>
	</div>

	<p
		class="hint pointer-events-none absolute right-6 bottom-[clamp(6rem,14vh,7.5rem)] z-20 font-mono text-[10px] tracking-[0.3em] text-[#8f8c86] uppercase opacity-70 sm:right-10"
	>
		Scroll or ← → to surf
	</p>

	<!-- Bottom strip: normal in-flow footer on mobile/tablet, corner-pinned
	     overlay once the desktop stage kicks in (see .site-footer below). -->
	<footer
		class="site-footer pointer-events-none z-30 flex flex-col gap-4 border-t border-[rgba(236,236,232,0.14)] font-mono text-[10px] tracking-[0.25em] text-[#8f8c86] uppercase sm:flex-row sm:items-center sm:justify-between"
	>
		<p class="pointer-events-auto flex items-center gap-2">
			<span aria-hidden="true" class="h-1.5 w-1.5 rounded-full bg-[#c99b6a]"></span>
			Shot on Fujifilm X-T4
		</p>
		<ul class="pointer-events-auto flex items-center gap-6">
			<li>
				<a
					href={instagramUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="transition-colors hover:text-[#ececea] focus-visible:text-[#ececea] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#c99b6a]"
				>
					Instagram
				</a>
			</li>
			<li>
				<a
					href={vscoUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="transition-colors hover:text-[#ececea] focus-visible:text-[#ececea] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#c99b6a]"
				>
					VSCO
				</a>
			</li>
			<li>
				<a
					href="mailto:chainederama@gmail.com"
					class="transition-colors hover:text-[#ececea] focus-visible:text-[#ececea] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#c99b6a]"
				>
					Email
				</a>
			</li>
		</ul>
	</footer>
</main>

<style>
	/* ==========================================================================
	   Responsive composition, mobile-first. Three tiers:
	     - base   (<768px)   — vertical editorial stream, one column
	     - 768px  (tablet)   — 2-column staggered constellation, still normal
	                            in-flow document (headline sits above it)
	     - 1100px (desktop)  — full-bleed corner-pinned "surf" stage, the
	                            horizontal strip wider than the viewport

	   .stage/.site-header/.hero/.constellation-strip/.site-footer own 100%
	   of their own `position`/`inset`/`height`/`overflow` here — none of
	   those live as Tailwind utility classes on these elements — so the
	   breakpoint cascade is unambiguous instead of racing Tailwind's
	   generated utility order.
	   ========================================================================== */

	.stage {
		position: relative;
		width: 100%;
		min-height: 100svh;
		/* Hard guarantee against page-level horizontal scroll on mobile/
		   tablet (belt-and-braces alongside the width-safe units used
		   throughout below) — .stage has no fixed height here, so this
		   never traps vertical scrolling inside the box; the document
		   keeps scrolling normally. */
		overflow-x: hidden;
	}

	.site-header,
	.hero,
	.site-footer {
		position: relative;
	}

	.constellation-strip {
		position: relative;
		overflow: visible;
	}

	/* Headline size + the desktop-only surf hint. Kept out of Tailwind's
	   utility classes and fully owned here: Tailwind's generated stylesheet
	   does *not* emit the arbitrary `min-[1100px]:` variant in ascending
	   order after the built-in `sm:`/`md:` breakpoints (verified against
	   the actual build output — it lands earlier in the cascade), so an
	   `md:` utility would silently win over a `min-[1100px]:` one on the
	   same property at desktop widths. Authoring the whole responsive
	   ramp in one place sidesteps that entirely. */
	.hero {
		padding-top: 2.5rem;
	}

	.hero-heading {
		font-size: clamp(2.5rem, 12vw, 4rem);
	}

	.hint {
		display: none;
	}

	@media (min-width: 640px) {
		.hero {
			padding-top: 3rem;
		}
		.hero-heading {
			font-size: clamp(3rem, 10vw, 5.5rem);
		}
	}

	@media (min-width: 768px) {
		.hero {
			padding-top: 4rem;
		}
		.hero-heading {
			font-size: clamp(3.5rem, 8vw, 7rem);
		}
	}

	@media (min-width: 1100px) {
		.hero {
			padding-top: 8rem;
		}
		.hero-heading {
			font-size: clamp(3.5rem, 9vw, 9rem);
		}

		.hint {
			display: block;
		}
	}

	.constellation-strip:focus-visible {
		outline: 1px solid #c99b6a;
		outline-offset: -4px;
	}

	/* Safe-area-aware corner padding, shared by header + footer across the
	   in-flow tiers (base + tablet) and carried forward unchanged once they
	   become absolutely-positioned overlays at desktop — only `position`
	   changes there, not `padding`. */
	.site-header {
		padding: max(1.5rem, env(safe-area-inset-top)) max(1.5rem, env(safe-area-inset-right)) 1.5rem
			max(1.5rem, env(safe-area-inset-left));
	}

	.site-footer {
		padding: 1.5rem max(1.5rem, env(safe-area-inset-right)) max(1.5rem, env(safe-area-inset-bottom))
			max(1.5rem, env(safe-area-inset-left));
	}

	@media (min-width: 640px) {
		.site-header {
			padding: max(2.5rem, env(safe-area-inset-top)) max(2.5rem, env(safe-area-inset-right)) 2.5rem
				max(2.5rem, env(safe-area-inset-left));
		}
		.site-footer {
			padding: 2.5rem max(2.5rem, env(safe-area-inset-right)) max(2.5rem, env(safe-area-inset-bottom))
				max(2.5rem, env(safe-area-inset-left));
		}
	}

	/* ---------------------------------------------------------------------
	   Constellation: mobile (base) — a plain vertical flex stream. `align`
	   (start/center/end, from the shared editorial-home.ts config) is
	   reused as-is: in a flex *column*, align-self moves along the cross
	   axis (horizontal), so the same per-photo hint that means "vertical
	   anchor" on the desktop stage naturally becomes "alternating slight
	   horizontal offset" here — no separate mobile dataset needed.
	   --------------------------------------------------------------------- */
	.constellation-grid {
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		width: 100%;
		margin: 0;
		padding: clamp(3rem, 12vw, 5rem) clamp(1.25rem, 6vw, 2.5rem) clamp(3rem, 10vw, 4.5rem);
		gap: clamp(3rem, 12vw, 5rem);
		list-style: none;
	}

	.constellation-item {
		position: relative;
		min-width: 0;
		width: min(88%, 24rem);
		align-self: var(--align, center);
		z-index: var(--depth, 1);
		/* --nudge (desktop-only vertical stage placement) and --parallax-x
		   (desktop-only surf parallax) are intentionally ignored below
		   1100px — applying a desktop-tuned translateY nudge to an in-flow
		   vertical stream would shove items into their neighbours instead
		   of just repositioning empty stage space. --intro-y (entrance
		   animation) still applies at every tier. */
		transform: translate3d(0, var(--intro-y, 0px), 0);
	}

	.constellation-item[data-highlight='true'] {
		filter: saturate(1.05);
	}

	.constellation-link {
		display: block;
	}

	/* ---------------------------------------------------------------------
	   Tablet (768–1099px): 2-column staggered constellation, still normal
	   document flow (headline block stays above it, per the design brief).
	   Grid auto-placement alone (no explicit column/row per item) gives the
	   left/right alternation; row height naturally varies with each pair's
	   aspect ratio, and align-self (still `var(--align)`, now meaning
	   *vertical* anchor again — its native grid meaning) lets the shorter
	   photo in a row sit top/center/bottom for the "staggered" look, all
	   without bespoke per-breakpoint data.
	   --------------------------------------------------------------------- */
	@media (min-width: 768px) {
		.constellation-grid {
			display: grid;
			grid-template-columns: repeat(2, minmax(0, 1fr));
			align-items: start;
			column-gap: clamp(1.5rem, 4vw, 2.5rem);
			row-gap: clamp(2rem, 6vw, 3rem);
			padding: clamp(2.5rem, 6vw, 4rem) clamp(2rem, 5vw, 3rem) clamp(4rem, 8vh, 5rem);
		}

		.constellation-item {
			width: auto;
		}
	}

	/* ---------------------------------------------------------------------
	   Desktop (>=1100px): the full-bleed, corner-pinned "surf" stage —
	   original composition, unchanged from the desktop pass.
	   --------------------------------------------------------------------- */
	@media (min-width: 1100px) {
		.stage {
			height: 100dvh;
			min-height: 0;
			overflow: hidden;
		}

		/* Legibility scrim: the corner-pinned nav/headline/footer are fixed
		   overlays while the photo strip scrolls freely beneath them, so any
		   frame of the constellation — including light skies/highlights —
		   can end up directly behind that text. A quiet top/bottom vignette
		   (sitting above the photos but below the pinned UI in the stacking
		   order) keeps WCAG-adequate contrast regardless of scroll position
		   without touching the photos' own presentation. Mobile/tablet never
		   overlay text on photos (normal in-flow stream), so this is
		   desktop-stage-only. */
		.stage::before,
		.stage::after {
			content: '';
			position: absolute;
			inset-inline: 0;
			z-index: 10;
			pointer-events: none;
		}

		.stage::before {
			top: 0;
			height: min(46vh, 32rem);
			background: linear-gradient(
				to bottom,
				rgba(10, 10, 9, 0.85) 0%,
				rgba(10, 10, 9, 0.5) 55%,
				rgba(10, 10, 9, 0) 100%
			);
		}

		.stage::after {
			bottom: 0;
			height: min(28vh, 15rem);
			background: linear-gradient(
				to top,
				rgba(10, 10, 9, 0.85) 0%,
				rgba(10, 10, 9, 0.4) 60%,
				rgba(10, 10, 9, 0) 100%
			);
		}

		.site-header,
		.hero {
			position: absolute;
			inset-inline: 0;
			top: 0;
		}

		.site-footer {
			position: absolute;
			inset-inline: 0;
			bottom: 0;
		}

		.constellation-strip {
			position: absolute;
			inset: 0;
			overflow-x: auto;
			overflow-y: hidden;
			-webkit-overflow-scrolling: touch;
			scrollbar-width: none;
			cursor: grab;
		}

		.constellation-strip::-webkit-scrollbar {
			display: none;
		}

		/* .is-dragging is toggled from JS only (pointer-drag surf), so
		   Svelte can't see it statically referenced in the markup —
		   :global() opts it out of the unused-selector check without
		   unscoping .constellation-strip. */
		.constellation-strip:global(.is-dragging) {
			cursor: grabbing;
		}

		.constellation-grid {
			display: grid;
			grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
			grid-template-rows: 100%;
			width: 195vw;
			height: 100%;
			padding: clamp(8rem, 20vh, 11rem) max(clamp(1.5rem, 4vw, 4rem), env(safe-area-inset-right)) clamp(
					6rem,
					16vh,
					8rem
				)
				max(clamp(1.5rem, 4vw, 4rem), env(safe-area-inset-left));
			column-gap: clamp(0.75rem, 1.5vw, 1.75rem);
			row-gap: 0;
		}

		.constellation-item {
			width: auto;
			grid-row: 1;
			grid-column: var(--col-start) / span var(--col-span);
			transform: translate3d(var(--parallax-x, 0px), calc(var(--nudge, 0px) + var(--intro-y, 0px)), 0);
		}
	}

	/* Set from JS while a pointer-drag is active, on <html> so a fast drag
	   that outruns the pointer target can't select surrounding page text. */
	:global(html.constellation-no-select) {
		user-select: none;
	}

	@media (prefers-reduced-motion: reduce) {
		.stage :global(*) {
			animation-duration: 0.01ms !important;
			animation-iteration-count: 1 !important;
			transition-duration: 0.01ms !important;
			scroll-behavior: auto !important;
		}
	}
</style>
