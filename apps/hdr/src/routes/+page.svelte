<script lang="ts">
	import { onMount } from 'svelte';
	import FluidStage from '$lib/components/FluidStage.svelte';
	import GlassPanel from '$lib/components/GlassPanel.svelte';
	import EyebrowBadge from '$lib/components/EyebrowBadge.svelte';
	import VerdictCard from '$lib/components/VerdictCard.svelte';
	import ProofStrip from '$lib/components/ProofStrip.svelte';
	import ReplayButton from '$lib/components/ReplayButton.svelte';
	import SiteFooter from '$lib/components/SiteFooter.svelte';
	import type { FluidHandle, RenderLevel, ColorRGB } from '$lib/engine/types.js';
	import { HDR_GLYPHS, layoutText, type Stroke } from '$lib/autopilot/letters.js';
	import { createAutopilot, type Autopilot } from '$lib/autopilot/scheduler.js';
	import { readDisplaySignals, watchDisplaySignals, type DisplaySignals } from '$lib/hdr/detect.js';
	import { computeVerdict, type Verdict } from '$lib/hdr/verdict.js';

	type Phase = 'boot' | 'tracing' | 'verdict';

	let phase = $state<Phase>('boot');
	let verdict = $state<Verdict | null>(null);
	/** True on touch-first devices — the fluid hint speaks finger, not cursor. */
	let coarsePointer = $state(false);
	/** Once the answer has been shown it stays on screen, replays included. */
	let revealed = $state(false);
	let engineReady = $state(false);
	/** The autopilot exists, so "trace it again" has something to replay. */
	let canTrace = $state(false);

	let handle: FluidHandle | null = null;
	let autopilot: Autopilot | null = null;
	let stageCanvas: HTMLCanvasElement | null = null;
	let nextColor: (() => ColorRGB) | null = null;
	// Set once the component is torn down. `autopilot.stop()` resolves the
	// awaited playTrace() promise, so a trace suspended at that await would
	// otherwise resume post-teardown and start the ambient rAF loop on an
	// already-cleaned handle.
	let disposed = false;

	const verdictKey = $derived(verdict ? verdict.case : 'pending');
	const statusLabel = $derived(
		phase === 'boot'
			? 'waking the gpu'
			: phase === 'tracing'
				? 'measuring'
				: engineReady
					? 'measured'
					: 'no gpu render'
	);

	/**
	 * Every call into the engine / autopilot / verdict modules is guarded: a
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

	/** Small upward pop where the pen finished — the dot of the question mark. */
	function popQuestionDot(strokes: Stroke[]) {
		const tip = strokes[strokes.length - 1]?.at(-1);
		if (!tip || !handle || !nextColor) return;
		// One splat has to hold its own against a five-second trace, so the dot
		// gets the same brightness push the engine gives a click. Same hue.
		const base = nextColor();
		const color = { r: base.r * 4, g: base.g * 4, b: base.b * 4 };
		// Top-left origin, so a negative dy sends the impulse upward.
		run('burst', () => handle?.burst(tip.x, tip.y, (Math.random() - 0.5) * 2, -6, color));
	}

	function buildStrokes(): Stroke[] {
		const width = stageCanvas?.clientWidth || window.innerWidth;
		const height = stageCanvas?.clientHeight || window.innerHeight;
		return attempt(
			'layoutText',
			() =>
				// Big letters, thin splats: the dye blob around each stroke is wide,
				// so glyphs must dwarf it or they smear into clouds.
				layoutText([HDR_GLYPHS.H, HDR_GLYPHS.D, HDR_GLYPHS.R, HDR_GLYPHS['?']], {
					center: { x: 0.5, y: 0.4 },
					height: 0.44,
					gap: 0.1,
					aspect: width / height
				}),
			[] as Stroke[]
		);
	}

	async function trace() {
		if (!handle || !autopilot) {
			reveal();
			return;
		}
		const strokes = buildStrokes();
		if (strokes.length === 0) {
			reveal();
			return;
		}
		phase = 'tracing';
		try {
			await autopilot.playTrace(strokes);
		} catch (err) {
			console.warn('[hdr] playTrace', err);
		}
		// Teardown (or a cancelled trace) resolves the await above — don't
		// resurrect work, and above all don't start the ambient loop, after the
		// component is gone.
		if (disposed) return;
		popQuestionDot(strokes);
		reveal();
		run('startAmbient', () => autopilot?.startAmbient());
	}

	function handleStage(stage: {
		handle: FluidHandle | null;
		canvas: HTMLCanvasElement | null;
		nextColor: () => ColorRGB;
	}) {
		handle = stage.handle;
		stageCanvas = stage.canvas;
		nextColor = stage.nextColor;
		engineReady = stage.handle !== null;

		// No engine, or the visitor asked for less motion: answer immediately.
		// The engine stays mounted either way, so a deliberate mouse move still
		// splats — it just never performs on its own.
		if (!handle || prefersReducedMotion()) {
			reveal();
			return;
		}

		// 3.2s trace: fast enough that the first letter is still on screen when
		// the question mark lands (dye dissipation erases slower strokes).
		autopilot = attempt<Autopilot | null>(
			'createAutopilot',
			() => createAutopilot(handle!, { traceDurationMs: 3200 }),
			null
		);
		canTrace = autopilot !== null;
		trace();
	}

	function replay() {
		if (phase === 'tracing') return;
		trace();
	}

	onMount(() => {
		const notifyActive = () => autopilot?.notifyUserActive();
		window.addEventListener('mousemove', notifyActive, { passive: true });
		window.addEventListener('touchstart', notifyActive, { passive: true });

		// Word the fluid hint for the input the device actually has.
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
			window.removeEventListener('mousemove', notifyActive);
			window.removeEventListener('touchstart', notifyActive);
			coarseQuery.removeEventListener('change', onCoarseChange);
			run('unwatch', unwatch);
			run('autopilot.stop', () => autopilot?.stop());
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
		content="Watch a GPU fluid simulation write the question, then find out in five seconds."
	/>
	<meta name="twitter:card" content="summary" />
</svelte:head>

<FluidStage onready={handleStage} />

<main class="page-shell relative z-10 flex min-h-[100svh] flex-col">
	<h1 class="sr-only">Is your screen HDR?</h1>

	{#if phase !== 'verdict'}
		<div class="topchrome flex items-baseline justify-between gap-4">
			<p class="eyebrow">
				<EyebrowBadge live={phase === 'tracing'} yes={verdict?.yes === true} /> display probe
			</p>
			<p class="eyebrow">{statusLabel}</p>
		</div>
	{/if}

	<div
		class="bigcard-holder flex flex-1 flex-col"
		data-tracing={phase === 'tracing'}
		aria-live="polite"
	>
		{#if revealed && verdict}
			<GlassPanel verdictCase={verdict.case}>
				<VerdictCard {verdict} {statusLabel} live={phase === 'tracing'}>
					{#snippet swatches()}
						<ProofStrip />
					{/snippet}
					{#snippet actions()}
						{#if engineReady}
							<!-- Reduced motion means there is no autopilot to re-run; the fluid
							     still answers to a deliberate cursor, so the hint stays. -->
							{#if canTrace}
								<ReplayButton onreplay={replay} disabled={phase === 'tracing'} />
							{/if}
							<p class="caption sm:text-right">
								{coarsePointer
									? 'Drag your finger. The fluid follows.'
									: 'Move your cursor. The fluid follows.'}
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
