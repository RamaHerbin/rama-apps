<script lang="ts">
	/**
	 * BnF "engineering notes" row: a fixed-width ink label chip against a sentence,
	 * on a tinted plate (INTERACTION / LANGUAGES / EXPERIENCE / STACK).
	 *
	 * The chip's 110px column is what makes the four rows read as a definition
	 * list, so it survives to the narrow end — it just stacks above the text there
	 * rather than shrinking the prose to a ribbon.
	 */
	import { c } from "$lib/content/index.js";

	interface Props {
		/** content key for the label chip */
		labelKey: string;
		/** content key for the definition text */
		descKey: string;
		/** css value for the row tint, e.g. "var(--r-tint-blue)" */
		bg: string;
	}

	let { labelKey, descKey, bg }: Props = $props();
</script>

<div
	class="r-border flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-baseline sm:gap-4"
	style="background: {bg}"
>
	<span
		class="r-pixel w-[110px] flex-none self-start bg-[var(--r-ink)] px-2 py-[2px] text-center text-[10px] text-[var(--r-paper)]"
		data-edit={labelKey}>{c(labelKey)}</span
	>
	<span class="text-[13.5px] leading-[1.55] text-[var(--r-prose)]" data-edit={descKey}
		>{c(descKey)}</span
	>
</div>
