<script lang="ts">
	/**
	 * Home header bar — the mockup's top strip: RH tile · title + subtitle · swatches.
	 *
	 * The swatch row is replaced by the real `SkinSwitch`, which is the only way out
	 * of the retro tree once it owns the page. It therefore stays visible at every
	 * breakpoint (SPEC-HOME hides the *decorative* swatches under md; these are not
	 * decorative). The two titles absorb the narrow end instead, via clamp().
	 */
	import { c } from "$lib/content/index.js";
	import SkinSwitch from "./SkinSwitch.svelte";

	/**
	 * The tile glyph is a wordmark, not prose — CONTRACTS lists "RH" among the
	 * decorative glyphs that are props rather than content, while SPEC-HOME maps it
	 * to `retro.header.tile`. Both hold: the key drives it when it exists, and a miss
	 * (`c()` returns the key itself) falls back to the literal instead of printing
	 * "retro.header.tile" inside a 44px box. Same shape as NavAnchor.skinName().
	 */
	const TILE_KEY = "retro.header.tile";
	const tile = $derived(c(TILE_KEY) === TILE_KEY ? "RH" : c(TILE_KEY));
</script>

<header
	class="r-border r-shadow-4 flex items-center gap-4 bg-[var(--r-paper)] px-5 py-[14px]"
>
	<span
		class="r-pixel inline-flex h-11 w-11 flex-none items-center justify-center bg-[var(--r-ink)] text-[14px] text-[var(--r-paper)]"
		data-edit={TILE_KEY}>{tile}</span
	>

	<div class="flex min-w-0 flex-1 flex-col gap-[3px]">
		<span
			class="text-[clamp(15px,3.6vw,22px)] leading-tight font-black tracking-[-0.3px]"
			data-edit="retro.header.title">{c("retro.header.title")}</span
		>
		<span
			class="r-mono text-[clamp(9px,2.1vw,11px)] font-semibold tracking-[1px] text-[var(--r-muted)]"
			data-edit="retro.header.subtitle">{c("retro.header.subtitle")}</span
		>
	</div>

	<SkinSwitch />
</header>
