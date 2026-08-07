<script lang="ts">
	import { onMount } from 'svelte';
	import { createLakeScene, type LakeScene } from './lake-scene';

	let canvasEl = $state<HTMLCanvasElement | null>(null);
	let error = $state<string | null>(null);
	let dream = $state(true);
	let captionIndex = $state(0);

	let lake: LakeScene | null = null;

	// Floating hand-written lines, lyrics-style (ours, not theirs).
	const captions = [
		'un après-midi à Chicago',
		'bouge la souris — je disparais',
		'reste immobile — je reviens',
		'la guitare face au Bean'
	];

	onMount(() => {
		let cancelled = false;
		const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		(async () => {
			if (!canvasEl) return;
			try {
				const instance = await createLakeScene(canvasEl, {
					photoUrl: '/IMG_0318.jpg',
					reducedMotion
				});
				if (cancelled) {
					instance.destroy();
					return;
				}
				lake = instance;
				lake.setDream(dream);
			} catch (e) {
				error = e instanceof Error ? e.message : String(e);
			}
		})();

		const captionTimer = setInterval(() => {
			captionIndex = (captionIndex + 1) % captions.length;
		}, 5000);

		return () => {
			cancelled = true;
			clearInterval(captionTimer);
			lake?.destroy();
			lake = null;
		};
	});

	function toggleDream() {
		dream = !dream;
		lake?.setDream(dream);
	}
</script>

<svelte:head>
	<title>test-lake</title>
</svelte:head>

<div
	class="fixed top-4 left-1/2 z-[300] flex -translate-x-1/2 gap-2 rounded-full bg-black/50 px-4 py-2 backdrop-blur"
>
	<button
		class="rounded-full px-3 py-1 text-sm font-medium transition-colors {dream
			? 'bg-white text-black'
			: 'text-white/70 hover:text-white'}"
		onclick={toggleDream}
	>
		rêve
	</button>
	<button
		class="rounded-full px-3 py-1 text-sm font-medium transition-colors {!dream
			? 'bg-white text-black'
			: 'text-white/70 hover:text-white'}"
		onclick={toggleDream}
	>
		calme
	</button>
</div>

<!--
	fixed inset-0 like test-motion: the shared photo layout wraps routes in a
	padded <main> under a fixed header — the playground overlays all of it.
-->
<section class="fixed inset-0 z-[100] overflow-hidden bg-neutral-950">
	{#if error}
		<div class="flex h-full w-full items-center justify-center px-6 text-center">
			<p class="max-w-md text-sm text-white/70">WebGL required — {error}</p>
		</div>
	{:else}
		<canvas bind:this={canvasEl} class="h-full w-full"></canvas>

		{#key captionIndex}
			<p class="caption pointer-events-none absolute bottom-[14%] left-1/2 z-[200] -translate-x-1/2">
				{captions[captionIndex]}
			</p>
		{/key}
	{/if}
</section>

<style>
	.caption {
		font-family: 'Snell Roundhand', 'Savoye LET', 'Segoe Script', cursive;
		font-size: clamp(1.6rem, 4vw, 2.6rem);
		color: rgba(255, 252, 240, 0.92);
		text-shadow: 0 2px 18px rgba(20, 30, 40, 0.55);
		white-space: nowrap;
		animation: drift 5s ease-in-out both;
	}

	@keyframes drift {
		0% {
			opacity: 0;
			transform: translate(-50%, 14px) rotate(-1.5deg);
		}
		12%,
		78% {
			opacity: 1;
			transform: translate(-50%, 0) rotate(0deg);
		}
		100% {
			opacity: 0;
			transform: translate(-50%, -12px) rotate(1deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.caption {
			animation: none;
		}
	}
</style>
