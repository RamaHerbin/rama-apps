/**
 * Public SEO surface.
 *
 *   import { Seo } from "$lib/seo/index.js";              // root layout, once
 *   import { SITE, SITE_PATHS, absoluteUrl } from "$lib/seo/index.js"; // sitemap, scripts
 *
 * `Seo` is table-driven — mount it with no props and add routes in `routes.ts`.
 */

// Component
export { default as Seo } from "./Seo.svelte";

// Identity
export { SITE, absoluteUrl, normalisePath } from "./site.js";
export type {
	OgImage,
	PersonIdentity,
	PostalIdentity,
	EmployerIdentity,
	SchoolIdentity,
	SiteIdentity,
} from "./site.js";

// Route table
export {
	SITE_PATHS,
	PAGES,
	DEFAULT_PAGE,
	DEFAULT_ROBOTS,
	NOINDEX_ROBOTS,
	isSitePath,
} from "./routes.js";
export type { SitePath, PageSeo, GraphNode, CreativeWorkSeed } from "./routes.js";

// Structured data
export {
	JSONLD_IDS,
	buildGraph,
	serializeGraph,
	identityNodes,
	personNode,
	personImageNode,
	employerNode,
	schoolNode,
	websiteNode,
	breadcrumbNode,
	creativeWorkNode,
	creativeWorkId,
} from "./jsonld.js";
export type { JsonLdNode, JsonLdValue } from "./jsonld.js";
