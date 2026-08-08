<script lang="ts">
	/**
	 * FdP "approach" card — numbered chip, title, paragraph. Deliberately inert:
	 * this is a 3x2 read-only grid, so it carries the 3px card shadow but none of
	 * the pressable physics (nothing to press).
	 */
	import { c } from "$lib/content/index.js";
	import NumChip from "../atoms/NumChip.svelte";

	interface Props {
		/** ordinal, e.g. "01" — decorative, not content */
		index: string;
		/** content key for the card title */
		titleKey: string;
		/** content key for the card body */
		descKey: string;
	}

	let { index, titleKey, descKey }: Props = $props();
</script>

<article class="r-border r-shadow-3 flex flex-col gap-2 bg-[var(--r-paper)] px-[18px] py-4">
	<NumChip label={index} class="w-fit self-start" />
	<h3 class="text-[15.5px] font-bold" data-edit={titleKey}>{c(titleKey)}</h3>
	<p class="text-[12.5px] leading-[1.55] text-[var(--r-prose)]" data-edit={descKey}>{c(descKey)}</p>
</article>
