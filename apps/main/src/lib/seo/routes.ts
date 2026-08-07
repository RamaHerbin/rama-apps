/**
 * The route metadata table — THE single source of truth for every indexable
 * page on rama.app.
 *
 * `PAGES` is typed `Record<SitePath, PageSeo>` on purpose: `SitePath` is derived
 * from `SITE_PATHS`, so adding a path to the array without writing its metadata
 * (or vice-versa) is a *type error*, caught by `pnpm --filter main check` long
 * before a page ships with a missing `<title>`. That matters more than usual
 * here — `svelte.config.js` sets `prerender.handleHttpError: 'warn'`, so SEO
 * regressions never fail the build on their own.
 *
 * Consumers:
 *   - `Seo.svelte`      looks the current pathname up here.
 *   - `/sitemap.xml`    iterates `SITE_PATHS` (ordered, most important first).
 *   - `jsonld.ts`       reads `name` / `breadcrumb` / `creativeWork` to build @graph.
 *
 * On `<lastmod>`: deliberately absent. The only honest source would be each
 * route's last git commit date, which is not available at prerender time, and
 * an invented or build-time date is worse than none — Google ignores `lastmod`
 * values it finds unreliable, and `Date.now()` in module scope would rewrite
 * the prerendered sitemap on every single build. `changefreq`/`priority` are
 * omitted for the same reason: Google has publicly ignored both for years.
 */

import type { OgImage } from "./site.js";

// =============================================================================
// Paths
// =============================================================================

/**
 * Every prerendered, indexable path, in sitemap order (broad → deep).
 * Ordering is meaningful for humans reading the sitemap; crawlers ignore it.
 */
export const SITE_PATHS = [
	"/",
	"/photo",
	"/carbon",
	"/projects/personal",
	"/projects/fleur-de-papier",
	"/projects/fleur-de-papier/bnf-richelieu",
] as const;

/** String-literal union of the six routes. Derived so it can never drift. */
export type SitePath = (typeof SITE_PATHS)[number];

const SITE_PATH_SET: ReadonlySet<string> = new Set(SITE_PATHS);

/** Type guard: is this pathname one of the six known routes? */
export function isSitePath(pathname: string): pathname is SitePath {
	return SITE_PATH_SET.has(pathname);
}

// =============================================================================
// Types
// =============================================================================

/**
 * Which nodes of the JSON-LD `@graph` a page emits.
 *
 *   identity     — Person + ImageObject + Organization (employer) + EducationalOrganization (school)
 *   website      — WebSite, once, on the home page only
 *   breadcrumbs  — BreadcrumbList, on nested routes
 *   creativeWork — CreativeWork, on the two case studies
 *
 * Deliberately absent (see the SEO contract): `Review` / `AggregateRating`
 * (self-serving reviews on your own site risk a Google manual action),
 * `WebSite.potentialAction` (no site search exists — declaring one is a spam
 * signal), and `Article` (no publication date exists for the case studies).
 */
export type GraphNode = "identity" | "website" | "breadcrumbs" | "creativeWork";

/** Seed data for a `CreativeWork` node on a case-study page. */
export interface CreativeWorkSeed {
	readonly name: string;
	readonly description: string;
	/** Free-text genre, e.g. "Interactive installation". */
	readonly genre: string;
	/** Subjects, emitted as `about`. */
	readonly about: readonly string[];
	/** Parent case study, linked via `isPartOf`. */
	readonly isPartOf?: SitePath;
}

export interface PageSeo {
	/** `<title>` and `og:title`. ≤ 60 chars so Google doesn't truncate it. */
	readonly title: string;
	/** `<meta name="description">` and `og:description`. 140–160 chars. */
	readonly description: string;
	/** Short human label — breadcrumb entries and CreativeWork names. */
	readonly name: string;
	/** Nodes this page contributes to the JSON-LD graph. */
	readonly jsonLd: readonly GraphNode[];
	/**
	 * Breadcrumb ancestors, root-first, excluding the page itself (the builder
	 * appends it). `/projects` is skipped intentionally — no such route exists,
	 * and a breadcrumb pointing at a 404 is a structured-data defect.
	 */
	readonly breadcrumb?: readonly SitePath[];
	/** Present iff `jsonLd` includes `"creativeWork"`. */
	readonly creativeWork?: CreativeWorkSeed;
	/** Per-route social card override; falls back to `SITE.ogImage`. */
	readonly image?: OgImage;
	/** Per-route robots override; falls back to `DEFAULT_ROBOTS`. */
	readonly robots?: string;
	/** Open Graph object type. Every current route is a plain `website`. */
	readonly ogType?: "website" | "article" | "profile";
}

// =============================================================================
// Robots
// =============================================================================

/**
 * `max-image-preview:large` is what unlocks the big thumbnail in Google
 * Discover and image-rich results; `max-snippet:-1` lifts the snippet cap.
 * Both are opt-in — the default is deliberately conservative on Google's side.
 */
export const DEFAULT_ROBOTS = "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

/** Applied to error responses, which must never enter the index. */
export const NOINDEX_ROBOTS = "noindex, follow";

// =============================================================================
// The table
// =============================================================================

/**
 * Route metadata, verbatim from the SEO contract. Do not reword: titles are
 * length-budgeted against the SERP, descriptions against the 160-char cut.
 * The separator is U+00B7 MIDDLE DOT with spaces on both sides.
 */
export const PAGES: Record<SitePath, PageSeo> = {
	"/": {
		title: "Rama Herbin · Front-End & UI Engineer",
		description:
			"Front-End & UI Engineer at Ansys (Synopsys), building safety-critical UIs in Lyon. Case studies, cultural web experiences, photography and open-source Svelte.",
		name: "Home",
		jsonLd: ["identity", "website"],
	},

	"/photo": {
		title: "Photography · Rama Herbin",
		description:
			"Move the cursor, the frames follow: a photographic teaser from Rama Herbin, front-end engineer and photographer. The full archive lives on photo.rama.app.",
		name: "Photography",
		jsonLd: ["identity"],
	},

	"/carbon": {
		title: "Carbon Footprint · Rama Herbin",
		description:
			"What this portfolio costs the planet: roughly 0.2 g CO2 per visit on a 45 KB bundle, through prerendering, modern image formats and reduced-motion rendering.",
		name: "Carbon Footprint",
		jsonLd: ["identity"],
	},

	"/projects/personal": {
		title: "Personal Projects · Rama Herbin",
		description:
			"Side projects by Rama Herbin: FancyUI, an open-source Svelte 5 component library on npm, a blog platform, WebGL experiments and a 2023 portfolio archive.",
		name: "Personal Projects",
		jsonLd: ["identity", "breadcrumbs"],
		breadcrumb: ["/"],
	},

	"/projects/fleur-de-papier": {
		title: "Fleur de Papier · Case Study · Rama Herbin",
		description:
			"Three years as creative developer at Fleur de Papier: six productions for the BnF, La Contemporaine and Terre Adélice, from touch tables to editorial web apps.",
		name: "Fleur de Papier",
		jsonLd: ["identity", "breadcrumbs", "creativeWork"],
		breadcrumb: ["/"],
		creativeWork: {
			name: "Fleur de Papier — creative development case study",
			description:
				"Three years as creative developer at Fleur de Papier: six productions for the BnF, La Contemporaine and Terre Adélice, from touch tables to editorial web apps.",
			genre: "Case study",
			about: ["Creative development", "Cultural mediation", "Interactive installations"],
		},
	},

	"/projects/fleur-de-papier/bnf-richelieu": {
		title: "BnF Richelieu · Fleur de Papier · Rama Herbin",
		description:
			"A large-format touch installation for the BnF Richelieu: visitors explore collection highlights by hand, on screens built for a heritage reading room in Paris.",
		name: "BnF Richelieu",
		jsonLd: ["identity", "breadcrumbs", "creativeWork"],
		breadcrumb: ["/", "/projects/fleur-de-papier"],
		creativeWork: {
			name: "BnF Richelieu — touch installation",
			description:
				"A large-format touch installation for the BnF Richelieu: visitors explore collection highlights by hand, on screens built for a heritage reading room in Paris.",
			genre: "Interactive installation",
			about: ["Touch interface", "Heritage collections", "Bibliothèque nationale de France"],
			isPartOf: "/projects/fleur-de-papier",
		},
	},
};

/**
 * Site-level fallback for a pathname that is not in the table — the error page,
 * or a route someone added without registering it here.
 *
 * It must never yield an empty `<title>` and must never throw: with
 * `handleHttpError: 'warn'`, a throw during SSR turns a *green build* into a
 * *silently missing page*. Reusing the home page's copy is the honest default —
 * it describes the site, which is exactly what an unknown URL on it is about.
 */
export const DEFAULT_PAGE: PageSeo = {
	title: PAGES["/"].title,
	description: PAGES["/"].description,
	name: PAGES["/"].name,
	jsonLd: ["identity"],
};
