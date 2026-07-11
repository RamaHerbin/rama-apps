<script lang="ts">
	import { cn } from "$lib/utils.js";

	interface Props {
		/** e.g. "01" — rendered as "( 01 )" in accent. Omit for the parens-label style. */
		index?: string;
		/** the label text, e.g. "CONTEXT" */
		label: string;
		/** optional right-aligned counter, e.g. "6 PROJECTS" (rule variant only) */
		counter?: string;
		/**
		 * "rule"   — section header with a flex filler line (default)
		 * "eyebrow"— compact inline eyebrow, whole text in accent, no filler line
		 */
		variant?: "rule" | "eyebrow";
		class?: string;
	}

	let { index, label, counter, variant = "rule", class: className }: Props = $props();
</script>

{#if variant === "eyebrow"}
	<div
		class={cn(
			"text-accent-work font-mono text-[11px] tracking-[0.14em]",
			className
		)}
	>
		{#if index}( {index} )&nbsp;&nbsp;{/if}{label}
	</div>
{:else}
	<div
		class={cn(
			"text-muted-foreground flex items-baseline gap-4 font-mono text-[11px] tracking-[0.14em]",
			className
		)}
	>
		{#if index}
			<span class="text-accent-work">( {index} )</span>
			<span>{label}</span>
		{:else}
			<span class="text-accent-work">( {label} )</span>
		{/if}
		<span class="border-border/50 -translate-y-[3px] flex-1 border-b"></span>
		{#if counter}
			<span>{counter}</span>
		{/if}
	</div>
{/if}
