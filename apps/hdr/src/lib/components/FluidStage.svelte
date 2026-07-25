<script lang="ts">
	import { onMount } from 'svelte';
	import { createFluid } from '$lib/engine/create-fluid.js';
	import { DEFAULT_FLUID_OPTIONS, type FluidHandle } from '$lib/engine/types.js';
	import { hexToRgb, type ColorRGB } from '$lib/engine/fluid-shared.js';

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
	const PALETTE = ['#a142ff', '#42cfff', '#ff2fd6'].map(hexToRgb);

	let colorIndex = 0;

	/** Cycles the palette in order so the trace paints all three, not a mush. */
	function nextColor(): ColorRGB {
		const base = PALETTE[colorIndex++ % PALETTE.length];
		const jitter = 0.8 + Math.random() * 0.25;
		return { r: base.r * jitter, g: base.g * jitter, b: base.b * jitter };
	}

	let canvas: HTMLCanvasElement | undefined = $state();
	let engineLive = $state(true);

	onMount(() => {
		let handle: FluidHandle | null = null;
		let disposed = false;

		(async () => {
			const el = canvas;
			try {
				if (!el) throw new Error('canvas missing');
				// Give the engine a correctly sized buffer for its first frame; it
				// owns every resize after that.
				const dpr = Math.min(window.devicePixelRatio || 1, 2);
				el.width = Math.max(1, Math.floor(el.clientWidth * dpr));
				el.height = Math.max(1, Math.floor(el.clientHeight * dpr));
				// Slower dye dissipation + a thinner splat than the library defaults:
				// the traced "HDR?" must stay legible on screen until the last letter
				// lands, and thick blobs smear the glyphs into clouds.
				handle = await createFluid(el, {
					...DEFAULT_FLUID_OPTIONS,
					densityDissipation: 1.1,
					splatRadius: 0.05,
					splatForce: 2800,
					generateColor: nextColor
				});
			} catch (err) {
				console.warn('[hdr] fluid engine unavailable', err);
				handle = null;
			}
			if (disposed) {
				handle?.cleanup();
				return;
			}
			engineLive = handle !== null;
			onready({ handle, canvas: handle ? (el ?? null) : null, nextColor });
		})();

		return () => {
			disposed = true;
			handle?.cleanup();
		};
	});
</script>

<!-- The engine attaches its own window-level pointer listeners, so the canvas
     itself never needs to receive events. -->
<canvas
	bind:this={canvas}
	class={engineLive ? 'fixed inset-0 z-0 block h-full w-full select-none' : 'hidden'}
	aria-hidden="true"
></canvas>

{#if !engineLive}
	<div class="stage-fallback" aria-hidden="true">
		<span class="fallback-mark">HDR?</span>
	</div>
{/if}

<style>
	canvas {
		/* Belt and braces: keep pointer events on the window, never the canvas. */
		pointer-events: none;
		touch-action: none;
	}
</style>
