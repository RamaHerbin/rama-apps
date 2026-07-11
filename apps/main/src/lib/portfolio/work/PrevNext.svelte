<script lang="ts">
	interface NavCell {
		eyebrow: string;
		title: string;
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
			>
				{prev.eyebrow}
			</span>
			<span
				class="text-foreground text-[32px] font-bold tracking-[-0.025em]"
			>
				{prev.title}
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
			>
				{next.eyebrow}
			</span>
			<span
				class="text-foreground text-[32px] font-bold tracking-[-0.025em]"
			>
				{next.title}
			</span>
		</a>
	{/if}
</div>
