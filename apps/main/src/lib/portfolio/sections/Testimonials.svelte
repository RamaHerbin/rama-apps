<script lang="ts">
	import { onMount } from "svelte";
	import ReviewCard from "$lib/portfolio/ReviewCard.svelte";
	import Avatar from "$lib/portfolio/Avatar.svelte";
	import TestimonialAvatars from "$lib/portfolio/TestimonialAvatars.svelte";
	import { resolveAvatar } from "$lib/portfolio/avatar.js";
	import { c } from "$lib/content/index.js";
	import type { Testimonial } from "$lib/portfolio/types.js";

	// Paragraph count per testimonial. Content keys are flat and single-line by
	// contract (a newline is stripped on commit), so the full recommendation is
	// stored one key per paragraph — `testimonials.{id}.body.{n}` — and the count
	// has to live here rather than being derived from the JSON, which components
	// are not allowed to read directly (see EDIT-CONTRACT.md).
	const paragraphCounts: Record<number, number> = { 1: 5, 2: 4, 3: 3, 4: 1 };

	// Real photos (consented) live at static/portfolio/testimonials/<slug>.{webp,jpg};
	// ids without an entry fall back to generated initials. Romain has no photo yet.
	const photoSlugs: Record<number, string> = {
		1: "mathilde-gallouet",
		3: "hichem-rekouane",
		4: "elie-nissen"
	};

	const testimonialIds = [1, 2, 3, 4];

	const testimonials: Testimonial[] = testimonialIds.map((id) => {
		const name = c(`testimonials.${id}.name`);
		const avatar = resolveAvatar(name, photoSlugs[id]);
		return {
			id,
			name,
			designation: c(`testimonials.${id}.designation`),
			image: avatar.src,
			imageWebp: avatar.webp,
			excerpt: c(`testimonials.${id}.excerpt`),
			body: Array.from({ length: paragraphCounts[id] ?? 0 }, (_, i) =>
				c(`testimonials.${id}.body.${i + 1}`)
			),
			linkedinUrl: c(`testimonials.${id}.linkedin.href`),
			date: c(`testimonials.${id}.date`)
		};
	});

	const tooltipItems = testimonials.map((t) => ({
		id: t.id,
		name: t.name,
		designation: t.designation,
		image: t.image,
		href: t.linkedinUrl || undefined
	}));

	// A single dialog reused by every card, rather than one per card inside the
	// marquee (which duplicates its children).
	let dialogEl = $state<HTMLDialogElement | null>(null);
	let active = $state<Testimonial | null>(null);

	function openFull(t: Testimonial): void {
		active = t;
		dialogEl?.showModal();
	}

	function close(): void {
		dialogEl?.close();
	}

	/** Backdrop clicks land on the <dialog> itself, never on its content. */
	function onDialogClick(event: MouseEvent): void {
		if (event.target === dialogEl) close();
	}

	/**
	 * The card shows a condensed pull-quote; only offer "Read more" when there is
	 * genuinely more to read (Elie's recommendation is a single short paragraph,
	 * so its excerpt already is the whole thing).
	 */
	function hasMore(t: Testimonial): boolean {
		return t.body.length > 1 || t.body[0] !== t.excerpt;
	}

	// ── Auto-scrolling carousel ─────────────────────────────────────────────
	// Replaces fancy-ui's Marquee (CSS keyframe) with a scrollLeft-driven track,
	// so we can both auto-advance AND jump-centre a specific card when its avatar
	// is hovered. The cards are duplicated COPIES times for a seamless loop; the
	// track lives in [setWidth, 2·setWidth) with a full copy of content on each
	// side, and wraps by one setWidth so the seam is never visible.
	const COPIES = 3;
	const SPEED = 45; // px/s

	let scrollEl = $state<HTMLDivElement | null>(null);
	let paused = $state(false);
	let pos = 0; // float scroll position (scrollLeft rounds, so we track our own)
	let setWidth = 0;

	function measure() {
		if (scrollEl) setWidth = scrollEl.scrollWidth / COPIES;
	}

	onMount(() => {
		const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		measure();
		pos = setWidth;
		if (scrollEl) scrollEl.scrollLeft = pos;

		let raf = 0;
		let last = 0;
		function frame(now: number) {
			raf = requestAnimationFrame(frame);
			const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
			last = now;
			if (paused || reduce || !scrollEl) return;
			if (!setWidth) measure();
			pos += SPEED * dt;
			if (setWidth && pos >= setWidth * 2) pos -= setWidth;
			scrollEl.scrollLeft = pos;
		}
		raf = requestAnimationFrame(frame);

		const onResize = () => measure();
		window.addEventListener("resize", onResize);
		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener("resize", onResize);
		};
	});

	/** Avatar hover/focus: centre that person's nearest card and stop; null resumes. */
	function centerOnAvatar(id: number | string | null) {
		if (id == null) {
			if (scrollEl) pos = scrollEl.scrollLeft; // resume from where the smooth scroll left off
			paused = false;
			return;
		}
		paused = true;
		if (!scrollEl) return;
		const cRect = scrollEl.getBoundingClientRect();
		const cMid = cRect.left + cRect.width / 2;
		const instances = [...scrollEl.querySelectorAll<HTMLElement>(`[data-tid="${id}"]`)];
		if (!instances.length) return;
		// Pick the instance nearest the current centre → minimal travel.
		let best = instances[0];
		let bestDist = Infinity;
		for (const el of instances) {
			const r = el.getBoundingClientRect();
			const d = Math.abs(r.left + r.width / 2 - cMid);
			if (d < bestDist) {
				bestDist = d;
				best = el;
			}
		}
		const r = best.getBoundingClientRect();
		scrollEl.scrollTo({ left: scrollEl.scrollLeft + (r.left + r.width / 2 - cMid), behavior: "smooth" });
	}
</script>

<section id="testimonials" class="px-6 py-20">
	<div class="mx-auto max-w-6xl">
		<div class="mb-16 text-center">
			<h2
				class="text-foreground text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
				data-edit="home.testimonials.title"
			>
				{c("home.testimonials.title")}
			</h2>
			<p
				class="text-muted-foreground mx-auto mt-4 max-w-2xl text-lg"
				data-edit="home.testimonials.subtitle"
			>
				{c("home.testimonials.subtitle")}
			</p>
		</div>

		<!-- Colleague avatars — hover/focus centres their card; click opens LinkedIn -->
		<div class="flex w-full flex-row items-center justify-center">
			<TestimonialAvatars items={tooltipItems} onHoverChange={centerOnAvatar} />
		</div>

		<!-- Auto-scrolling carousel (see script) -->
		<div
			class="bg-background relative flex h-[400px] w-full flex-col items-center justify-center overflow-hidden rounded-lg md:shadow-xl"
		>
			<div bind:this={scrollEl} class="flex w-full items-stretch gap-4 overflow-hidden px-2 py-1">
				{#each Array(COPIES) as _, copy (copy)}
					{#each testimonials as review (review.id)}
						<div data-tid={review.id} class="flex shrink-0">
							<ReviewCard
								img={review.image}
								imgWebp={review.imageWebp}
								name={review.name}
								nameKey={`testimonials.${review.id}.name`}
								username={review.designation}
								body={review.excerpt}
								bodyKey={`testimonials.${review.id}.excerpt`}
								linkedinUrl={review.linkedinUrl}
								linkedinHrefKey={`testimonials.${review.id}.linkedin.href`}
								date={review.date}
								dateKey={`testimonials.${review.id}.date`}
								onReadMore={hasMore(review) ? () => openFull(review) : undefined}
							/>
						</div>
					{/each}
				{/each}
			</div>

			<!-- Left Gradient -->
			<div
				class="dark:from-background pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-white"
			></div>

			<!-- Right Gradient -->
			<div
				class="dark:from-background pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-white"
			></div>
		</div>
	</div>
</section>

<!--
	The full recommendation. Native <dialog> (focus trap + Escape come free); no
	dialog primitive ships in fancy-ui-svelte.
-->
<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<dialog
	bind:this={dialogEl}
	onclick={onDialogClick}
	onclose={() => (active = null)}
	class="bg-background text-foreground m-auto w-[min(38rem,calc(100vw-2rem))] rounded-xl border border-gray-950/[.1] p-0 shadow-xl backdrop:bg-black/60 dark:border-gray-50/[.1]"
>
	{#if active}
		<article class="p-6">
			<header class="flex flex-row items-center gap-3">
				<Avatar
					src={active.image}
					webp={active.imageWebp}
					name={active.name}
					size={44}
					class="h-11 w-11 shrink-0"
				/>
				<div class="flex flex-col">
					<span class="font-medium">{active.name}</span>
					<span class="text-muted-foreground text-sm">{active.designation}</span>
				</div>
				<span class="text-muted-foreground ml-auto text-xs">{active.date}</span>
			</header>

			<div class="mt-5 space-y-3">
				{#each active.body as paragraph, i (i)}
					<p class="text-sm leading-relaxed" data-edit={`testimonials.${active.id}.body.${i + 1}`}>
						{paragraph}
					</p>
				{/each}
			</div>

			<footer class="mt-6 flex items-center justify-between">
				{#if active.linkedinUrl}
					<a
						href={active.linkedinUrl}
						target="_blank"
						rel="noopener noreferrer"
						class="text-muted-foreground hover:text-foreground text-xs font-medium underline underline-offset-2 transition-colors"
					>
						View on LinkedIn
					</a>
				{:else}
					<span></span>
				{/if}
				<button
					type="button"
					class="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
					onclick={close}
				>
					Close
				</button>
			</footer>
		</article>
	{/if}
</dialog>
