<script lang="ts">
	import { cn } from "$lib/utils.js";

	interface Props {
		/** the mark itself — "W", "C", "P", "</>", "PH", "MU", "📷", "♪". Decorative, never content */
		glyph: string;
		/** fill, normally the owning card's tint */
		bg: string;
		/** 30 = gear rows, 34 = passion/project cards, 38 = work cards */
		size?: 30 | 34 | 38;
		class?: string;
	}

	let { glyph, bg, size = 34, class: className }: Props = $props();

	// Font size tracks the tile, but stays a Tailwind class (not an inline style)
	// so a caller can dial it down through `class` — the project cards want the
	// 10px label in a 34px tile, where the passion cards want 12px.
	const fontClass = $derived(
		size === 38 ? "text-[11px]" : size === 34 ? "text-[12px]" : "text-[10px]"
	);
</script>

<!--
	The square that opens a card: a pixel monogram on the card's own tint.
	aria-hidden because the glyph is a picture of the title that follows it —
	"W" next to "Current Work" adds nothing for a screen reader.

	box-border is load-bearing, not tidiness: the 2px border must eat INTO the
	stated size, or a row of 38px tiles measures 42px and stops lining up with
	the 38px grid it sits on.
-->
<span
	aria-hidden="true"
	class={cn(
		"r-border r-pixel box-border inline-flex flex-none items-center justify-center",
		fontClass,
		className
	)}
	style="width: {size}px; height: {size}px; background: {bg}; color: var(--r-ink);"
>
	{glyph}
</span>
