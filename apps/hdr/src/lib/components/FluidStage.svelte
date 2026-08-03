<script lang="ts">
	import { onMount } from 'svelte';
	import { FluidCursor, type FluidCursorHandle } from 'fancy-ui-svelte';
	import type { FluidHandle, ColorRGB } from '$lib/engine/types.js';

	let {
		onready
	}: {
		/**
		 * Fires once the engine has settled. `handle` is null when no GPU path
		 * was available — the stage then shows the static hero instead.
		 */
		onready: (stage: {
			handle: FluidHandle | null;
			canvas: HTMLCanvasElement | null;
			nextColor: () => ColorRGB;
		}) => void;
	} = $props();

	/** Hot, wide-gamut hues — the ones an HDR display can actually show off. */
	const PALETTE_HEX = ['#a142ff', '#42cfff', '#ff2fd6'];
	const PALETTE = PALETTE_HEX.map(hexToRgb);

	function hexToRgb(hex: string): ColorRGB {
		const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		if (!m) return { r: 1, g: 1, b: 1 };
		return {
			r: parseInt(m[1], 16) / 255,
			g: parseInt(m[2], 16) / 255,
			b: parseInt(m[3], 16) / 255
		};
	}

	let colorIndex = 0;

	/** Cycles the palette in order so the trace paints all three, not a mush. */
	function nextColor(): ColorRGB {
		const base = PALETTE[colorIndex++ % PALETTE.length];
		const jitter = 0.8 + Math.random() * 0.25;
		return { r: base.r * jitter, g: base.g * jitter, b: base.b * jitter };
	}

	let container: HTMLDivElement | undefined = $state();
	let engineLive = $state(true);
	let settled = false;

	// Touch-first or narrow viewports get a lighter simulation: phone GPUs
	// throttle hard on sustained full-res fluid, and the visual difference at
	// phone sizes is negligible. Evaluated once, pre-mount (false during SSR).
	const lightStage =
		typeof window !== 'undefined' &&
		(window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 640);
	// Desktop values match FluidCursor's own defaults (128 / 1440).
	const SIM_RESOLUTION = lightStage ? 96 : 128;
	const DYE_RESOLUTION = lightStage ? 512 : 1440;

	/** Fire `onready` exactly once — from FluidCursor's `onReady`, or the fallback. */
	function settle(handle: FluidHandle | null) {
		if (settled) return;
		settled = true;
		engineLive = handle !== null;
		// FluidCursor owns the canvas; hand it up for aspect measurement.
		const canvas = container?.querySelector('canvas') ?? null;
		onready({ handle, canvas, nextColor });
	}

	// FluidCursor hands us moveTo/penUp/burst + the real renderLevel once its
	// engine is live. It owns its own lifecycle (unmounting it tears the engine
	// down), so the app-side cleanup is a no-op.
	function handleReady(h: FluidCursorHandle) {
		settle({
			moveTo: h.moveTo,
			penUp: h.penUp,
			burst: h.burst,
			renderLevel: h.renderLevel,
			cleanup: () => {}
		});
	}

	onMount(() => {
		// FluidCursor only calls onReady when a GPU path initialised. If neither
		// WebGPU nor WebGL is available it stays silent — after a generous grace
		// period assume no engine and fall back to the static hero (the verdict
		// then reports renderLevel "none"). A real WebGPU init is well under a
		// second, so this never misfires on a working display.
		const timer = setTimeout(() => settle(null), 4000);
		return () => clearTimeout(timer);
	});
</script>

<!-- Full-viewport background layer, below the page content (main is z-10). The
     engine attaches its own window-level pointer listeners, so a deliberate
     mouse move still splats even though the autopilot drives the trace. -->
<div bind:this={container} class="fixed inset-0 z-0" class:hidden={!engineLive} aria-hidden="true">
	<FluidCursor
		hdr
		hdrBoost={3.5}
		simResolution={SIM_RESOLUTION}
		dyeResolution={DYE_RESOLUTION}
		densityDissipation={1.1}
		splatRadius={0.05}
		splatForce={2800}
		fluidColors={PALETTE_HEX}
		colorIntensity={1}
		onReady={handleReady}
	/>
</div>

{#if !engineLive}
	<div class="stage-fallback" aria-hidden="true">
		<span class="fallback-mark">HDR?</span>
	</div>
{/if}
