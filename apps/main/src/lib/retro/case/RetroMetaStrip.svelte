<script lang="ts">
	/**
	 * Case-page hero meta strip — 4 or 5 label/value cells under the hero.
	 *
	 * Data flow mirrors `portfolio/work/MetaStrip.svelte` exactly: the FROZEN
	 * `fdpHeroMeta` / `bnfMeta` arrays supply the labels and the ordering, and
	 * `editNamespace` re-reads each VALUE live through
	 * `c(`${ns}.meta.${label.toLowerCase()}`)` so the same string is editable from
	 * either tree and cannot fork. Labels stay code (they are the schema, not copy).
	 *
	 * DIVIDERS ARE GAPS, NOT BORDERS. A `border-right: 2px` per cell has to know
	 * which cell ends a row, which no longer holds once the strip reflows to 2
	 * columns — that is the bug the mockup shipped (its loop paints a rule on the
	 * last cell too). Painting the grid's own background ink and letting a 2px gap
	 * expose it gives continuous, exactly-2px rules between cells at ANY column
	 * count, horizontals included, with nothing at the outer edges.
	 */
	import { c } from "$lib/content/index.js";
	import { cn } from "$lib/utils.js";

	interface MetaItem {
		label: string;
		value: string;
	}

	interface Props {
		items: MetaItem[];
		/** desktop column count; mobile is always 2 */
		cols?: 4 | 5;
		/** "fdp" | "bnf" — derives each value's edit key as `<ns>.meta.<label>` */
		editNamespace?: string;
	}

	let { items, cols = 4, editNamespace }: Props = $props();

	/** An odd cell count leaves a hole in the 2-col layout; the last cell fills it. */
	const oddCount = $derived(items.length % 2 === 1);
</script>

<div
	class={cn("r-meta grid bg-[var(--r-ink)]", oddCount && "r-meta-odd")}
	style="--r-meta-cols: {cols}"
>
	{#each items as item (item.label)}
		{@const valueKey = editNamespace ? `${editNamespace}.meta.${item.label.toLowerCase()}` : undefined}
		<div class={cn("bg-[var(--r-paper)] px-5 py-[14px]", cols === 5 && "px-[18px]")}>
			<div class="r-mono mb-1.5 text-[10px] font-bold tracking-[1px] text-[var(--r-muted)]">
				{item.label}
			</div>
			<!-- Text flush against the tags: the edit runtime commits raw textContent. -->
			<div
				class={cn("font-bold", cols === 5 ? "text-[13px]" : "text-[14px]")}
				data-edit={valueKey}
			>{valueKey ? c(valueKey) : item.value}</div>
		</div>
	{/each}
</div>

<style>
	.r-meta {
		/* The strip's own top rule — the one divider that is not a gap, because
		   there is no cell above to expose the ink background. */
		border-top: 2px solid var(--r-ink);
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 2px;
	}

	@media (max-width: 767px) {
		.r-meta-odd > :last-child {
			grid-column: span 2;
		}
	}

	@media (min-width: 768px) {
		.r-meta {
			grid-template-columns: repeat(var(--r-meta-cols), minmax(0, 1fr));
		}
	}
</style>
