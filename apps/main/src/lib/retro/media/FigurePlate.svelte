<script lang="ts">
	import { cn } from "$lib/utils.js";
	import { c } from "$lib/content/index.js";

	interface Props {
		src: string;
		alt: string;
		/** content key for the caption line, e.g. "bnf.detail.fig-a.label" */
		captionKey: string;
		/** content key for the inline chip after the caption, e.g. "bnf.detail.fig-a.tag" */
		chipKey: string;
		/** chip background — a --r-tint-* value */
		chipBg: string;
		class?: string;
	}

	let { src, alt, captionKey, chipKey, chipBg, class: className }: Props = $props();
</script>

<!--
	BnF figure plate: cropped still over a caption strip with a taxonomy chip.
	Caption and chip are two SIBLING data-edit spans (never nested) so each round-
	trips its own textContent in edit mode.
-->
<figure class={cn("r-figplate r-border r-shadow-3", className)}>
	<img {src} {alt} loading="lazy" class="r-figplate-img" />
	<figcaption class="r-mono r-figplate-cap">
		<span data-edit={captionKey}>{c(captionKey)}</span
		><span class="r-pixel r-border r-figplate-chip" style="background: {chipBg}" data-edit={chipKey}
			>{c(chipKey)}</span
		>
	</figcaption>
</figure>

<style>
	/* border + shadow come from the .r-border / .r-shadow-3 recipes (retro.css) */
	.r-figplate {
		margin: 0;
		background: var(--r-paper);
	}

	.r-figplate-img {
		display: block;
		width: 100%;
		height: 230px;
		object-fit: cover;
		border-bottom: 2px solid var(--r-ink);
	}

	.r-figplate-cap {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		padding: 8px 12px;
		font-size: 10.5px;
		font-weight: 600;
	}

	.r-figplate-chip {
		margin-left: 6px;
		padding: 1px 6px;
		font-size: 9px;
	}
</style>
