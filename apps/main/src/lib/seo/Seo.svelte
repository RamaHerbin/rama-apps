<!--
	Seo.svelte — the site's entire route-varying <head>.

	Mounted ONCE, in the root +layout.svelte. It is table-driven and effectively
	prop-less: it reads `page.url.pathname` and looks itself up in `PAGES`, so a
	new route needs one line in `routes.ts` and nothing here.

	Boundary with app.html (do not blur it): app.html carries only what is
	identical on all six routes — charset, viewport, fonts, icons, manifest, one
	theme-color, the anti-FOUC script. Everything route-varying lives here.
	Declaring og:image in both places would emit the tag twice, and Facebook /
	LinkedIn read the first while X reads the last — silent cross-platform
	divergence. app.html therefore has zero og:* and zero twitter:* tags.

	Never read `page.url.origin` or `page.url.href`: `kit.prerender.origin`
	defaults to `http://sveltekit-prerender`, so at build time those would bake
	a fake host into every canonical and og:url. Always
	`absoluteUrl(page.url.pathname)`.

	Unknown pathname (the error page, or a route someone forgot to register):
	degrades to `DEFAULT_PAGE`, i.e. site-level title/description plus the
	identity graph. It never emits an empty <title> and never throws — with
	`prerender.handleHttpError: 'warn'` a throw here would turn a green build
	into a silently missing page. Error responses (status >= 400) additionally
	get `noindex, follow`, no canonical, and an `og:url` pointed at the home page
	rather than at the failing URL — a canonical that resolves to a 404 is a
	defect, and `og:url` is the canonical as far as Facebook, LinkedIn and Slack
	are concerned, so fixing only one of the two fixes nothing. A *non-error*
	unknown route is still indexable on
	purpose: shipping a real page with generic copy is recoverable, whereas
	silently noindexing it is invisible. `building` makes that case loud in the
	build log.

	No twitter:site / twitter:creator — no handle exists, and pointing them at
	nothing is worse than omitting them.
-->
<script lang="ts">
	import { untrack } from "svelte";
	import { page } from "$app/state";
	import { building, dev } from "$app/environment";
	import { SITE, absoluteUrl, normalisePath, type OgImage } from "./site.js";
	import {
		PAGES,
		DEFAULT_PAGE,
		DEFAULT_ROBOTS,
		NOINDEX_ROBOTS,
		isSitePath,
		type SitePath,
	} from "./routes.js";
	import { buildGraph, serializeGraph } from "./jsonld.js";

	interface Props {
		/** Escape hatch for a future dynamic route. The six static routes pass nothing. */
		title?: string;
		description?: string;
		image?: OgImage;
		robots?: string;
		ogType?: "website" | "article" | "profile";
		/** Force `noindex, follow` (staging previews, thin pages). */
		noindex?: boolean;
		/** Override the looked-up pathname. Testing / dynamic routes only. */
		path?: string;
	}

	let {
		title,
		description,
		image,
		robots,
		ogType,
		noindex = false,
		path,
	}: Props = $props();

	const pathname = $derived(normalisePath(path ?? page.url.pathname));
	const matchedPath = $derived<SitePath | null>(isSitePath(pathname) ? pathname : null);
	const seo = $derived(matchedPath ? PAGES[matchedPath] : DEFAULT_PAGE);

	/** 4xx/5xx must never be indexed, whatever the table says. */
	const isError = $derived(page.status >= 400);

	const resolvedTitle = $derived(title ?? seo.title);
	const resolvedDescription = $derived(description ?? seo.description);
	const resolvedOgType = $derived(ogType ?? seo.ogType ?? "website");
	const resolvedRobots = $derived(
		robots ?? (noindex || isError ? NOINDEX_ROBOTS : (seo.robots ?? DEFAULT_ROBOTS))
	);

	const canonical = $derived(absoluteUrl(pathname));

	/**
	 * `og:url` is the canonical URL *for Open Graph consumers* — Facebook,
	 * LinkedIn and Slack key the shared object on it, exactly as Google keys on
	 * `<link rel="canonical">`. So suppressing the canonical on an error response
	 * while still emitting `og:url` for the same URL would only half-fix the
	 * defect: a shared broken link would still unfurl as a legitimate-looking
	 * card claiming that 404 exists.
	 *
	 * Omitting the tag is not the fix either — `og:url` is a required Open Graph
	 * property, and consumers that don't find it fall back to the fetched URL,
	 * i.e. the 404 again. Pointing it at the home page is: the error page already
	 * renders `DEFAULT_PAGE`, so its title and description are the home page's,
	 * and this makes the URL agree with the copy that ships beside it.
	 */
	const ogUrl = $derived(isError ? absoluteUrl("/") : canonical);

	const ogImage = $derived(image ?? seo.image ?? SITE.ogImage);
	const ogImageUrl = $derived(absoluteUrl(ogImage.url));

	const jsonLd = $derived(serializeGraph(buildGraph(matchedPath, seo)));

	// Loud where it counts: `building` is true during prerender, so an
	// unregistered route prints in the production build log — not only in dev,
	// and not only for whoever happens to open the console.
	//
	// `untrack` because this is a deliberate one-shot setup-time read: each
	// prerendered page renders this component exactly once, so re-running the
	// check on client-side navigation would add nothing to the build log.
	if (building || dev) {
		untrack(() => {
			if (!matchedPath && page.status < 400) {
				console.warn(
					`[seo] no PAGES entry for "${pathname}" — falling back to site-level metadata. Add it to src/lib/seo/routes.ts.`
				);
			}
		});
	}
</script>

<svelte:head>
	<title>{resolvedTitle}</title>
	<meta name="description" content={resolvedDescription} />
	<meta name="author" content={SITE.person.name} />
	<meta name="robots" content={resolvedRobots} />
	{#if !isError}
		<link rel="canonical" href={canonical} />
	{/if}

	<!-- Open Graph — Facebook, LinkedIn, Slack, Discord, iMessage -->
	<meta property="og:type" content={resolvedOgType} />
	<meta property="og:site_name" content={SITE.siteName} />
	<meta property="og:locale" content={SITE.locale} />
	<meta property="og:title" content={resolvedTitle} />
	<meta property="og:description" content={resolvedDescription} />
	<meta property="og:url" content={ogUrl} />
	<meta property="og:image" content={ogImageUrl} />
	<meta property="og:image:type" content={ogImage.type} />
	<meta property="og:image:width" content={String(ogImage.width)} />
	<meta property="og:image:height" content={String(ogImage.height)} />
	<meta property="og:image:alt" content={ogImage.alt} />

	<!-- X / Twitter. No twitter:site or twitter:creator: no handle exists. -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={resolvedTitle} />
	<meta name="twitter:description" content={resolvedDescription} />
	<meta name="twitter:image" content={ogImageUrl} />
	<meta name="twitter:image:alt" content={ogImage.alt} />

	<!--
		JSON-LD. The closing tag is split so the string never contains a literal
		script terminator, and `serializeGraph` escapes every `<` in the payload.
	-->
	{#if jsonLd}
		{@html `<script type="application/ld+json">${jsonLd}<` + `/script>`}
	{/if}
</svelte:head>
