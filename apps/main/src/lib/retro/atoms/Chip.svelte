<script lang="ts">
	import type { Snippet } from "svelte";
	import { cn } from "$lib/utils.js";

	interface Props {
		/** "outline" = paper on ink border · "ink" = inverted · "tint" = a pale accent wash */
		tone?: "outline" | "ink" | "tint";
		/** the tint colour when tone="tint", e.g. "var(--r-tint-blue)" */
		bg?: string;
		/** dashed border — the "provisional / not-a-link" signal (NDA badge, empty frame) */
		dashed?: boolean;
		class?: string;
		children: Snippet;
		/** data-edit / data-edit-item / … forwarded verbatim */
		[key: string]: unknown;
	}

	let { tone = "outline", bg, dashed = false, class: className, children, ...rest }: Props =
		$props();

	// Deliberately font-agnostic. Chips appear in both typefaces across the design
	// (Silkscreen for status-ish labels, IBM Plex Mono for data-ish ones), and the
	// choice belongs to the section, not to the chip — pass `.r-pixel` or `.r-mono`
	// in `class`. Padding and size are Tailwind so cn()/twMerge lets a caller
	// replace them without an inline style fight.
	const background = $derived(
		tone === "ink" ? "var(--r-ink)" : tone === "tint" ? (bg ?? "var(--r-tint-gold)") : "var(--r-paper)"
	);
</script>

<span
	class={cn("r-border inline-flex items-center px-[8px] py-[2px] text-[11px]", className)}
	style="background: {background}; color: {tone === 'ink'
		? 'var(--r-paper)'
		: 'var(--r-ink)'}; border-style: {dashed ? 'dashed' : 'solid'};"
	{...rest}
>
	{@render children()}
</span>
