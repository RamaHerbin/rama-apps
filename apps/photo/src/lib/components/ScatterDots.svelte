<script lang="ts">
	import { cn } from '$lib/utils.js';

	interface Props {
		/** Number of tiny gold squares rendered inside the pill. */
		count?: number;
		/** Index of the active (full-opacity) square; all others dim to 35%. -1 = none active. */
		active?: number;
		/** When true, squares pulse in a staggered sequential wave via CSS animation. */
		pulsing?: boolean;
		/** Extra classes merged onto the pill container. */
		class?: string;
	}

	let { count = 3, active = -1, pulsing = false, class: className }: Props = $props();

	/** Total animation cycle length; per-square delay is spread across it for the wave. */
	const PULSE_DURATION_MS = 1400;

	/** Deterministic list of square indices to render. */
	const squares = $derived(Array.from({ length: Math.max(0, count) }, (_, i) => i));

	/** Resting opacity for a square when not pulsing. */
	function squareOpacity(i: number): number {
		if (active >= 0) return i === active ? 1 : 0.35;
		return 1;
	}
</script>

<div
	class={cn(
		'inline-flex items-center gap-[6px] rounded-[2px] bg-[#0a0a0a] px-3 py-1.5',
		className
	)}
>
	{#each squares as i (i)}
		<span
			class={cn('block h-[4px] w-[4px] bg-[#d3a625]', pulsing && 'scatter-dot-pulse')}
			style={pulsing
				? `animation-delay: ${Math.round((i / (squares.length || 1)) * PULSE_DURATION_MS)}ms;`
				: `opacity: ${squareOpacity(i)};`}
		></span>
	{/each}
</div>

<style>
	.scatter-dot-pulse {
		opacity: 0.35;
		animation: scatter-dot-pulse 1400ms ease-in-out infinite;
	}

	@keyframes scatter-dot-pulse {
		0%,
		100% {
			opacity: 0.35;
		}
		50% {
			opacity: 1;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.scatter-dot-pulse {
			animation: none;
			opacity: 0.7;
		}
	}
</style>
