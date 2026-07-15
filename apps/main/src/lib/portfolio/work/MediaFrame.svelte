<script lang="ts">
	import type { Snippet } from "svelte";
	import { cn } from "$lib/utils.js";
	import { c } from "$lib/content/index.js";

	interface Caption {
		/** left label, e.g. "BNF-RICHELIEU_DEMO.MP4" */
		file: string;
		/** right label, e.g. "01:31" */
		duration: string;
	}

	interface Chip {
		/** content key for the chip label text, e.g. "fdp.production-media.demo-in-preparation-chip" */
		labelKey: string;
		/** blinking accent dot before the label */
		dot?: boolean;
	}

	interface Props {
		/** CSS aspect-ratio, default "16 / 9" */
		aspect?: string;
		/** bottom scrim caption row */
		caption?: Caption;
		/** top-right chip */
		chip?: Chip;
		/** centered play button diameter in px; omit for no button */
		playSize?: 88 | 72 | 60 | 52;
		/** click handler for the play button (also fired on Enter/Space) */
		onplay?: () => void;
		/** aria-label for the play button */
		playLabel?: string;
		/** fade the centre play button out while the frame is hovered (e.g. when a
		 *  hover-preview video takes over). Stays clickable. */
		fadePlayOnHover?: boolean;
		/** soft hover glow shadow (default true). false = border-color hover only */
		glow?: boolean;
		class?: string;
		/** the media itself (poster <img>, VideoPlayer, placeholder, …) */
		children?: Snippet;
	}

	let {
		aspect = "16 / 9",
		caption,
		chip,
		playSize,
		onplay,
		playLabel = "Play video",
		fadePlayOnHover = false,
		glow = true,
		class: className,
		children
	}: Props = $props();

	// play triangle scales with the button
	const iconSize = $derived(playSize ? Math.round(playSize * 0.32) : 0);
</script>

<!--
	When onplay is set the whole frame is clickable (mouse convenience); the
	centre <button> below stays the real, keyboard-focusable control.
-->
<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div
	onclick={onplay}
	class={cn(
		"border-border/60 bg-surface-raised group relative overflow-hidden rounded-[14px] border transition-[border-color,box-shadow] duration-300 hover:border-border",
		glow && "hover:shadow-[0_0_60px_oklch(0.32_0.015_80_/_0.3)]",
		onplay && "cursor-pointer",
		className
	)}
>
	<div class="relative" style="aspect-ratio: {aspect};">
		{@render children?.()}

		{#if caption}
			<div
				class="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-[oklch(0.1_0_0_/_0.85)] to-transparent px-5 pt-10 pb-3.5 font-mono text-[10px] tracking-[0.1em] text-white/75"
			>
				<span>{caption.file}</span>
				<span>{caption.duration}</span>
			</div>
		{/if}

		{#if chip}
			<div
				class="pointer-events-none absolute top-4 right-4 flex items-center gap-2 rounded-full border border-white/20 bg-[oklch(0.1_0_0_/_0.6)] px-3 py-1.5 font-mono text-[10px] tracking-[0.12em] text-white/80 backdrop-blur-md"
			>
				{#if chip.dot}
					<span
						class="bg-accent-work h-1.5 w-1.5 rounded-full motion-safe:animate-[blink_1.6s_ease-in-out_infinite]"
					></span>
				{/if}
				<span data-edit={chip.labelKey}>{c(chip.labelKey)}</span>
			</div>
		{/if}

		{#if playSize && onplay}
			<button
				type="button"
				onclick={(e) => {
					e.stopPropagation();
					onplay?.();
				}}
				aria-label={playLabel}
				class={cn(
					"absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-[oklch(0.1_0_0_/_0.5)] text-white backdrop-blur-md transition-[transform,opacity,background-color] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-[1.12] hover:bg-[oklch(0.1_0_0_/_0.75)] focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none motion-reduce:transition-none motion-reduce:hover:scale-100",
					fadePlayOnHover && "group-hover:opacity-0"
				)}
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
</div>
