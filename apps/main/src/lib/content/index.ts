/**
 * Public content API for the portfolio.
 *
 *   import { c, cList } from "$lib/content/index.js";
 *
 * `c(key)` → string, `cList(key)` → string[]. Both read from the static
 * `content/site-content.json` map, overlaid by any optimistic edit-mode updates.
 * The reactive state itself lives in `./store.svelte.ts` because Svelte 5 runes
 * require a `.svelte.ts` module; this file is the stable import surface consumers
 * (and the frozen EDIT-CONTRACT) reference.
 */
export { c, cList, getAll, applyLocal } from "./store.svelte.js";
export type { ContentValue, ContentMap } from "./store.svelte.js";
