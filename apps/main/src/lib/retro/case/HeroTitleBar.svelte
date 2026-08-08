<script lang="ts">
	/**
	 * Case-page hero titlebar — the tinted strip inside the hero's NotchedFrame.
	 *
	 * Reads as a window titlebar: case chip (solid accent), kicker, and a
	 * right-aligned meta line. The tint is passed in rather than derived from the
	 * accent because the three case pages pair them by hand
	 * (rust/#F8E8DC, green/#EAF2E4, blue/#E8EDF6) and the atom must not out-guess
	 * the page.
	 */
	import { c } from "$lib/content/index.js";
	import { accentVar, type Accent } from "../index.js";

	interface Props {
		/** content key for the case chip, e.g. "CASE 01" */
		chipKey: string;
		/** chip fill — also the page accent */
		accent: Accent;
		/** css value for the bar's tint, e.g. "var(--r-tint-rust)" */
		tint: string;
		/** content key for the left kicker line */
		kickerKey?: string;
		/** content key for the right meta line (period · place) */
		metaKey?: string;
	}

	let { chipKey, accent, tint, kickerKey, metaKey }: Props = $props();
</script>

<div
	class="r-hero-bar flex flex-wrap items-center gap-2.5 px-[22px] py-[14px]"
	style="background: {tint}"
>
	<span
		class="r-pixel flex-none px-2 py-[3px] text-[10px] text-[var(--r-paper)]"
		style="background: {accentVar(accent)}"
		data-edit={chipKey}>{c(chipKey)}</span
	>

	{#if kickerKey}
		<span class="r-mono text-[11px] font-bold tracking-[1px]" data-edit={kickerKey}
			>{c(kickerKey)}</span
		>
	{/if}

	<span class="flex-1"></span>

	{#if metaKey}
		<span
			class="r-mono text-[11px] font-semibold text-[var(--r-muted)]"
			data-edit={metaKey}>{c(metaKey)}</span
		>
	{/if}
</div>

<style>
	/* Single-edge rule: the .r-border recipe draws all four, and this bar is the
	   seam between the titlebar and the hero body, not a box of its own. */
	.r-hero-bar {
		border-bottom: 2px solid var(--r-ink);
	}
</style>
