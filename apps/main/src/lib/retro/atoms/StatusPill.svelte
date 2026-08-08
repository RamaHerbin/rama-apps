<script lang="ts">
	import type { Snippet } from "svelte";
	import { cn } from "$lib/utils.js";

	interface Props {
		/** fill — the pill's meaning IS its colour (green = open source, gold = in dev, …) */
		bg: string;
		class?: string;
		children: Snippet;
		/** data-edit forwarded verbatim */
		[key: string]: unknown;
	}

	let { bg, class: className, children, ...rest }: Props = $props();
</script>

<!--
	Smallest pixel label in the system (9px): a state stamped on a card — OPEN
	SOURCE, IN DEV, FEATURED, 2023. `bg` is required rather than defaulted
	because a status pill with no colour is not a status pill, it is a tag.
-->
<span
	class={cn("r-border r-pixel inline-flex items-center px-[7px] py-[2px] text-[9px]", className)}
	style="background: {bg}; color: var(--r-ink);"
	{...rest}
>
	{@render children()}
</span>
