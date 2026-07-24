<script lang="ts">
	import { onMount } from "svelte";
	import { createMotionGlow, type MotionGlow, type NeonColor } from "./motion-glow";

	let canvasEl = $state<HTMLCanvasElement | null>(null);
	let color = $state<NeonColor>("blue");
	let debug = $state(false);
	let error = $state<string | null>(null);

	let glow: MotionGlow | null = null;
	const colors: NeonColor[] = ["blue", "red"];

	onMount(() => {
		let cancelled = false;
		(async () => {
			if (!canvasEl) return;
			try {
				const instance = await createMotionGlow(canvasEl);
				if (cancelled) {
					instance.destroy();
					return;
				}
				glow = instance;
				glow.setColor(color);
				glow.setDebug(debug);
			} catch (e) {
				error = e instanceof Error ? e.message : String(e);
			}
		})();
		return () => {
			cancelled = true;
			glow?.destroy();
			glow = null;
		};
	});

	function pickColor(c: NeonColor) {
		color = c;
		glow?.setColor(c);
	}

	function toggleDebug() {
		debug = !debug;
		glow?.setDebug(debug);
	}
</script>

<div
	class="fixed top-4 left-1/2 z-[300] flex -translate-x-1/2 gap-2 rounded-full bg-black/70 px-4 py-2 backdrop-blur"
>
	{#each colors as c (c)}
		<button
			class="rounded-full px-3 py-1 text-sm font-medium capitalize transition-colors {color === c &&
			!debug
				? 'bg-white text-black'
				: 'text-white/70 hover:text-white'}"
			onclick={() => pickColor(c)}
		>
			{c}
		</button>
	{/each}
	<button
		class="rounded-full px-3 py-1 text-sm font-medium transition-colors {debug
			? 'bg-white text-black'
			: 'text-white/70 hover:text-white'}"
		onclick={toggleDebug}
	>
		mask
	</button>
</div>

<!--
	fixed inset-0 (not h-[100svh] in flow): the shared photo layout wraps routes
	in <main class="pt-16"> between a fixed header and a footer, which would
	offset the canvas below the header and make the page scroll. The playground
	overlays all of that for a true full-screen canvas.
-->
<section class="fixed inset-0 z-[100] overflow-hidden bg-neutral-950">
	{#if error}
		<div class="flex h-full w-full items-center justify-center px-6 text-center">
			<p class="max-w-md text-sm text-white/70">
				WebGPU required — {error}
			</p>
		</div>
	{:else}
		<canvas bind:this={canvasEl} class="h-full w-full"></canvas>
	{/if}
</section>
