<script lang="ts">
	import { onMount } from 'svelte';
	import FireworksStage from '$lib/components/FireworksStage.svelte';
	import GlassPanel from '$lib/components/GlassPanel.svelte';
	import EyebrowBadge from '$lib/components/EyebrowBadge.svelte';
	import VerdictCard from '$lib/components/VerdictCard.svelte';
	import ProofStrip from '$lib/components/ProofStrip.svelte';
	import ReplayButton from '$lib/components/ReplayButton.svelte';
	import SiteFooter from '$lib/components/SiteFooter.svelte';
	import type { FireworksHandle, RenderLevel } from '$lib/engine/types.js';
	import {
		buildGlyphTargets,
		fitGlyphHeight,
		GLYPH_CENTER_X,
		GLYPH_GAP,
		type GlyphTarget
	} from '$lib/fireworks/glyph-targets.js';
	import { createChoreographer, type Choreographer } from '$lib/fireworks/choreographer.js';
	import { readDisplaySignals, watchDisplaySignals, type DisplaySignals } from '$lib/hdr/detect.js';
	import { computeVerdict, type Verdict } from '$lib/hdr/verdict.js';

	type Phase = 'boot' | 'show' | 'verdict';

	/** Structurally identical to the engine's `Rect` — no import needed to call `setKeepClear`. */
	type KeepClearRect = { x0: number; y0: number; x1: number; y1: number };
	// Spec §4.5 fallback rects — used until the card can be measured, or if a
	// measurement ever comes back degenerate (zero-size, detached, etc).
	const KEEP_CLEAR_FALLBACK_DESKTOP: KeepClearRect = { x0: 0.28, y0: 0.3, x1: 0.72, y1: 0.82 };
	const KEEP_CLEAR_FALLBACK_MOBILE: KeepClearRect = { x0: 0.1, y0: 0.22, x1: 0.9, y1: 0.9 };
	const KEEP_CLEAR_MARGIN = 0.03;
	const MOBILE_BREAKPOINT = 640; // matches the page's own `sm:` usage

	let phase = $state<Phase>('boot');
	let verdict = $state<Verdict | null>(null);
	/** True on touch-first devices — the sky invitation speaks tap, not click. */
	let coarsePointer = $state(false);
	/** Once the answer has been shown it stays on screen, replays included. */
	let revealed = $state(false);
	let engineReady = $state(false);
	/** The choreographer exists, so "light it again" has an intro to replay. */
	let canReplay = $state(false);
	/** The verdict card's holder — measured into a keep-clear rect for the sky. */
	let bigcardHolderEl: HTMLDivElement | undefined = $state();

	let handle: FireworksHandle | null = null;
	let choreographer: Choreographer | null = null;
	let stageCanvas: HTMLCanvasElement | null = null;
	let resizeTimer: ReturnType<typeof setTimeout> | undefined;
	// Set once the component is torn down. `choreographer.stop()` resolves the
	// awaited playIntro() promise, so an intro suspended at that await would
	// otherwise resume post-teardown and drive an already-cleaned handle.
	let disposed = false;

	const verdictKey = $derived(verdict ? verdict.case : 'pending');
	const statusLabel = $derived(
		phase === 'boot'
			? 'waking the gpu'
			: phase === 'show'
				? 'launching'
				: engineReady
					? 'measured'
					: 'no gpu render'
	);

	/** Real clock/rAF for the choreographer; a fake pair drives it under test. */
	const clockDeps = {
		clock: () => (typeof performance !== 'undefined' ? performance.now() : Date.now()),
		raf: (cb: FrameRequestCallback) => requestAnimationFrame(cb),
		caf: (id: number) => cancelAnimationFrame(id)
	};

	/**
	 * Every call into the engine / choreographer / verdict modules is guarded: a
	 * throw in any one of them must not cost the visitor the whole page.
	 */
	function attempt<T>(label: string, fn: () => T, fallback: T): T {
		try {
			return fn();
		} catch (err) {
			console.warn(`[hdr] ${label}`, err);
			return fallback;
		}
	}

	function run(label: string, fn: () => void): void {
		try {
			fn();
		} catch (err) {
			console.warn(`[hdr] ${label}`, err);
		}
	}

	function prefersReducedMotion(): boolean {
		return (
			typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
		);
	}

	function currentRenderLevel(): RenderLevel {
		return handle ? handle.renderLevel : 'none';
	}

	/** Last-resort verdict, used only if computeVerdict throws. */
	function fallbackVerdict(signals: DisplaySignals, render: RenderLevel): Verdict {
		const yes = signals.dynamicRangeHigh && render === 'webgpu-hdr';
		return {
			case: yes ? 'true-hdr' : 'no-hdr',
			yes,
			title: yes ? 'Yes.' : 'Not today.',
			body: yes
				? 'Your screen and browser are both rendering high dynamic range.'
				: 'This screen and browser are showing you standard dynamic range.',
			detail: `render: ${render} · dynamic-range: ${signals.dynamicRangeHigh ? 'high' : 'standard'} · color-gamut: ${signals.gamutP3 ? 'p3' : 'srgb'}`
		};
	}

	function readSignals(): DisplaySignals {
		return attempt('readDisplaySignals', () => readDisplaySignals(), {
			dynamicRangeHigh: false,
			gamutP3: false
		});
	}

	function applySignals(signals: DisplaySignals) {
		const render = currentRenderLevel();
		verdict = attempt(
			'computeVerdict',
			() => computeVerdict(signals, render),
			fallbackVerdict(signals, render)
		);
	}

	function reveal() {
		applySignals(readSignals());
		phase = 'verdict';
		revealed = true;
	}

	/** "HDR?" laid out for the current viewport, ready to hand to the choreographer. */
	function buildTargets(): GlyphTarget[] {
		const width = stageCanvas?.clientWidth || window.innerWidth;
		const height = stageCanvas?.clientHeight || window.innerHeight;
		const aspect = width / height;
		// Scale the run down (and nudge it up on portrait) so "HDR?" always fits
		// the launch band instead of clamping flat against the viewport edges on a
		// narrow phone. Seeker counts are unaffected — sampling is glyph-local.
		const fit = fitGlyphHeight(aspect);
		return attempt(
			'buildGlyphTargets',
			() =>
				buildGlyphTargets({
					center: { x: GLYPH_CENTER_X, y: fit.centerY },
					height: fit.height,
					gap: GLYPH_GAP,
					aspect
				}),
			[] as GlyphTarget[]
		);
	}

	function clamp01(v: number): number {
		return Math.max(0, Math.min(1, v));
	}

	function fallbackKeepClear(): KeepClearRect {
		return window.innerWidth < MOBILE_BREAKPOINT
			? KEEP_CLEAR_FALLBACK_MOBILE
			: KEEP_CLEAR_FALLBACK_DESKTOP;
	}

	/** The card's live bounding rect, normalized to the viewport and padded. */
	function measureKeepClear(): KeepClearRect {
		if (!bigcardHolderEl) return fallbackKeepClear();
		const rect = bigcardHolderEl.getBoundingClientRect();
		const vw = window.innerWidth;
		const vh = window.innerHeight;
		if (rect.width <= 0 || rect.height <= 0 || vw <= 0 || vh <= 0) return fallbackKeepClear();
		return {
			x0: clamp01(rect.left / vw - KEEP_CLEAR_MARGIN),
			y0: clamp01(rect.top / vh - KEEP_CLEAR_MARGIN),
			x1: clamp01(rect.right / vw + KEEP_CLEAR_MARGIN),
			y1: clamp01(rect.bottom / vh + KEEP_CLEAR_MARGIN)
		};
	}

	/** Re-measure the card and hand the sky its keep-clear rect. No-op pre-reveal. */
	function applyKeepClear() {
		if (!handle || !revealed) return;
		run('setKeepClear', () =>
			handle?.setKeepClear(attempt('measureKeepClear', measureKeepClear, fallbackKeepClear()))
		);
	}

	function handleResize() {
		if (resizeTimer) clearTimeout(resizeTimer);
		resizeTimer = setTimeout(applyKeepClear, 150);
	}

	/**
	 * After the intro settles, ease down to the ambient exposure and hand the
	 * sky over to the engine's own scheduler — a short pause first, then a low
	 * steady drizzle of shells.
	 */
	function settleToAmbient() {
		window.setTimeout(() => {
			if (disposed) return;
			run('setExposure', () => handle?.setExposure(2.2));
			run('setAmbient', () => handle?.setAmbient(true, 0.35));
		}, 900);
	}

	async function playIntro() {
		if (!handle || !choreographer) return;
		phase = 'show';
		try {
			await choreographer.playIntro(buildTargets());
		} catch (err) {
			console.warn('[hdr] playIntro', err);
		}
		// Teardown (or a stopped intro) resolves the await above — don't resurrect
		// work, and above all don't touch the handle, after the component is gone.
		if (disposed) return;
		reveal();
		settleToAmbient();
	}

	function handleStage(stage: {
		handle: FireworksHandle | null;
		canvas: HTMLCanvasElement | null;
	}) {
		handle = stage.handle;
		stageCanvas = stage.canvas;
		engineReady = stage.handle !== null;

		// No engine, or the visitor asked for less motion: answer immediately.
		// The engine stays mounted either way, so a deliberate click still sends
		// a shell up — it just never performs the intro or the ambient drizzle.
		if (!handle || prefersReducedMotion()) {
			reveal();
			return;
		}

		const targets = buildTargets();
		if (targets.length === 0) {
			reveal();
			return;
		}

		choreographer = attempt<Choreographer | null>(
			'createChoreographer',
			() => createChoreographer(handle!, clockDeps),
			null
		);
		if (!choreographer) {
			reveal();
			return;
		}
		canReplay = true;
		playIntro();
	}

	function replay() {
		if (phase === 'show' || !handle || !choreographer) return;
		run('setAmbient', () => handle?.setAmbient(false));
		run('setExposure', () => handle?.setExposure(2.6));
		playIntro();
	}

	// Re-measure the card once it appears, and again on resize — the sky must
	// never learn a stale keep-clear rect and start dropping shells on the text.
	$effect(() => {
		if (revealed) requestAnimationFrame(applyKeepClear);
	});

	onMount(() => {
		// A click anywhere on the sky sends a shell toward the pointer. We listen
		// for `click`, not `pointerdown`: on touch a `pointerdown` fires even when
		// the tap turns into a scroll, so a swipe would launch a stray rocket —
		// `click` is suppressed by the browser after a scroll/drag and only fires
		// on a settled tap. Clicks on the card's own controls (buttons/links) and
		// on the revealed card surface itself are left alone — that's UI, not sky.
		// During a replay the card holder is pointer-events:none, so a click over
		// it targets the sky below and still launches, as intended.
		const launchAtPointer = (event: MouseEvent) => {
			if ((event.target as Element | null)?.closest('button, a, [role="button"], .bigcard')) return;
			if (!handle) return;
			run('launch', () =>
				handle?.launch({
					apex: { x: event.clientX / window.innerWidth, y: event.clientY / window.innerHeight },
					intensity: 'ambient'
				})
			);
		};
		window.addEventListener('click', launchAtPointer);
		window.addEventListener('resize', handleResize);

		// Word the sky invitation for the input the device actually has.
		const coarseQuery = window.matchMedia('(pointer: coarse)');
		coarsePointer = coarseQuery.matches;
		const onCoarseChange = (e: MediaQueryListEvent) => (coarsePointer = e.matches);
		coarseQuery.addEventListener('change', onCoarseChange);

		// Live re-measure: drag the window to another monitor and the answer flips.
		const unwatch = attempt(
			'watchDisplaySignals',
			() => watchDisplaySignals((signals) => applySignals(signals)),
			() => {}
		);

		return () => {
			disposed = true;
			window.removeEventListener('click', launchAtPointer);
			window.removeEventListener('resize', handleResize);
			if (resizeTimer) clearTimeout(resizeTimer);
			coarseQuery.removeEventListener('change', onCoarseChange);
			run('unwatch', unwatch);
			// FireworksHdr owns its own teardown (unmounting it cleans the engine),
			// so the app only stops the choreographer here — no handle.cleanup().
			run('choreographer.stop', () => choreographer?.stop());
		};
	});
</script>

<svelte:head>
	<title>Is your screen HDR?</title>
	<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
	<link
		rel="preload"
		href="/fonts/InterDisplay-ExtraBold.woff2"
		as="font"
		type="font/woff2"
		crossorigin="anonymous"
	/>
	<meta name="theme-color" content="#050505" />
	<meta property="og:type" content="website" />
	<meta property="og:title" content="Is your screen HDR?" />
	<meta
		property="og:description"
		content="Watch GPU fireworks burn the question into the sky, then find out in five seconds."
	/>
	<meta name="twitter:card" content="summary" />
</svelte:head>

<FireworksStage onready={handleStage} />

<main class="page-shell relative z-10 flex min-h-[100svh] flex-col">
	<h1 class="sr-only">Is your screen HDR?</h1>

	{#if phase !== 'verdict'}
		<div class="topchrome flex items-baseline justify-between gap-4">
			<p class="eyebrow">
				<EyebrowBadge live={phase === 'show'} yes={verdict?.yes === true} /> display probe
			</p>
			<p class="eyebrow">{statusLabel}</p>
		</div>
	{/if}

	<div
		class="bigcard-holder flex flex-1 flex-col"
		data-show={phase === 'show'}
		aria-live="polite"
		bind:this={bigcardHolderEl}
	>
		{#if revealed && verdict}
			<GlassPanel verdictCase={verdict.case}>
				<VerdictCard {verdict} {statusLabel} live={phase === 'show'}>
					{#snippet swatches()}
						<ProofStrip />
					{/snippet}
					{#snippet actions()}
						{#if engineReady}
							<!-- Reduced motion means there is no intro to re-run; the sky
							     still answers a deliberate click, so the hint stays. -->
							{#if canReplay}
								<ReplayButton onreplay={replay} disabled={phase === 'show'} />
							{/if}
							<p class="caption sm:text-right">
								{coarsePointer ? 'Tap the sky. Send one up.' : 'Click the sky. Send one up.'}
							</p>
						{/if}
					{/snippet}
				</VerdictCard>
			</GlassPanel>
		{/if}
	</div>

	<div class="mt-3 pt-4">
		<SiteFooter />
	</div>
</main>
