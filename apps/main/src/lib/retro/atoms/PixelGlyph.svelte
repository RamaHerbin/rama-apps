<script lang="ts">
	import { cn } from "$lib/utils.js";

	interface Props {
		/** square edge in px (8 = button suffix, 14 = footer mark) */
		cell?: number;
		/** gutter between the four squares, in px */
		gap?: number;
		/** ink margin around the grid, in px — this is what makes the ink read as a frame */
		pad?: number;
		class?: string;
	}

	let { cell = 8, gap = 2, pad = 2, class: className }: Props = $props();
</script>

<!--
	The four-colour mark: the whole palette compressed into 2×2 pixels. Decorative
	by construction — it carries no content key and is aria-hidden, so a screen
	reader never announces "blue rust green gold" in the middle of a button label.

	Sizes are inline (`{cell}px`) rather than Tailwind arbitrary values because
	they are props: Tailwind only emits classes it can find as literal strings in
	the source, so `w-[{cell}px]` would compile to nothing.
-->
<span
	aria-hidden="true"
	class={cn("inline-grid", className)}
	style="grid-template-columns: repeat(2, {cell}px); grid-template-rows: repeat(2, {cell}px); gap: {gap}px; padding: {pad}px; background: var(--r-ink);"
>
	<span style="background: var(--r-blue);"></span>
	<span style="background: var(--r-rust);"></span>
	<span style="background: var(--r-green);"></span>
	<span style="background: var(--r-gold);"></span>
</span>
