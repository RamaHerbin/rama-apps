<script lang="ts">
	import { onMount } from 'svelte';
	import { startHdrSwatch } from '$lib/hdr/hdr-swatch.js';
	import { BorderBeam } from 'fancy-ui-svelte';

	let swatch: HTMLCanvasElement | undefined = $state();
	/** False once we know the browser cannot paint a brighter-than-white patch. */
	let hdrSwatch = $state(true);

	onMount(() => {
		let stop: (() => void) | null = null;
		let disposed = false;

		(async () => {
			const el = swatch;
			try {
				if (!el) throw new Error('canvas missing');
				stop = await startHdrSwatch(el, 4);
			} catch (err) {
				console.warn('[hdr] hdr swatch unavailable', err);
				stop = null;
			}
			if (disposed) {
				stop?.();
				return;
			}
			hdrSwatch = stop !== null;
		})();

		return () => {
			disposed = true;
			stop?.();
		};
	});
</script>

<div class="flex flex-col gap-4">
	<!-- Both tiles paint the same radial highlight shape on purpose: the left
	     one is a CSS #fff, the right one a WebGPU canvas cleared brighter than
	     white. On an HDR display the right orb reads visibly brighter; on SDR
	     (or a browser that clamps) the two look identical. -->
	<div class="swatch-grid">
		<div class="swatch-tile">
			<span class="swatch-orb" aria-hidden="true"></span>
			<span class="swatch-label">SDR &middot; 100 nits</span>
		</div>
		<div class="swatch-tile swatch-tile-hdr">
			<BorderBeam size={48} duration={7} borderWidth={1.5} colorFrom="#a142ff" colorTo="#ff2fd6" />
			<canvas
				class={hdrSwatch ? 'swatch-canvas' : 'hidden'}
				bind:this={swatch}
				aria-hidden="true"
			></canvas>
			{#if !hdrSwatch}
				<span class="swatch-note">not available<br />in this browser</span>
			{/if}
			<span class="swatch-label">HDR &middot; 1000+ nits</span>
		</div>
	</div>
	<p class="caption">See two different whites? That's HDR. Look identical? You're in SDR.</p>

	<div>
		<div class="gamut-strip">
			<span class="gamut-patch" style="background: #f00"></span>
			<!-- sRGB first: a browser without color() drops the second declaration and
			     paints the same red, which is itself the honest answer. -->
			<span class="gamut-patch" style="background: #f00; background: color(display-p3 1 0 0)"
			></span>
		</div>
		<div class="gamut-labels">
			<span class="chart-label">sRGB red</span>
			<span class="chart-label">P3 red</span>
		</div>
		<p class="caption mt-2">Bonus: wide gamut.</p>
	</div>
</div>
