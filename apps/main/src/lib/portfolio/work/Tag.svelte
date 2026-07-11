<script lang="ts">
	import { cn } from "$lib/utils.js";

	interface Props {
		label: string;
		class?: string;
	}

	let { label, class: className }: Props = $props();
</script>

<span
	class={cn(
		"border-border/70 text-foreground/85 inline-block rounded-full border px-2.5 py-0.5 font-mono text-[11px] whitespace-nowrap",
		className
	)}
>
	{label}
</span>
