/**
 * Reactive content store (Svelte 5 runes).
 *
 * The authoritative content lives in `apps/main/content/site-content.json`, a
 * flat namespaced map imported statically so its values are baked into the
 * prerendered build. `c()` / `cList()` read through a module-level `$state`
 * overlay: in normal (non-edit) usage nothing ever writes to the overlay, so
 * reads resolve straight to the static JSON and the prerendered HTML carries the
 * baked strings. In edit mode, `applyLocal()` writes into the overlay for
 * optimistic updates and — because the overlay is reactive — every `c()`/`cList()`
 * read in a component template re-renders in place.
 *
 * Runes require a `.svelte.ts` module; `./index.ts` is the public entry point
 * that re-exports this API.
 */
import raw from "../../../content/site-content.json";

export type ContentValue = string | string[];
export type ContentMap = Record<string, ContentValue>;

const base = raw as ContentMap;

// Optimistic overlay used only by edit mode. Empty in normal builds → every read
// falls through to `base`, so the compiler + prerender collapse to static values.
const overlay = $state<ContentMap>({});

function lookup(key: string): ContentValue | undefined {
	return key in overlay ? overlay[key] : base[key];
}

/** Resolve a string content key. Warns + returns the key when missing/mistyped. */
export function c(key: string): string {
	const value = lookup(key);
	if (value === undefined) {
		console.warn(`[content] missing key: "${key}"`);
		return key;
	}
	if (Array.isArray(value)) {
		console.warn(`[content] key "${key}" is a list — use cList()`);
		return key;
	}
	return value;
}

/** Resolve a string[] content key. Warns + returns [] when missing/mistyped. */
export function cList(key: string): string[] {
	const value = lookup(key);
	if (value === undefined) {
		console.warn(`[content] missing list key: "${key}"`);
		return [];
	}
	if (!Array.isArray(value)) {
		console.warn(`[content] key "${key}" is not a list — use c()`);
		return [];
	}
	return value;
}

/** Raw merged map (base + overlay). Useful for the edit runtime. */
export function getAll(): ContentMap {
	return { ...base, ...overlay };
}

/** Optimistic local update for edit mode. Reactive: re-renders every reader. */
export function applyLocal(key: string, value: ContentValue): void {
	overlay[key] = value;
}
