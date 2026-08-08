<script lang="ts">
	import { cn } from "$lib/utils.js";

	interface Props {
		/** give each square the press physics — visual only, this component never switches anything */
		interactive?: boolean;
	}

	let { interactive = false }: Props = $props();

	const SWATCHES = ["var(--r-blue)", "var(--r-rust)", "var(--r-gold)", "var(--r-green)"];
</script>

<!--
	The palette, stated once at the top right of the header: four squares, the
	whole accent set, no legend. Decorative — it is the design system introducing
	itself, not a control.

	`interactive` therefore adds hover physics and nothing else. The real skin
	switcher is chrome/SkinSwitch, which happens to look like this; keeping the
	two separate is what stops a decorative row from growing click handlers.
-->
<span aria-hidden="true" class="inline-flex gap-[8px]">
	{#each SWATCHES as color (color)}
		<span
			class={cn("r-border h-[14px] w-[14px]", interactive && "r-pressable")}
			style="background: {color};"
		></span>
	{/each}
</span>
