<script module lang="ts">
	// Module-level singleton: only one VideoPlayer may play at a time.
	let currentlyPlaying: HTMLVideoElement | null = null;

	/** Register `el` as the active video, pausing any other that was playing. */
	export function claimPlayback(el: HTMLVideoElement): void {
		if (currentlyPlaying && currentlyPlaying !== el) {
			currentlyPlaying.pause();
		}
		currentlyPlaying = el;
	}

	function releasePlayback(el: HTMLVideoElement): void {
		if (currentlyPlaying === el) currentlyPlaying = null;
	}
</script>

<script lang="ts">
	import { onMount, tick } from "svelte";
	import { cn } from "$lib/utils.js";

	interface Props {
		poster: string;
		webm: string;
		mp4: string;
		/** used for the poster alt text and play-button aria-label */
		title?: string;
		/** enable muted inline preview on hover (desktop, fine pointer, motion ok) */
		hoverPreview?: boolean;
		/** centered play-button diameter in px */
		playSize?: 88 | 72 | 60 | 52;
		aspect?: string;
		class?: string;
	}

	let {
		poster,
		webm,
		mp4,
		title = "",
		hoverPreview = false,
		playSize = 72,
		aspect = "16 / 9",
		class: className
	}: Props = $props();

	// activated = user gesture → full playback with sound + controls
	let activated = $state(false);
	// previewing = transient muted hover preview
	let previewing = $state(false);
	let videoEl: HTMLVideoElement | undefined = $state();

	// desktop-only, motion-allowed hover previews
	let canHoverPreview = $state(false);

	const showVideo = $derived(activated || previewing);
	const iconSize = $derived(Math.round(playSize * 0.32));

	onMount(() => {
		canHoverPreview =
			hoverPreview &&
			typeof window !== "undefined" &&
			window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
			!window.matchMedia("(prefers-reduced-motion: reduce)").matches;

		return () => {
			if (videoEl) releasePlayback(videoEl);
		};
	});

	async function activate(): Promise<void> {
		previewing = false;
		activated = true;
		await tick();
		if (videoEl) {
			claimPlayback(videoEl);
			videoEl.muted = false;
			void videoEl.play().catch(() => {});
		}
	}

	async function startPreview(): Promise<void> {
		if (activated || !canHoverPreview) return;
		previewing = true;
		await tick();
		if (videoEl) {
			claimPlayback(videoEl);
			videoEl.muted = true;
			void videoEl.play().catch(() => {});
		}
	}

	function endPreview(): void {
		if (activated) return;
		// unmounting the element resets playback position
		previewing = false;
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class={cn("absolute inset-0", className)}
	onpointerenter={startPreview}
	onpointerleave={endPreview}
>
	{#if showVideo}
		<!-- svelte-ignore a11y_media_has_caption -->
		<video
			bind:this={videoEl}
			{poster}
			controls={activated}
			muted={!activated}
			playsinline
			preload="none"
			class="absolute inset-0 h-full w-full bg-black object-contain"
		>
			<source src={webm} type="video/webm" />
			<source src={mp4} type="video/mp4" />
		</video>
	{:else}
		<img
			src={poster}
			alt={title ? `${title} — video poster` : ""}
			class="absolute inset-0 h-full w-full bg-black object-contain"
			loading="lazy"
		/>
	{/if}

	{#if !activated}
		<button
			type="button"
			onclick={activate}
			aria-label={title ? `Play ${title}` : "Play video"}
			class="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-[oklch(0.1_0_0_/_0.5)] text-white backdrop-blur-md transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-[1.12] hover:bg-[oklch(0.1_0_0_/_0.75)] focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none motion-reduce:transition-none motion-reduce:hover:scale-100"
			style="width: {playSize}px; height: {playSize}px;"
		>
			<svg
				width={iconSize}
				height={iconSize}
				viewBox="0 0 24 24"
				fill="currentColor"
				aria-hidden="true"
				style="margin-left: {Math.round(iconSize * 0.14)}px;"
			>
				<path d="M8 5v14l11-7z"></path>
			</svg>
		</button>
	{/if}
</div>
