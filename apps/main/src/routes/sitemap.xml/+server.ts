/**
 * /sitemap.xml — the crawler-facing index of every page on rama.app.
 *
 * The URL list is NOT written here. It is derived from `SITE_PATHS` in
 * `$lib/seo/routes.ts`, which is also what `Seo.svelte` looks its metadata up
 * in. One array, one sitemap, no drift: a route that gains a `<title>` gains a
 * `<loc>` in the same commit, and a route deleted from the table disappears
 * from both at once.
 */

import type { RequestHandler } from "./$types";
// Leaf modules, not the `$lib/seo/index.js` barrel. The barrel re-exports
// `Seo.svelte`, and a bare `export { default } from "./Seo.svelte"` is not
// side-effect-free: importing it pulls `clsx` and SvelteKit's client shim into
// this endpoint's module graph (verified in the built chunk). The named exports
// still tree-shake, so it is invisible today — the route is prerendered, so the
// graph is only ever loaded once at build time. It stops being invisible the
// day someone drops `prerender` below to make the sitemap dynamic, at which
// point that dead weight ships in a serverless function.
import { SITE_PATHS } from "$lib/seo/routes.js";
import { absoluteUrl } from "$lib/seo/site.js";

/**
 * DO NOT DELETE THIS LINE. It is not redundant with `src/routes/+layout.ts`.
 *
 * SvelteKit resolves prerendering as `page?.prerender ?? endpoint?.prerender`:
 * a `+server.ts` only inherits the layout's page options when a `+page` sits
 * beside it. This route is an endpoint with no `+page`, so `+layout.ts`'s
 * `export const prerender = true` does NOT reach it. Without the line below the
 * sitemap silently becomes a serverless function on Vercel — still reachable,
 * but no longer part of the static output, and no longer verifiable at build
 * time. Which matters here more than usual: `svelte.config.js` sets
 * `prerender.handleHttpError: 'warn'`, so nothing about this file failing is
 * ever loud enough to fail a build.
 *
 * With it set, the default `prerender.entries: ['*']` walks every
 * non-parameterised route id and enqueues `/sitemap.xml` on its own — no
 * `svelte.config.js` change, and no page has to link to it.
 */
export const prerender = true;

/**
 * Entity-escape a value for XML text content.
 *
 * Required by the sitemap protocol for `& ' " > <`. Ampersand must be replaced
 * first or the escapes it introduces get re-escaped.
 *
 * Today every `SITE_PATHS` entry is an ASCII slug, so this is a no-op — which
 * is exactly why it is here: the day a path contains an `&` or a query string,
 * the sitemap must not quietly become malformed XML.
 */
function escapeXml(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&apos;");
}

/**
 * Percent-encode the URL to the sitemap protocol's "escaped" form.
 *
 * `new URL().href` rather than `encodeURI()` on purpose: it encodes non-ASCII
 * path characters (`/café` → `/caf%C3%A9`) *and* is idempotent over sequences
 * that are already escaped, whereas `encodeURI` would turn an existing `%20`
 * into `%2520`. `absoluteUrl()` already returns a well-formed absolute URL, so
 * on the current six paths this round-trips byte-for-byte.
 */
function canonicalUrl(path: string): string {
	return new URL(absoluteUrl(path)).href;
}

/**
 * `<loc>` only, deliberately.
 *
 * - `lastmod`: the only honest source is each route's last commit date, which
 *   is not available at prerender time. `Date.now()` in module scope would be
 *   available — and would rewrite the prerendered file on every build, making
 *   the diff noisy forever while telling Google that all six pages change
 *   whenever anything does. Google discards `lastmod` it judges unreliable, so
 *   a fabricated one buys nothing and costs trust.
 * - `changefreq` / `priority`: Google has stated publicly that it ignores both.
 *   Bing treats `priority` as advisory at best. Six URLs is far below any
 *   crawl-budget threshold where hints could matter, so they would be pure
 *   noise in the file.
 *
 * The result is the minimum valid sitemap, which is also the maximum useful one
 * at this size. Add `lastmod` the day a build step can read real git dates.
 */
function renderSitemap(): string {
	const urls = SITE_PATHS.map((path) => `\t<url>\n\t\t<loc>${escapeXml(canonicalUrl(path))}</loc>\n\t</url>`);

	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
		...urls,
		"</urlset>",
		"",
	].join("\n");
}

export const GET: RequestHandler = () => {
	// Only `Content-Type` carries any weight: the prerenderer reads it to decide
	// that this response is not `text/html` and must therefore be written to
	// `prerendered/pages/sitemap.xml` verbatim rather than
	// `prerendered/pages/sitemap.xml/index.html`. adapter-vercel then copies
	// that file into `.vercel/output/static/`, where Vercel serves it and sets
	// its own caching headers — anything else set here would apply in `vite dev`
	// and nowhere else, so it is left off rather than implied.
	//
	// NOTE: `static/robots.txt` hardcodes `Sitemap: https://rama.app/sitemap.xml`.
	// A plain text file cannot import `SITE.origin`, so that one string is the
	// single duplication of the origin in the app. If the origin ever changes,
	// grep for it — `site.ts` and `robots.txt` both need the edit.
	return new Response(renderSitemap(), {
		headers: {
			"Content-Type": "application/xml; charset=utf-8",
		},
	});
};
