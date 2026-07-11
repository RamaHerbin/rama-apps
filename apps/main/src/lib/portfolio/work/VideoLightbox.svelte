<script lang="ts">
	import { claimPlayback } from "./VideoPlayer.svelte";

	interface Props {
		/** two-way bindable open state */
		open?: boolean;
		/** called after the overlay requests to close */
		onClose?: () => void;
		webm?: string;
		mp4?: string;
		/** mono file label shown in the header, e.g. "BNF-RICHELIEU_DEMO.MP4" */
		fileLabel?: string;
		/** accessible dialog title */
		title?: string;
	}

	let {
		open = $bindable(false),
		onClose,
		webm,
		mp4,
		fileLabel = "",
		title = "Video"
	}: Props = $props();

	let closeBtn = $state<HTMLButtonElement>();

	function close(): void {
		open = false;
		onClose?.();
	}

	$effect(() => {
		if (!open || typeof document === "undefined") return;

		const previouslyFocused = document.activeElement as HTMLElement | null;
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";

		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") close();
		};
		window.addEventListener("keydown", onKey);

		// move focus into the dialog
		closeBtn?.focus();

		return () => {
			window.removeEventListener("keydown", onKey);
			document.body.style.overflow = previousOverflow;
			previouslyFocused?.focus?.();
		};
	});
</script>

{#if open}
	<div
		role="dialog"
		aria-modal="true"
		aria-label={title}
		tabindex="-1"
		onclick={close}
		onkeydown={(e) => {
			if (e.key === "Escape") close();
		}}
		class="fixed inset-0 z-[2000] flex items-center justify-center bg-[oklch(0.08_0_0_/_0.88)] p-6 backdrop-blur-2xl sm:p-12 motion-safe:animate-[fade-in_250ms_ease-out]"
	>
		<!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
		<div
			onclick={(e) => e.stopPropagation()}
			class="relative w-[min(1280px,92vw)]"
		>
			<div
				class="mb-4 flex items-center justify-between font-mono text-[11px] tracking-[0.12em] text-white/75"
			>
				<span>
					<span class="text-accent-work mr-2.5" aria-hidden="true">●</span>{fileLabel}
				</span>
				<button
					bind:this={closeBtn}
					type="button"
					onclick={close}
					aria-label="Close video"
					class="flex items-center gap-2 rounded-full border border-white/25 px-4 py-2 font-mono text-[11px] tracking-[0.12em] text-white/85 transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
				>
					CLOSE ✕
				</button>
			</div>
			<!-- svelte-ignore a11y_media_has_caption -->
			<video
				controls
				autoplay
				playsinline
				{title}
				onplay={(e) => claimPlayback(e.currentTarget)}
				class="aspect-video w-full rounded-[14px] border border-white/15 bg-[oklch(0.12_0_0)] object-contain shadow-[0_40px_120px_oklch(0_0_0_/_0.6)]"
			>
				{#if webm}<source src={webm} type="video/webm" />{/if}
				{#if mp4}<source src={mp4} type="video/mp4" />{/if}
			</video>
		</div>
	</div>
{/if}
