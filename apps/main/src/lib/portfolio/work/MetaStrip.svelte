<script lang="ts">
	import { cn } from "$lib/utils.js";
	import { c } from "$lib/content/index.js";

	interface MetaItem {
		label: string;
		value: string;
	}

	interface Props {
		items: MetaItem[];
		/** desktop column count (defaults to items.length). Mobile is always 2. */
		columns?: number;
		/** smaller 15px values (BnF detail) vs default 17px (FdP hero) */
		dense?: boolean;
		/**
		 * content namespace ("fdp" | "bnf") used to derive each item's edit key
		 * as `${editNamespace}.meta.${label.toLowerCase()}`. When set, the value
		 * is read live via `c()` (and marked `data-edit`) instead of `item.value`.
		 */
		editNamespace?: string;
		class?: string;
	}

	let { items, columns, dense = false, editNamespace, class: className }: Props = $props();

	const cols = $derived(columns ?? items.length);
</script>

<div
	class={cn(
		"border-border/50 grid grid-cols-2 border-y",
		"lg:[grid-template-columns:repeat(var(--meta-cols),minmax(0,1fr))]",
		className
	)}
	style="--meta-cols: {cols}"
>
	{#each items as item (item.label)}
		{@const valueKey = editNamespace ? `${editNamespace}.meta.${item.label.toLowerCase()}` : undefined}
		<div class="border-border/50 border-r px-5 py-[18px] last:border-r-0">
			<div
				class="text-muted-foreground/70 mb-2 font-mono text-[10px] tracking-[0.14em]"
			>
				{item.label}
			</div>
			<div
				class={cn(
					"text-foreground font-semibold",
					dense ? "text-[15px]" : "text-[17px]"
				)}
				data-edit={valueKey}
			>
				{valueKey ? c(valueKey) : item.value}
			</div>
		</div>
	{/each}
</div>
