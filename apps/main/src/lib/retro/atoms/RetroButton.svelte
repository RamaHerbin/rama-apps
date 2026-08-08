<script lang="ts">
	import type { Snippet } from "svelte";
	import { cn } from "$lib/utils.js";
	import PixelGlyph from "./PixelGlyph.svelte";

	interface Props {
		/** renders an <a> when set, a <button type="button"> otherwise */
		href?: string;
		/** open in a new tab (adds rel="noopener noreferrer") */
		external?: boolean;
		/** "primary" = the gold --r-btn key, "outline" = a paper key */
		variant?: "primary" | "outline";
		/** "sm" = 10px key on 2px shadow (cards, BACK); "md" = 12px key on 3px (hero CTA, connect row) */
		size?: "sm" | "md";
		/** append the 2×2 colour mark, hero-CTA style */
		pixelGlyph?: boolean;
		class?: string;
		children: Snippet;
		/** data-edit / data-edit-href / aria-* / onclick … forwarded verbatim to the element */
		[key: string]: unknown;
	}

	let {
		href,
		external = false,
		variant = "outline",
		size = "md",
		pixelGlyph = false,
		class: className,
		children,
		...rest
	}: Props = $props();

	// Layout + size in Tailwind, colour in a var: the house rule for this tree.
	// The shadow rung is part of the size because it is part of the key's scale —
	// a 10px label on a 4px shadow reads as a mis-sized button, not a variant.
	const classes = $derived(
		cn(
			"r-border r-pixel r-pressable inline-flex items-center justify-center gap-[10px] text-center",
			size === "sm"
				? "r-shadow-2 px-[12px] py-[7px] text-[10px]"
				: "r-shadow-3 px-[22px] py-[10px] text-[12px]",
			className
		)
	);

	// `color` is set explicitly rather than inherited: the retro tree gives plain
	// <a> the blue link colour, which is wrong on a key — the label is ink on the
	// key's own surface, and the surface is what carries the accent.
	const styles = $derived(
		`background: ${variant === "primary" ? "var(--r-btn)" : "var(--r-paper)"}; color: var(--r-ink);`
	);
</script>

{#if href}
	<a
		{href}
		target={external ? "_blank" : undefined}
		rel={external ? "noopener noreferrer" : undefined}
		class={classes}
		style={styles}
		{...rest}
	>
		{@render children()}
		{#if pixelGlyph}<PixelGlyph />{/if}
	</a>
{:else}
	<button type="button" class={classes} style={styles} {...rest}>
		{@render children()}
		{#if pixelGlyph}<PixelGlyph />{/if}
	</button>
{/if}
