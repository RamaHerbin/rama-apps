<script lang="ts">
	import { c } from "$lib/content/index.js";

	interface NavCell {
		/** content key for the eyebrow text (e.g. "fdp.prev-next.prev.eyebrow") */
		eyebrowKey: string;
		/** content key for the title text */
		titleKey: string;
		href: string;
	}

	interface Props {
		/** left cell (e.g. "← BACK TO / Portfolio") */
		prev?: NavCell | null;
		/** right cell (e.g. "NEXT CASE → / Personal Projects"), right-aligned */
		next?: NavCell | null;
	}

	let { prev = null, next = null }: Props = $props();
</script>

<div
	class="border-border/50 grid grid-cols-1 overflow-hidden rounded-[14px] border sm:grid-cols-2"
>
	{#if prev}
		<a
			href={prev.href}
			class="border-border/50 hover:bg-foreground/4 flex flex-col gap-3 border-b p-10 transition-colors sm:border-r sm:border-b-0"
		>
			<span
				class="text-muted-foreground font-mono text-[10px] tracking-[0.14em]"
				data-edit={prev.eyebrowKey}
			>
				{c(prev.eyebrowKey)}
			</span>
			<span
				class="text-foreground text-[32px] font-bold tracking-[-0.025em]"
				data-edit={prev.titleKey}
			>
				{c(prev.titleKey)}
			</span>
		</a>
	{/if}
	{#if next}
		<a
			href={next.href}
			class="hover:bg-foreground/4 flex flex-col items-end gap-3 p-10 text-right transition-colors"
		>
			<span
				class="text-muted-foreground font-mono text-[10px] tracking-[0.14em]"
				data-edit={next.eyebrowKey}
			>
				{c(next.eyebrowKey)}
			</span>
			<span
				class="text-foreground text-[32px] font-bold tracking-[-0.025em]"
				data-edit={next.titleKey}
			>
				{c(next.titleKey)}
			</span>
		</a>
	{/if}
</div>
