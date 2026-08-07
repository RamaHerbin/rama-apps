/**
 * Skin Store
 *
 * Manages the active runtime skin (`standard` | `brutal` | `retro-os`) and
 * persists the visitor's choice.
 *
 * Deliberately built as the sibling of theme.svelte.ts — same module-level rune
 * singleton, same storage guard, same `createXState()` shape — because the two
 * are genuinely parallel concerns and compose rather than compete: the theme
 * picks light/dark, the skin picks which design language paints the page. Both
 * real skins are light-only, so the light/dark toggle stays mounted and its
 * `dark:` utilities are neutralised structurally in CSS while a skin is active,
 * never by either store.
 *
 * Every value — names, cycle order, labels, theme-colour hexes, font URLs, the
 * storage key, the validator — comes from $lib/skins/registry.ts. Nothing in
 * this file re-types any of them.
 *
 * ---------------------------------------------------------------------------
 * WHAT THIS STORE IS *NOT* RESPONSIBLE FOR
 * ---------------------------------------------------------------------------
 *   - First paint. src/app.html's anti-FOUC IIFE has already resolved and
 *     applied the skin before this module is even fetched. See `initialize()`.
 *   - The `<meta name="theme-color">` value. `syncThemeColor()` in
 *     theme.svelte.ts owns that tag for BOTH concerns; this store only calls it
 *     at the right moment.
 *   - Any of the skin's actual CSS. src/routes/skins.css writes the token
 *     blocks by hand under `html[data-skin="…"]`; `FancyProvider` is never
 *     mounted, so nothing injects tokens at runtime.
 */

import { browser } from "$app/environment";
import { SKINS, SKIN_NAMES, SKIN_STORAGE_KEY, isSkinName } from "$lib/skins/registry.js";
import type { SkinDef, SkinName } from "$lib/skins/registry.js";
import { syncThemeColor } from "$lib/stores/theme.svelte.js";

// =============================================================================
// State
// =============================================================================

/**
 * Reactive skin state using Svelte 5 runes.
 *
 * A module-level singleton, not a per-instance factory, for the same reason
 * theme.svelte.ts is one: there is exactly one `<html>` element, so there is
 * exactly one skin. A factory would let two mounted switchers hold different
 * ideas about a value that is global by construction.
 *
 * Its SSR value is always `"standard"`, and that is not a bug to fix: the site
 * is fully prerendered, so "the server" is a build machine with no visitor and
 * no request to read a preference from.
 */
let skin = $state<SkinName>("standard");

/** The active skin's registry entry — label, themeColor, fontHref. */
const skinDef = $derived<SkinDef>(SKINS[skin]);

// =============================================================================
// Initialization
// =============================================================================

/**
 * Read the stored preference, tolerating a storage layer that throws.
 *
 * `localStorage` is not merely empty under "block all cookies", Firefox with
 * cookies disabled, or some enterprise/partitioned contexts — the *getter*
 * itself throws. Unguarded, that exception escapes `initialize()`, which runs
 * at module scope (under `if (browser)`, see the bottom of this file), so the
 * whole chunk fails to evaluate, the layout node's dynamic import rejects, and
 * `kit.start()` never completes: the entire site silently loses hydration on
 * every route. theme.svelte.ts carries the identical guard for the identical
 * reason — a storage exception in EITHER store takes the whole site down.
 *
 * The allow-list is not spelled out here on purpose: `isSkinName` is exported
 * from the registry precisely so this file cannot drift from it. The anti-FOUC
 * IIFE in src/app.html is guarded the same way and re-implements the same
 * check inline (an .html file cannot import); `skinContractGuard()` in
 * vite.config.ts is what keeps that copy honest.
 */
function readStoredSkin(): SkinName | null {
	try {
		const saved = localStorage.getItem(SKIN_STORAGE_KEY);
		return isSkinName(saved) ? saved : null;
	} catch {
		return null;
	}
}

/**
 * Persist the choice, tolerating the same throwing storage layer.
 *
 * `"standard"` is written out as a literal rather than removing the key. The
 * distinction is load-bearing: an ABSENT key means "never chose", a stored
 * `"standard"` means "chose the default", and `initialize()`'s repair branch
 * below is the one place that must tell those two apart.
 */
function writeStoredSkin(next: SkinName) {
	try {
		localStorage.setItem(SKIN_STORAGE_KEY, next);
	} catch {
		// Storage blocked or over quota: the switcher still works for this
		// session, it just will not survive a reload. Never let it throw —
		// this runs from a click handler in NavAnchor.
	}
}

/**
 * ADOPT the painted state; do not re-derive it.
 *
 * ---------------------------------------------------------------------------
 * THE ORDERING PROBLEM, AND HOW AGREEMENT IS GUARANTEED
 * ---------------------------------------------------------------------------
 * By the time this module evaluates, the skin has ALREADY been applied. The
 * IIFE in src/app.html read `localStorage`, validated the name, set
 * `data-skin` on `<html>`, corrected `<meta name="theme-color">` and injected
 * the webfont — all before first paint, hundreds of milliseconds before the
 * JS chunk holding this store is fetched and run.
 *
 * So `initialize()` has no work to do, and doing work would be actively
 * harmful. If it re-read `localStorage` and called `applySkin()`, then on any
 * disagreement between storage-now and storage-then it would repaint the page
 * mid-hydration — the exact flash the IIFE exists to prevent. The naive
 * "re-read and re-apply" is not merely redundant, it is the bug.
 *
 * The guarantee is therefore structural rather than arithmetic: THE DOM IS THE
 * STATE, and the healthy path performs ZERO DOM WRITES. We do not compute a
 * value and hope it equals the painted one; we read the painted one. They
 * cannot disagree because only one of them exists.
 *
 * That leaves one genuine ambiguity to resolve. `standard` is encoded as the
 * ABSENCE of the attribute, so "no `data-skin` on `<html>`" means EITHER "the
 * visitor is on standard" OR "the IIFE never ran" (stripped by a CSP, a
 * content blocker, an app.html that regressed). Only the stored value can
 * separate them, and only in that already-degraded case do we write:
 *
 *   attribute present, valid   → adopt it. Storage is not consulted at all;
 *                                presence is unambiguous proof the IIFE ran
 *                                and resolved to exactly this skin.
 *   attribute absent, storage
 *     names a real skin        → REPAIR: the IIFE did not run. Apply it and
 *                                accept one post-hydration repaint, because
 *                                the alternative is silently losing the
 *                                visitor's skin until they pick it again.
 *   attribute absent, storage
 *     empty or "standard"      → standard. Agreement, nothing to do.
 *   attribute present, bogus   → clear it (see below).
 *
 * Note what is deliberately NOT done: no write-back of the adopted value into
 * `localStorage`. If the IIFE fell through to standard because the storage
 * getter threw, persisting "standard" here would destroy a choice we merely
 * failed to read.
 *
 * Cross-tab sync is likewise out of scope — there is no `storage` listener
 * here, matching theme.svelte.ts. A skin change in another tab reaches this
 * one on its next load.
 */
function initialize() {
	if (!browser) return;

	const painted = document.documentElement.dataset.skin;

	if (isSkinName(painted)) {
		// The healthy skinned path. Adopt verbatim, touch nothing.
		skin = painted;
		return;
	}

	const stored = readStoredSkin();

	if (stored !== null && stored !== "standard") {
		// The IIFE did not run (or ran before another tab's write). This is the
		// only branch that repaints.
		skin = stored;
		applySkin();
		return;
	}

	skin = "standard";

	// The attribute was present but named nothing we know — a stale name from an
	// older deploy, or hand-edited devtools. No skin CSS matches it, so nothing
	// is painted; but its mere PRESENCE is what the `dark:`-neutralising custom
	// variant keys off (`:not(:where([data-skin]) *)`), which would strip every
	// dark: utility from a page that is, visually, plain standard. Clear it, so
	// the invariant "the attribute exists ⇒ it names a real skin" holds.
	if (painted !== undefined) applySkin();
}

// =============================================================================
// Skin Application
// =============================================================================

/**
 * Push `skin` onto the document. The ONLY function in the app that writes
 * `data-skin` after first paint.
 */
function applySkin() {
	if (!browser) return;

	const root = document.documentElement;

	// `standard` is the ABSENCE of the attribute, never the value "standard".
	// The `dark:`-neutralising custom variant keys off presence alone, so
	// writing data-skin="standard" would silently disable dark mode on an
	// unskinned page.
	if (skin === "standard") {
		root.removeAttribute("data-skin");
	} else {
		root.dataset.skin = skin;
	}

	ensureSkinFont(SKINS[skin]);

	// Attribute FIRST, then sync. syncThemeColor() reads the active skin back
	// off <html> instead of taking an argument — it also serves applyTheme(),
	// which knows nothing about skins, and reading the DOM is how it avoids
	// importing this module back and forming a cycle. Called before the write,
	// it would paint the mobile chrome with the OUTGOING skin's colour.
	syncThemeColor();
}

/**
 * Load a skin's webfont, once.
 *
 * app.html's IIFE injects this same `<link>` before first paint for whichever
 * skin it restores, so the initial skin never waits on hydration. This covers
 * the other case: switching skins at runtime, where the incoming skin's
 * typefaces have never been requested and the page would otherwise render the
 * new palette in Bricolage Grotesque until the next reload.
 *
 * The element id is shared with the IIFE — and with the engine's own loader —
 * as `cam-font-<skin>`, so all three dedupe against each other: whoever gets
 * there first wins, everyone else no-ops. Do not rename one copy alone.
 *
 * The `rel` deliberately differs from app.html's. The IIFE uses
 * `rel="preload" as="style"` with an onload rel-swap because it runs in `<head>`
 * on the critical path, where a plain stylesheet would rebuild the serialised
 * third-party render-blocking chain that layout.css documents removing. Here
 * first paint is long past and this runs from a click, so there is nothing left
 * to block: a plain stylesheet applies the font one tick sooner and needs no
 * handler. Symmetry is not the goal; not blocking first paint was.
 *
 * The inactive skins' fonts are deliberately NOT preloaded: two extra Google
 * Fonts stylesheets on every visit, to save a few hundred milliseconds for the
 * few visitors who cycle skins, is the wrong trade. `standard` has no
 * `fontHref` at all — its Bricolage Grotesque is preloaded unconditionally in
 * app.html.
 */
function ensureSkinFont(def: SkinDef) {
	if (!def.fontHref) return;

	const id = `cam-font-${def.name}`;
	if (document.getElementById(id)) return;

	const link = document.createElement("link");
	link.id = id;
	link.rel = "stylesheet";
	link.href = def.fontHref;
	document.head.appendChild(link);
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Set the active skin.
 *
 * Mirrors `setTheme()`: state first so a non-browser caller still updates the
 * rune, then persist, then apply.
 */
export function setSkin(next: SkinName) {
	skin = next;
	if (browser) {
		writeStoredSkin(next);
		applySkin();
	}
}

/**
 * Cycle through skins: standard -> brutal -> retro-os -> standard.
 *
 * Driven by `SKIN_NAMES` rather than a local array, so adding a fourth skin to
 * the registry needs no edit here. An unknown current value would give
 * `indexOf` -1 and land on index 0, i.e. `standard` — the same safe default
 * every other path falls back to.
 */
export function cycleSkin() {
	const currentIndex = SKIN_NAMES.indexOf(skin);
	const nextIndex = (currentIndex + 1) % SKIN_NAMES.length;
	setSkin(SKIN_NAMES[nextIndex]);
}

/** Get the current skin name. */
export function getSkin(): SkinName {
	return skin;
}

/** Get the current skin's registry entry (label, themeColor, fontHref). */
export function getSkinDef(): SkinDef {
	return skinDef;
}

/** Whether any skin is active, i.e. whether `<html>` carries `data-skin`. */
export function isSkinned(): boolean {
	return skin !== "standard";
}

// =============================================================================
// Reactive Getters (for use in components)
// =============================================================================

/**
 * Create a reactive skin state object for use in components.
 *
 * Unlike `createThemeState()`, this does not lazily re-run `initialize()` on
 * first use: the call at the bottom of this file already ran under the same
 * `if (browser)` condition, and `initialize()` is adoption, not computation —
 * calling it twice would at best re-read the attribute it just adopted.
 *
 * Consumers import `SkinName` / `SKIN_NAMES` from $lib/skins/registry.js
 * directly; this module deliberately does not re-export them, so there is one
 * import path per concept.
 *
 * NOTE for the switcher UI: `skin` is `"standard"` in prerendered HTML by
 * construction (no visitor at build time), so any label rendered from it
 * changes on hydration for a skinned visitor. The attribute on `<html>` is
 * correct before first paint; the *button text* cannot be. Prefer an icon or a
 * fixed label over rendering `label` as the button's only content.
 */
export function createSkinState() {
	return {
		get skin() {
			return skin;
		},
		get def() {
			return skinDef;
		},
		get label() {
			return skinDef.label;
		},
		get isSkinned() {
			return skin !== "standard";
		},
		setSkin,
		cycleSkin,
	};
}

// Initialize when module loads (client-side)
if (browser) {
	initialize();
}
