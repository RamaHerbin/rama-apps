<script lang="ts">
	import { onMount } from 'svelte';
	import { startHdrSwatch } from '$lib/hdr/hdr-swatch.js';

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

<div class="flex flex-col gap-5">
	<div>
		<!-- The two whites share an edge on purpose: on an HDR display the seam
		     between them is visible, on an SDR one there is nothing to see. -->
		<div class="chart max-w-[15rem]">
			<span class="patch" style="background: #fff"></span>
			<canvas class={hdrSwatch ? 'patch' : 'hidden'} bind:this={swatch} aria-hidden="true"></canvas>
			{#if !hdrSwatch}
				<span class="note">not available<br />in this browser</span>
			{/if}
		</div>
		<div class="chart-labels max-w-[15rem]">
			<span class="chart-label">SDR white</span>
			<span class="chart-label">HDR white &times;4</span>
		</div>
		<p class="caption mt-3">
			See two different whites? That's HDR. Look identical? You're in SDR.
		</p>
	</div>

	<div>
		<div class="chart chart-sm max-w-[9rem]">
			<span class="patch" style="background: #f00"></span>
			<!-- sRGB first: a browser without color() drops the second declaration and
			     paints the same red, which is itself the honest answer. -->
			<span class="patch" style="background: #f00; background: color(display-p3 1 0 0)"></span>
		</div>
		<div class="chart-labels max-w-[9rem]">
			<span class="chart-label">sRGB red</span>
			<span class="chart-label">P3 red</span>
		</div>
		<p class="caption mt-3">Bonus: wide gamut.</p>
	</div>
</div>
