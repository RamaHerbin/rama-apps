<script lang="ts">
	import { cn } from '$lib/utils.js';

	/** Fixed top-center registration mark (a hairline '+'). */
	let { class: className = '' }: { class?: string } = $props();
</script>

<span
	class={cn('pointer-events-none fixed left-1/2 top-4 z-40 -translate-x-1/2 text-foreground/80', className)}
	aria-hidden="true"
>
	<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
		<line x1="14" y1="0" x2="14" y2="28" stroke="currentColor" stroke-width="1" />
		<line x1="0" y1="14" x2="28" y2="14" stroke="currentColor" stroke-width="1" />
	</svg>
</span>
