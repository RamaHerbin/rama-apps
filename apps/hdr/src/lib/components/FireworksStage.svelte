<script lang="ts">
	import { onMount } from 'svelte';
	import { FireworksHdr } from 'fancy-ui-svelte';
	import type { FireworksHandle } from '$lib/engine/types.js';

	let {
		onready
	}: {
		/**
		 * Fires once the engine has settled. `handle` is null when no GPU path
		 * was available — the stage then shows the static hero instead.
		 */
		onready: (stage: {
			handle: FireworksHandle | null;
			canvas: HTMLCanvasElement | null;
		}) => void;
	} = $props();

	/** Cool→warm brand hues; the engine sorts them into its ping-pong sweep. */
	const PALETTE_HEX = ['#ff2fd6', '#a142ff', '#3d5bff', '#42cfff'];

	let container: HTMLDivElement | undefined = $state();
	let engineLive = $state(true);
	let settled = false;

	/** Fire `onready` exactly once — from FireworksHdr's `onReady`, or the fallback. */
	function settle(handle: FireworksHandle | null) {
		if (settled) return;
		settled = true;
		engineLive = handle !== null;
		// FireworksHdr owns the canvas; hand it up for aspect measurement.
		const canvas = container?.querySelector('canvas') ?? null;
		onready({ handle, canvas });
	}

	onMount(() => {
		// FireworksHdr only calls onReady when the WebGPU engine initialises. If
		// no GPU path comes up it stays silent — after a generous grace period
		// assume no engine and fall back to the static hero (the verdict then
		// reports renderLevel "none"). A real WebGPU init is well under a second,
		// so this never misfires on a working display.
		const timer = setTimeout(() => settle(null), 4000);
		return () => clearTimeout(timer);
	});
</script>

<!-- Full-viewport background layer, below the page content (main is z-10). The
     app drives the intro and click-to-launch, so the component runs
     non-interactive with its ambient scheduler off until the page enables it. -->
<div bind:this={container} class="fixed inset-0 z-0" class:hidden={!engineLive} aria-hidden="true">
	<FireworksHdr
		hdr
		interactive={false}
		ambient={false}
		exposure={2.6}
		palette={PALETTE_HEX}
		quality="auto"
		respectReducedMotion
		onReady={settle}
	/>
</div>

{#if !engineLive}
	<div class="stage-fallback" aria-hidden="true">
		<span class="fallback-mark">HDR?</span>
	</div>
{/if}
