<script lang="ts">
	/**
	 * FdP "role" row: a tinted bar with a sentence on the left and an ink chip on
	 * the right (e.g. "Front-end development for interactive installations" · DEV).
	 */
	import { c } from "$lib/content/index.js";

	interface Props {
		/** content key for the row's sentence */
		labelKey: string;
		/** content key for the chip text */
		tagKey: string;
		/** css value for the row tint, e.g. "var(--r-tint-blue)" */
		bg: string;
	}

	let { labelKey, tagKey, bg }: Props = $props();
</script>

<div class="r-border flex items-center gap-2.5 px-3 py-2" style="background: {bg}">
	<span class="flex-1 text-[13px] font-semibold" data-edit={labelKey}>{c(labelKey)}</span>
	<span
		class="r-pixel flex-none bg-[var(--r-ink)] px-[7px] py-[2px] text-[9px] text-[var(--r-paper)]"
		data-edit={tagKey}>{c(tagKey)}</span
	>
</div>
