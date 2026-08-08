<script lang="ts">
	/**
	 * Retro-OS skin switcher — one hard-edged square per skin.
	 *
	 * Takes the place of the mockup's decorative 4-swatch row in HeaderBar /
	 * CaseHeaderBar (the `Swatches` atom still exists for purely ornamental use).
	 * Real <button>s, so the row is keyboard-reachable and announces its state;
	 * the mockup's swatches were inert spans.
	 *
	 * WHY THE ACTIVE SQUARE IS SELECTED IN CSS, NOT FROM THE RUNE
	 * Same argument as NavAnchor's swatch: the site is fully prerendered, so the
	 * shipped HTML always encodes `skin === "standard"`, while app.html's
	 * anti-FOUC IIFE has already put `data-skin` on <html> before first paint.
	 * Painting the pressed square from the rune would show a skinned visitor the
	 * wrong square until hydration. `html[data-skin="…"]` is right at frame one and
	 * needs no JS. `aria-pressed` is the one thing that *cannot* be done in CSS, so
	 * it reads the rune and is briefly stale pre-hydration — assistive tech
	 * re-reads a button's state when it is reached, long after hydration.
	 */
	import { createSkinState, setSkin } from "$lib/stores/skin.svelte.js";
	import { SKINS, SKIN_NAMES } from "$lib/skins/registry.js";
	import type { SkinName } from "$lib/skins/registry.js";
	import { c } from "$lib/content/index.js";

	const skinState = createSkinState();

	/**
	 * Visitor-facing name of one skin, content-first with a typed fallback —
	 * identical to NavAnchor.skinName(): `c()` returns the key itself on a miss,
	 * and a raw "shared.nav.skin.brutal" inside an aria-label is a bug only a
	 * screen-reader user would ever hit.
	 */
	function skinLabel(name: SkinName): string {
		const key = `shared.nav.skin.${name}`;
		const value = c(key);
		return value === key ? SKINS[name].label : value;
	}
</script>

<div class="flex flex-none items-center gap-2" role="group" aria-label={c("shared.nav.skin.label")}>
	{#each SKIN_NAMES as name (name)}
		<button
			type="button"
			data-skin-name={name}
			onclick={() => setSkin(name)}
			aria-pressed={skinState.skin === name}
			aria-label="{c('shared.nav.skin.label')}: {skinLabel(name)}"
			title={skinLabel(name)}
			class="r-skin-sq r-border box-content block h-[14px] w-[14px]"
		></button>
	{/each}
</div>

<style>
	/* 14x14 fill + the .r-border rule drawn outside it (box-content) = the mockup's
	   18px rendered swatch. The shadow sits one rung below the header it lives in
	   (xs 2px), so the row reads as a set of small keys on the header's surface.
	   It is written here rather than as `.r-shadow-2` because the pressed/active
	   rules below have to override it, and an unlayered recipe class would need
	   equal-or-higher specificity to lose. */
	.r-skin-sq {
		position: relative;
		cursor: pointer;
		box-shadow: 2px 2px 0 var(--r-ink);
	}

	/* Pointer/touch target grown to ~30px without disturbing the 8px visual gutter. */
	.r-skin-sq::after {
		content: "";
		position: absolute;
		inset: -6px;
	}

	.r-skin-sq:focus-visible {
		outline: 2px solid var(--r-ink);
		outline-offset: 3px;
	}

	/* One square per skin. `standard` is paper (the absence of a palette), the two
	   real skins take the colour they are known by elsewhere in the app: brutal its
	   yellow, retro-os its blue (NavAnchor's icons use the same pairing). */
	.r-skin-sq[data-skin-name="standard"] {
		background: var(--r-paper);
	}
	.r-skin-sq[data-skin-name="brutal"] {
		background: var(--r-btn);
	}
	.r-skin-sq[data-skin-name="retro-os"] {
		background: var(--r-blue);
	}

	@media (hover: hover) {
		.r-skin-sq:hover {
			transform: translate(-1px, -1px);
			box-shadow: 3px 3px 0 var(--r-ink);
		}
	}

	.r-skin-sq:active {
		transform: translate(2px, 2px);
		box-shadow: 0 0 0 var(--r-ink);
	}

	/* The active skin's square is held DOWN (pressed physics, no shadow) — the
	   retro-OS reading of a radio button. Listed last and at (0,2,1)+, so it also
	   wins over the hover lift above: the current skin never lifts. */
	:global(html:not([data-skin])) .r-skin-sq[data-skin-name="standard"],
	:global(html[data-skin="brutal"]) .r-skin-sq[data-skin-name="brutal"],
	:global(html[data-skin="retro-os"]) .r-skin-sq[data-skin-name="retro-os"] {
		transform: translate(2px, 2px);
		box-shadow: 0 0 0 var(--r-ink);
		cursor: default;
	}
</style>
