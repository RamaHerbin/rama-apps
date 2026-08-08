/**
 * The skin registry — THE single source of truth for the three runtime skins.
 *
 * A "skin" repaints the whole site from fancy-ui's Cameleon design engine.
 * `standard` is not a skin at all: it is the absence of one, i.e. today's
 * light/dark theme, and it is represented by the ABSENCE of `data-skin` on
 * `<html>`. The mere presence of that attribute means "skinned".
 *
 * Deliberately pure TypeScript: no runes, no DOM, no `fancy-ui-svelte` import.
 * Two of the four consumers below cannot execute Svelte or resolve the engine —
 * `vite.config.ts` loads this at build time in plain Node, and the store must be
 * importable from a module that runs before hydration.
 *
 * ---------------------------------------------------------------------------
 * WHY THESE VALUES APPEAR IN FOUR PLACES
 * ---------------------------------------------------------------------------
 * Four consumers must never disagree. Two of them CANNOT import this file, so
 * they hold hand-written copies. That is a deliberate, guarded duplication:
 *
 *   1. src/lib/stores/skin.svelte.ts — imports. No duplication.
 *      Reads `SKIN_NAMES` for cycle order, `SKINS` for label/themeColor/fontHref,
 *      `SKIN_STORAGE_KEY` for persistence, `isSkinName` to validate what it reads
 *      back out of `localStorage`.
 *
 *   2. src/routes/skins.css — DUPLICATES the skin names (as `[data-skin="…"]`
 *      selectors) and the page-background hexes. CSS cannot import TypeScript,
 *      and inlining tokens from JS is not an option here because
 *      `FancyProvider` is never mounted (see the architecture note below), so
 *      nothing writes the engine's tokens at runtime — skins.css writes them by
 *      hand. Every `themeColor` below MUST equal that skin's `--skin-page-bg`
 *      in skins.css, or the mobile browser chrome desyncs from the page.
 *
 *   3. src/app.html — DUPLICATES `SKIN_STORAGE_KEY`, the name allow-list, the
 *      `themeColor` hexes and the `fontHref` URLs, inside the anti-FOUC IIFE.
 *      An .html file cannot import anything. It has to be app.html: the site is
 *      fully prerendered (`prerender = true`, adapter-vercel), so there is no
 *      request to read a cookie from and no visitor at prerender time; and a
 *      component-level provider only exists after hydration, which means every
 *      skinned visit would flash `standard` first. `<html>` is the only
 *      pre-paint surface.
 *
 *   4. vite.config.ts — the build-time DRIFT GUARD. It imports this file and
 *      asserts that the literals in skins.css and app.html still match. It runs
 *      in `vite build`, so drift fails the Vercel deploy, not just a local
 *      `pnpm check`. This is the only thing standing between copies (2) and (3)
 *      and silent rot — `svelte.config.js` sets `prerender.handleHttpError:
 *      'warn'`, so nothing else in this codebase turns a mismatch red.
 *
 * If you change ANY value in this file, expect the guard to fail until you have
 * updated skins.css and app.html to match. That failure is the feature.
 */

// =============================================================================
// Names
// =============================================================================

/**
 * Every selectable skin, in cycle order. `standard` is first because it is the
 * default state and the one a visitor returns to by cycling past the last skin.
 *
 * The array is the source; the union is derived from it (same trick as
 * `SITE_PATHS` / `SitePath` in $lib/seo/routes.ts) so a name can never exist in
 * one and not the other.
 */
export const SKIN_NAMES = ["standard", "brutal", "retro-os"] as const;

/** String-literal union of the three skins. Derived so it can never drift. */
export type SkinName = (typeof SKIN_NAMES)[number];

const SKIN_NAME_SET: ReadonlySet<string> = new Set(SKIN_NAMES);

/**
 * The shared allow-list validator. The store, the app.html IIFE and the build
 * guard must all agree on these semantics:
 *
 *   unknown value / malformed value / absent value  →  fall back to "standard"
 *
 * i.e. this returns `false` for everything that is not one of the three exact
 * strings, including `null`, `undefined` and non-strings. Callers must not
 * "repair" a near-miss (no trimming, no lowercasing): a stale or tampered
 * `localStorage` entry has to resolve to the default, not to a guess.
 *
 * app.html cannot call this — it re-implements the same check inline as
 * `v === "brutal" || v === "retro-os"` (it has no need to name "standard",
 * since standard is exactly "do not set the attribute").
 */
export function isSkinName(v: unknown): v is SkinName {
	return typeof v === "string" && SKIN_NAME_SET.has(v);
}

// =============================================================================
// Types
// =============================================================================

/** Everything the app needs to know about one skin. */
export interface SkinDef {
	readonly name: SkinName;

	/** Human-facing name, shown in the skin switcher. Matches the engine's own label. */
	readonly label: string;

	/**
	 * The `<meta name="theme-color">` value to apply while this skin is active,
	 * or `null` when the skin does not own that tag.
	 *
	 * Required-but-nullable rather than optional on purpose: `standard` has to
	 * declare its abstention explicitly, because forgetting the field would look
	 * identical to choosing not to have one. `standard` is `null` because the
	 * light/dark theme owns theme-color there — see the three-way contract
	 * documented in $lib/stores/theme.svelte.ts (`#ffffff` for `:root`,
	 * `#0a0a0a` for `.dark`). Both real skins are light-only, so a single hex
	 * each is correct and complete.
	 *
	 * These are plain hex, not oklch, precisely so they are usable as a
	 * theme-color value: oklch() in theme-color is dropped outright by older
	 * iOS Safari.
	 */
	readonly themeColor: string | null;

	/**
	 * Google Fonts stylesheet for this skin's typefaces, injected lazily by the
	 * app.html IIFE when (and only when) the skin is active. Absent for
	 * `standard`, which uses the app's own Bricolage Grotesque, already
	 * preloaded in app.html unconditionally.
	 */
	readonly fontHref?: string;
}

// =============================================================================
// Registry
// =============================================================================

/**
 * The three skins.
 *
 * `themeColor` is transcribed from the engine's `--skin-page-bg` token
 * (fancy-ui: dist/cameleon/skins/<skin>/tokens.js) and must stay equal to the
 * `--skin-page-bg` written in src/routes/skins.css.
 *
 * `fontHref` is the engine's own font URL (dist/cameleon/skins/<skin>/index.js),
 * verbatim for both skins.
 *
 * retro-os's URL used to be trimmed of `&family=Silkscreen:wght@400;700`. That
 * was correct while the skin was a re-paint and nothing else: the engine wants
 * Silkscreen for window titlebars and a taskbar, the first pass of this port
 * shipped tokens + skin CSS with no chassis at all, and a webfont downloaded for
 * zero consumers is the most conspicuous kind of waste. The retro-os TREE
 * (src/lib/retro/, selected by the `data-tree` seam in src/routes/retro.css) is
 * that consumer: every window titlebar, button, chip and status strip in it
 * renders in `--r-font-pixel`, which resolves through `--skin-font-pixel` to
 * Silkscreen. Drop the segment again and none of that errors — it silently falls
 * back to IBM Plex Mono and the chrome stops reading as pixels. So it stays for
 * as long as that tree exists, and skins.css must keep declaring the token.
 */
export const SKINS: Record<SkinName, SkinDef> = {
	standard: {
		name: "standard",
		label: "Standard",
		themeColor: null
	},
	brutal: {
		name: "brutal",
		label: "Brutal",
		// --skin-page-bg / --skin-paper, brutal tokens.js
		themeColor: "#F4EEE0",
		// Archivo + Space Mono, verbatim from brutalSkin.fonts[0].href
		fontHref:
			"https://fonts.googleapis.com/css2?family=Archivo:wght@400..900&family=Space+Mono:wght@400;700&display=swap"
	},
	"retro-os": {
		name: "retro-os",
		label: "Retro OS",
		// --skin-page-bg / --skin-paper, retro-os tokens.js.
		// NOT --skin-desk (#E5DCC2): the desk is the surface *outside* the window
		// chassis, and this port has no chassis, so the page is the paper.
		themeColor: "#F1E9D4",
		// Archivo + IBM Plex Mono + Silkscreen, verbatim from
		// retroOsSkin.fonts[0].href. Silkscreen is load-bearing: it is the face
		// behind --skin-font-pixel / --r-font-pixel, i.e. every titlebar, button
		// and chip in the retro tree. See the note above the object.
		fontHref:
			"https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;900&family=IBM+Plex+Mono:wght@400;500;600;700&family=Silkscreen:wght@400;700&display=swap"
	}
};

// =============================================================================
// Persistence
// =============================================================================

/**
 * `localStorage` key for the visitor's skin choice.
 *
 * Named for the app, not for the library: the skin is a rama.app concept and
 * this key is ours to version. The neighbouring theme key is `"fancy-ui-theme"`
 * — a vestige of the FancyUI migration that now names a dependency the app no
 * longer takes its theming from, and renaming it would silently reset every
 * existing visitor's light/dark choice. Do not copy that mistake forward.
 *
 * Unlike the theme key, this one is EXPORTED, so the store and the build guard
 * share the literal instead of re-typing it. src/app.html still hard-codes the
 * string (it cannot import); the guard is what keeps that copy honest.
 */
export const SKIN_STORAGE_KEY = "rama-skin";

/**
 * Routes a skin must never be applied to.
 *
 * `/photo` and `/carbon` are standalone always-dark designs — their page roots
 * commit to `bg-black text-white` outright rather than reading `--background`,
 * and neither renders `NavAnchor`. Skinning them is wrong three times over:
 *
 *   1. There is nothing to repaint. The pages ignore the token layer by
 *      construction, so a skin buys no visual change on the content itself.
 *   2. It actively damages them. `ScrollBlurOverlay` is a sibling of the page in
 *      the root layout and paints `bg-background/90`, so a light `--background`
 *      lays a cream band across the bottom of a black page — on `/photo` it
 *      swallows the "move your cursor" hint.
 *   3. There is no way out. With no `NavAnchor` there is no switcher, so a
 *      visitor arriving from search with a stored skin is simply stuck.
 *
 * Note this is about the SKIN only. These routes' relationship with the ordinary
 * light theme is a separate, pre-existing question — the cream band reproduces
 * in standard light with no skin active — and answering it means deciding what
 * an always-dark page should be under a light theme, which is a design call.
 *
 * Duplicated as literals in src/app.html (which cannot import); the build guard
 * in vite.config.ts is what keeps the two copies in step.
 */
export const SKIN_EXCLUDED_PATHS = ["/photo", "/carbon"] as const;

/**
 * Whether a skin may paint this pathname. Trailing slashes are tolerated because
 * the attribute is written from `location.pathname`, which can carry one.
 */
export function skinAppliesTo(pathname: string): boolean {
	const path = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
	return !(SKIN_EXCLUDED_PATHS as readonly string[]).includes(path);
}
