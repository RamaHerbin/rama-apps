<script lang="ts">
	import { c } from "$lib/content";

	interface Props {
		/** e.g. "01" — the ordinal, owned by the layout */
		index: string;
		/** content key for the label, e.g. "bnf.brief.label" */
		labelKey: string;
	}

	let { index, labelKey }: Props = $props();
</script>

<!--
	`( 01 ) THE BRIEF` — the column header used where a section has no titlebar of
	its own to number it (the BnF brief/built pair), so the index moves inline
	into the body.

	Only the label span carries data-edit: its textContent has to be exactly
	c(labelKey) for the edit runtime to round-trip it, so the parens and the
	ordinal stay outside (EDIT-CONTRACT §3).
-->
<div class="r-mono text-[11px] font-bold tracking-[1px]" style="color: var(--r-muted);">
	( {index} )&nbsp;<span data-edit={labelKey}>{c(labelKey)}</span>
</div>
