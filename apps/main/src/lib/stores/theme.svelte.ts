/**
 * Theme Store
 *
 * Manages theme state (dark/light mode) and user preferences.
 * Provides reactive stores and utilities for theme switching.
 */

import { browser } from "$app/environment";
import { SKINS, isSkinName } from "$lib/skins/registry.js";

// =============================================================================
// Types
// =============================================================================

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export interface ThemeState {
	/** Current theme setting */
	theme: Theme;
	/** Resolved theme (actual light/dark based on system preference if theme is 'system') */
	resolvedTheme: ResolvedTheme;
	/** Whether user prefers reduced motion */
	reducedMotion: boolean;
}

// =============================================================================
// State
// =============================================================================

const STORAGE_KEY = "fancy-ui-theme";

/** Reactive theme state using Svelte 5 runes */
let theme = $state<Theme>("system");
let systemPrefersDark = $state(false);
let reducedMotion = $state(false);

/** Derived resolved theme */
const resolvedTheme = $derived<ResolvedTheme>(
	theme === "system" ? (systemPrefersDark ? "dark" : "light") : theme
);

// =============================================================================
// Initialization
// =============================================================================

/**
 * Read the stored preference, tolerating a storage layer that throws.
 *
 * `localStorage` is not merely empty under "block all cookies", Firefox with
 * cookies disabled, or some enterprise/partitioned contexts — the *getter*
 * itself throws. Unguarded, that exception escapes `initialize()`, which runs
 * bare at module scope (see the bottom of this file), so the whole chunk fails
 * to evaluate, the layout node's dynamic import rejects, and `kit.start()`
 * never completes: the entire site silently loses hydration on every route.
 *
 * The anti-FOUC script in src/app.html is guarded the same way and must stay
 * in lockstep with the allow-list below.
 */
function readStoredTheme(): Theme | null {
	try {
		const saved = localStorage.getItem(STORAGE_KEY);
		return saved && ["light", "dark", "system"].includes(saved) ? (saved as Theme) : null;
	} catch {
		return null;
	}
}

function initialize() {
	if (!browser) return;

	// Load saved theme preference
	const saved = readStoredTheme();
	if (saved) {
		theme = saved;
	}

	// Check system dark mode preference
	const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");
	systemPrefersDark = darkModeQuery.matches;

	// Listen for system theme changes
	darkModeQuery.addEventListener("change", (e) => {
		systemPrefersDark = e.matches;
		applyTheme();
	});

	// Check reduced motion preference
	const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
	reducedMotion = motionQuery.matches;

	// Listen for motion preference changes
	motionQuery.addEventListener("change", (e) => {
		reducedMotion = e.matches;
	});

	// Apply initial theme
	applyTheme();
}

// =============================================================================
// Theme Application
// =============================================================================

function applyTheme() {
	if (!browser) return;

	const root = document.documentElement;
	const resolved = theme === "system" ? (systemPrefersDark ? "dark" : "light") : theme;

	if (resolved === "dark") {
		root.classList.add("dark");
	} else {
		root.classList.remove("dark");
	}

	// Update meta theme-color for mobile browsers. Light/dark is only half the
	// answer now that a skin can repaint the page — see syncThemeColor() below.
	syncThemeColor();
}

/**
 * Point <meta name="theme-color"> at whatever is actually painting the page:
 * the active skin's background if there is one, otherwise the light/dark theme's.
 *
 * Four-way contract — all four must agree or the mobile browser chrome desyncs
 * from the page:
 *
 *   1. src/app.html — exactly ONE <meta name="theme-color">, shipped holding the
 *      LIGHT value (#ffffff) because the `dark` class is only ever added by script:
 *      a scripting-disabled visitor renders :root and must not get a white page
 *      under a dark chrome bar. The anti-FOUC IIFE below it corrects that tag
 *      before first paint — to #0a0a0a when it resolves dark, or to the skin's
 *      themeColor when it restores a skin from localStorage. It has to happen
 *      there: the site is fully prerendered (adapter-vercel), so there is no
 *      server render to do it and no request to read a cookie from.
 *   2. src/routes/layout.css  :root { --background: oklch(1 0 0) }     → #ffffff (light)
 *      src/routes/layout.css  .dark { --background: oklch(0.145 0 0) } → #0a0a0a (dark)
 *      …overridden, when a skin is active, by --skin-page-bg in src/routes/skins.css,
 *      whose html[data-skin="…"] selector outranks both :root and .dark.
 *   3. THIS function, which swaps between all of the above at runtime — from
 *      applyTheme() on a light/dark change, and from $lib/stores/skin.svelte.ts
 *      on a skin change.
 *   4. src/lib/skins/registry.ts — SKINS[skin].themeColor, the hex used here. It
 *      MUST equal that skin's --skin-page-bg in skins.css.
 *
 * What enforces it: skinContractGuard() in vite.config.ts, which imports the
 * registry at build time and fails the build when the hand-written copies in
 * app.html and skins.css drift from it. Nothing else turns a mismatch red —
 * svelte.config.js sets prerender.handleHttpError: 'warn', so a broken build
 * stays green.
 *
 * oklch(0.145 0 0) is #0a0a0a exactly; do not "fix" it to #252525, which is
 * oklch(0.269 0 0) — that is --border, not --background.
 *
 * The light/dark pair stays hardcoded rather than read from
 * getComputedStyle(document.documentElement).getPropertyValue("--background"):
 * that returns the literal "oklch(0.145 0 0)" string, and theme-color parsing of
 * oklch() is not universally supported (older iOS Safari drops the tag entirely,
 * leaving the status bar on the previous theme's color). The skin hexes are safe
 * to emit only because the engine's tokens are plain hex — that is precisely why
 * registry.ts carries them instead of skins.css being read back.
 *
 * The active skin is read off <html>, NOT from the skin store: that store imports
 * this function, so importing it back would be a cycle. <html> is the
 * authoritative surface anyway — app.html writes data-skin there before first
 * paint, long before either store exists.
 *
 * Note: until the icons/SEO work added the meta tag to app.html, the querySelector
 * below found nothing and this was a permanent no-op. It only does something now
 * because that tag exists — if you ever remove it from app.html, remove this too.
 */
export function syncThemeColor() {
	if (!browser) return;

	// Absent attribute → undefined → not a skin name → standard. "standard" is
	// never written to the DOM, but it survives the same path: its themeColor is
	// null, which falls through to the light/dark pair below.
	const skin = document.documentElement.dataset.skin;
	const skinColor = isSkinName(skin) ? SKINS[skin].themeColor : null;

	const metaThemeColor = document.querySelector('meta[name="theme-color"]');
	if (metaThemeColor) {
		metaThemeColor.setAttribute(
			"content",
			skinColor ?? (resolvedTheme === "dark" ? "#0a0a0a" : "#ffffff")
		);
	}
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Set the theme
 */
export function setTheme(newTheme: Theme) {
	theme = newTheme;
	if (browser) {
		try {
			localStorage.setItem(STORAGE_KEY, newTheme);
		} catch {
			// Storage blocked or over quota: the toggle still works for this
			// session, it just will not survive a reload. Never let it throw —
			// this runs from a click handler in NavAnchor.
		}
		applyTheme();
	}
}

/**
 * Toggle between light and dark themes
 * If currently on 'system', switches to the opposite of the resolved theme
 */
export function toggleTheme() {
	const newTheme = resolvedTheme === "dark" ? "light" : "dark";
	setTheme(newTheme);
}

/**
 * Cycle through themes: light -> dark -> system -> light
 */
export function cycleTheme() {
	const order: Theme[] = ["light", "dark", "system"];
	const currentIndex = order.indexOf(theme);
	const nextIndex = (currentIndex + 1) % order.length;
	setTheme(order[nextIndex]);
}

/**
 * Get current theme state
 */
export function getThemeState(): ThemeState {
	return {
		theme,
		resolvedTheme,
		reducedMotion,
	};
}

/**
 * Get the current theme setting
 */
export function getTheme(): Theme {
	return theme;
}

/**
 * Get the resolved theme (actual light/dark)
 */
export function getResolvedTheme(): ResolvedTheme {
	return resolvedTheme;
}

/**
 * Check if reduced motion is preferred
 */
export function getReducedMotion(): boolean {
	return reducedMotion;
}

/**
 * Check if dark mode is active
 */
export function isDark(): boolean {
	return resolvedTheme === "dark";
}

/**
 * Check if light mode is active
 */
export function isLight(): boolean {
	return resolvedTheme === "light";
}

// =============================================================================
// Reactive Getters (for use in components)
// =============================================================================

/**
 * Create a reactive theme state object for use in components
 */
export function createThemeState() {
	// Initialize on first use (client-side only)
	if (browser && theme === "system" && !readStoredTheme()) {
		initialize();
	}

	return {
		get theme() {
			return theme;
		},
		get resolvedTheme() {
			return resolvedTheme;
		},
		get reducedMotion() {
			return reducedMotion;
		},
		get isDark() {
			return resolvedTheme === "dark";
		},
		get isLight() {
			return resolvedTheme === "light";
		},
		setTheme,
		toggleTheme,
		cycleTheme,
	};
}

// Initialize when module loads (client-side)
if (browser) {
	initialize();
}
