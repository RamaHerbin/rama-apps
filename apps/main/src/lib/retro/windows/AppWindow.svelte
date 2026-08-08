<script lang="ts">
	import type { Snippet } from "svelte";
	import { cn } from "$lib/utils.js";
	import { c } from "$lib/content/index.js";

	interface Props {
		/** content key for the titlebar filename (preferred — makes it editable) */
		filenameKey?: string;
		/** literal titlebar filename, for labels that come from frozen data instead */
		filename?: string;
		class?: string;
		children: Snippet;
	}

	let { filenameKey, filename, class: className, children }: Props = $props();
</script>

<!--
	Grammar C — the little "application window" (home: photo.jpg).

	NO SHADOW BY DEFAULT, on purpose: in the mockup the drop-shadow carrier is a
	div *around* this window, and grammar C is used both standalone (needs the 4px
	shadow) and nested inside a slab that already casts one. Callers add it —
	either `class="r-shadow-4"` or their own `filter: drop-shadow(4px 4px 0
	var(--r-ink))` wrapper.

	The `_` and `✕` boxes are inert decoration — a minimise/close affordance that
	does nothing would be a lie to assistive tech, so they are aria-hidden spans,
	never buttons.
-->
<div class={cn("r-app r-border", className)}>
	<div class="r-app-bar">
		<!-- no whitespace inside the data-edit span: its textContent must round-trip -->
		<span class="r-mono r-app-name" data-edit={filenameKey}
			>{filenameKey ? c(filenameKey) : (filename ?? "")}</span
		>
		<span class="r-border r-app-btn r-app-btn-min" aria-hidden="true">_</span>
		<span class="r-border r-app-btn" aria-hidden="true">✕</span>
	</div>
	<div class="r-app-body">
		{@render children()}
	</div>
</div>

<style>
	/* border comes from the .r-border recipe (retro.css) */
	.r-app {
		background: var(--r-paper);
	}

	.r-app-bar {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 7px 10px;
		border-bottom: 2px solid var(--r-ink);
		background: var(--r-tint-gold);
	}

	.r-app-name {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 11px;
		font-weight: 700;
	}

	.r-app-btn {
		display: inline-flex;
		width: 20px;
		height: 20px;
		flex: none;
		align-items: center;
		justify-content: center;
		background: var(--r-paper);
		box-sizing: border-box;
		font-size: 10px;
	}

	/* the underscore sits on the baseline of its own box, like a minimise glyph */
	.r-app-btn-min {
		align-items: flex-end;
		line-height: 1.4;
	}

	.r-app-body {
		padding: 8px;
	}
</style>
