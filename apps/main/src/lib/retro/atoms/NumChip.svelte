<script lang="ts">
	import { cn } from "$lib/utils.js";

	interface Props {
		/** the index itself, e.g. "01" — an ordinal the layout owns, never content */
		label: string;
		class?: string;
	}

	let { label, class: className }: Props = $props();
</script>

<!--
	Inverted ink chip carrying a card's ordinal. No border: ink on ink would draw
	nothing, and the chip is already its own silhouette.

	`label` is a plain prop and carries no data-edit on purpose — the numbering is
	structural (it counts the cards next to it), so it is not an editable string.
-->
<span
	class={cn("r-pixel inline-flex items-center px-[7px] py-[2px] text-[10px]", className)}
	style="background: var(--r-ink); color: var(--r-paper);"
>
	{label}
</span>
