<script lang="ts">
	import type { Snippet } from "svelte";
	import { cn } from "$lib/utils.js";

	interface Props {
		/** pill fill, normally the owning card's tint (e.g. "var(--r-tint-blue)") */
		bg?: string;
		class?: string;
		children: Snippet;
		/** data-edit-item={i} when rendered from a cList() row — forwarded verbatim */
		[key: string]: unknown;
	}

	let { bg = "var(--r-paper)", class: className, children, ...rest }: Props = $props();
</script>

<!--
	The tech-stack pill. Mono, because it labels a tool rather than speaking to
	the reader; the tint is inherited from the card so a row of tags reads as
	belonging to it rather than as six separate objects.

	`{...rest}` is what makes the tag usable inside a `data-edit-list` container:
	the runtime needs `data-edit-item` on a real DOM element (EDIT-CONTRACT §3).
-->
<span
	class={cn(
		"r-border r-mono inline-flex items-center px-[8px] py-[2px] text-[10.5px] font-semibold",
		className
	)}
	style="background: {bg}; color: var(--r-ink);"
	{...rest}
>
	{@render children()}
</span>
