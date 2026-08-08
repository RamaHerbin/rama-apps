<script lang="ts">
	import type { Snippet } from "svelte";
	import { cn } from "$lib/utils.js";
	import { c } from "$lib/content/index.js";
	import { accentVar, type Accent } from "../index.js";

	interface Props {
		/** DOM id — callers pass the already `retro-`prefixed form (e.g. "retro-connect") */
		id?: string;
		/** two-digit section index ("01"). Omit for an index-less titlebar (BnF brief). */
		index?: string;
		/** "/ 01" on the home page, "( 01 )" on the case pages */
		indexStyle?: "slash" | "paren";
		/** content key for the Silkscreen title (uppercased in CSS, not in the JSON) */
		titleKey: string;
		/** content key for the right-aligned DOS filename label, e.g. "SUMMARY.EXE" */
		dosKey: string;
		/** colour of the 12px titlebar dot */
		accent: Accent;
		/** content key for the optional centered caption row under the titlebar */
		captionKey?: string;
		class?: string;
		children: Snippet;
	}

	let {
		id,
		index,
		indexStyle = "slash",
		titleKey,
		dosKey,
		accent,
		captionKey,
		class: className,
		children
	}: Props = $props();

	// The index is structural chrome, not content — it never gets a data-edit.
	const indexLabel = $derived(
		index === undefined ? "" : indexStyle === "paren" ? `( ${index} )` : `/ ${index}`
	);
</script>

<!--
	Grammar A — the section window: bordered paper slab, 4px hard shadow, DOS
	titlebar. Home and case pages share one component; the ONLY difference is the
	index format ("/ 01" vs "( 01 )"), hence `indexStyle`.

	The titlebar is allowed to wrap: Silkscreen is a wide face and the DOS label
	would otherwise force a horizontal scroll on narrow screens. Borders and the
	shadow never scale.
-->
<section {id} class={cn("r-window r-border r-shadow-4", className)}>
	<div class="r-window-bar">
		<span class="r-border r-window-dot" style="background: {accentVar(accent)}"></span>
		{#if indexLabel}
			<span class="r-mono r-window-index">{indexLabel}</span>
		{/if}
		<span class="r-pixel r-window-title" data-edit={titleKey}>{c(titleKey)}</span>
		<span class="r-window-spacer"></span>
		<span class="r-mono r-window-dos" data-edit={dosKey}>{c(dosKey)}</span>
	</div>

	{#if captionKey}
		<div class="r-mono r-window-caption" data-edit={captionKey}>{c(captionKey)}</div>
	{/if}

	{@render children()}
</section>

<style>
	/* border + shadow come from the .r-border / .r-shadow-4 recipes (retro.css) */
	.r-window {
		background: var(--r-paper);
	}

	.r-window-bar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 10px;
		padding: 12px 18px;
		border-bottom: 2px solid var(--r-ink);
	}

	.r-window-dot {
		width: 12px;
		height: 12px;
		flex: none;
		box-sizing: border-box;
	}

	.r-window-index {
		font-size: 11px;
		font-weight: 700;
		color: var(--r-muted);
	}

	.r-window-title {
		font-size: 12px;
		text-transform: uppercase;
	}

	.r-window-spacer {
		flex: 1;
	}

	.r-window-dos {
		font-size: 10.5px;
		font-weight: 600;
		letter-spacing: 1px;
		color: var(--r-muted);
	}

	.r-window-caption {
		padding: 18px 20px 0;
		text-align: center;
		font-size: 12px;
		color: var(--r-muted);
	}
</style>
