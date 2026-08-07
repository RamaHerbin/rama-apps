/**
 * JSON-LD `@graph` builders.
 *
 * One graph per page, assembled from nodes with **stable `@id` anchors** so
 * that Google merges the Person seen on `/carbon` with the Person seen on
 * `/projects/fleur-de-papier` into a single entity instead of six lookalikes.
 * The anchors are absolute and rooted at the home page (`https://rama.app/#person`)
 * because relative `@id`s resolve against the *current* page URL and would
 * therefore differ per route.
 *
 * Everything here is static: zero runtime data, zero `Date` calls, zero DOM.
 * The output is byte-identical on every build, which keeps the prerendered HTML
 * diff-clean.
 *
 * Deliberately NOT emitted, per the SEO contract:
 *   - `Review` / `AggregateRating` from the testimonials — self-published
 *     reviews about yourself violate Google's self-serving review policy and
 *     are a manual-action risk.
 *   - `WebSite.potentialAction` (sitelinks searchbox) — there is no site
 *     search; declaring one is a spam signal.
 *   - `Article` on the case studies — no honest publication date exists
 *     (`bnf.meta.year` is "2022 (TBC)"). `CreativeWork` needs none.
 */

import { SITE, absoluteUrl } from "./site.js";
import { PAGES, type PageSeo, type SitePath } from "./routes.js";

// =============================================================================
// Types
// =============================================================================

export type JsonLdValue =
	| string
	| number
	| boolean
	| null
	| readonly JsonLdValue[]
	| { readonly [key: string]: JsonLdValue };

export type JsonLdNode = { readonly "@type": string; readonly [key: string]: JsonLdValue };

/** A pointer to another node in the same graph. */
type JsonLdRef = { readonly "@id": string };

// =============================================================================
// Stable @id anchors
// =============================================================================

const HOME = absoluteUrl("/");

export const JSONLD_IDS = {
	person: `${HOME}#person`,
	personImage: `${HOME}#person-image`,
	employer: `${HOME}#employer`,
	school: `${HOME}#school`,
	website: `${HOME}#website`,
} as const;

function ref(id: string): JsonLdRef {
	return { "@id": id };
}

/** `@id` of the CreativeWork node belonging to a case-study route. */
export function creativeWorkId(path: SitePath): string {
	return `${absoluteUrl(path)}#work`;
}

// =============================================================================
// Identity nodes
// =============================================================================

/** The Person. Every other identity node hangs off this one. */
export function personNode(): JsonLdNode {
	return {
		"@type": "Person",
		"@id": JSONLD_IDS.person,
		name: SITE.person.name,
		givenName: SITE.person.givenName,
		familyName: SITE.person.familyName,
		url: HOME,
		jobTitle: SITE.person.jobTitle,
		description: SITE.person.description,
		// `email` is deliberately NOT emitted. No Google rich result consumes
		// Person.email, and the contact section only renders on the home page — so
		// emitting it here would publish a plaintext address in the prerendered HTML
		// of five pages that did not carry one, purely as harvestable surface.
		// The mailto: link on / remains the single, intentional exposure.
		image: ref(JSONLD_IDS.personImage),
		worksFor: ref(JSONLD_IDS.employer),
		alumniOf: ref(JSONLD_IDS.school),
		address: {
			"@type": "PostalAddress",
			addressLocality: SITE.person.address.locality,
			addressCountry: SITE.person.address.country,
		},
		knowsAbout: SITE.person.knowsAbout,
		knowsLanguage: SITE.person.knowsLanguage,
		sameAs: SITE.sameAs,
	};
}

/** The portrait referenced by `Person.image`. Dimensions are measured, not guessed. */
export function personImageNode(): JsonLdNode {
	const { url, width, height, alt } = SITE.person.image;
	const absolute = absoluteUrl(url);
	return {
		"@type": "ImageObject",
		"@id": JSONLD_IDS.personImage,
		url: absolute,
		contentUrl: absolute,
		width,
		height,
		caption: alt,
	};
}

/** The employer, with the parent group modelled properly rather than glued into `name`. */
export function employerNode(): JsonLdNode {
	return {
		"@type": "Organization",
		"@id": JSONLD_IDS.employer,
		name: SITE.employer.name,
		url: SITE.employer.url,
		parentOrganization: {
			"@type": "Organization",
			name: SITE.employer.parentName,
		},
	};
}

export function schoolNode(): JsonLdNode {
	return {
		"@type": "EducationalOrganization",
		"@id": JSONLD_IDS.school,
		name: SITE.school.name,
	};
}

/** Person + the three nodes its refs point at. Emitted on every page. */
export function identityNodes(): JsonLdNode[] {
	return [personNode(), personImageNode(), employerNode(), schoolNode()];
}

// =============================================================================
// Page-level nodes
// =============================================================================

/** The site itself. Home page only — one WebSite per site, ever. */
export function websiteNode(): JsonLdNode {
	return {
		"@type": "WebSite",
		"@id": JSONLD_IDS.website,
		url: HOME,
		name: SITE.siteName,
		description: PAGES["/"].description,
		inLanguage: SITE.lang,
		publisher: ref(JSONLD_IDS.person),
		copyrightHolder: ref(JSONLD_IDS.person),
	};
}

/**
 * Breadcrumb trail for a nested route: the ancestors declared in `PAGES`,
 * followed by the page itself. `/projects` never appears — no such route
 * exists, and Google penalises breadcrumb items whose `item` URL 404s.
 */
export function breadcrumbNode(path: SitePath, seo: PageSeo): JsonLdNode | null {
	const ancestors = seo.breadcrumb ?? [];
	if (ancestors.length === 0) return null;

	const trail: SitePath[] = [...ancestors, path];

	return {
		"@type": "BreadcrumbList",
		"@id": `${absoluteUrl(path)}#breadcrumb`,
		itemListElement: trail.map((entry, index) => ({
			"@type": "ListItem",
			position: index + 1,
			name: PAGES[entry].name,
			item: absoluteUrl(entry),
		})),
	};
}

/** A case study. `CreativeWork`, not `Article` — no publication date exists. */
export function creativeWorkNode(path: SitePath, seo: PageSeo): JsonLdNode | null {
	const work = seo.creativeWork;
	if (!work) return null;

	return {
		"@type": "CreativeWork",
		"@id": creativeWorkId(path),
		name: work.name,
		description: work.description,
		url: absoluteUrl(path),
		genre: work.genre,
		inLanguage: SITE.lang,
		author: ref(JSONLD_IDS.person),
		creator: ref(JSONLD_IDS.person),
		about: work.about.map((subject) => ({ "@type": "Thing", name: subject })),
		// A typed stub, not a bare `ref()`. The parent's full node lives in the
		// PARENT page's graph, so a bare @id dangles for any parser that evaluates
		// this page standalone — which is what the Rich Results Test, the Schema
		// Markup Validator and most third-party crawlers do. They resolve it to an
		// untyped stub and drop the relationship. Naming and typing it inline keeps
		// the edge readable alone, and the shared @id still merges the two nodes
		// for crawlers that see both pages.
		...(work.isPartOf
			? {
					isPartOf: {
						"@type": "CreativeWork",
						"@id": creativeWorkId(work.isPartOf),
						name: PAGES[work.isPartOf].creativeWork?.name ?? PAGES[work.isPartOf].title,
						url: absoluteUrl(work.isPartOf),
					},
				}
			: {}),
	};
}

// =============================================================================
// Graph assembly
// =============================================================================

/**
 * Build the `@graph` for a page.
 *
 * `path === null` means "pathname not in the route table" — the error page, or
 * a route added without registering it. It degrades to the identity nodes,
 * which are true regardless of which URL is being rendered, and never throws:
 * with `prerender.handleHttpError: 'warn'` a throw here would swallow the page
 * and still exit the build green.
 */
export function buildGraph(path: SitePath | null, seo: PageSeo): JsonLdNode[] {
	const nodes: JsonLdNode[] = [];

	for (const node of seo.jsonLd) {
		switch (node) {
			case "identity":
				nodes.push(...identityNodes());
				break;
			case "website":
				nodes.push(websiteNode());
				break;
			case "breadcrumbs": {
				const breadcrumbs = path ? breadcrumbNode(path, seo) : null;
				if (breadcrumbs) nodes.push(breadcrumbs);
				break;
			}
			case "creativeWork": {
				const work = path ? creativeWorkNode(path, seo) : null;
				if (work) nodes.push(work);
				break;
			}
		}
	}

	return nodes;
}

/**
 * Serialise a graph for inlining into `<script type="application/ld+json">`.
 *
 * Escaping `<` is the whole security story: JSON string values may contain `<`
 * verbatim, so an unescaped `</script>` inside any field would close the
 * element early and hand the rest of the payload to the HTML parser. The
 * JSON unicode escape for `<` (u003c, backslash-prefixed) parses back to `<`,
 * so consumers still see the original text. All current input is static — this is belt-and-braces for the
 * day someone feeds a CMS string through here.
 *
 * Returns `null` for an empty graph so the caller can skip the element entirely
 * rather than emit an empty script.
 */
export function serializeGraph(nodes: readonly JsonLdNode[]): string | null {
	if (nodes.length === 0) return null;
	const payload = { "@context": "https://schema.org", "@graph": nodes };
	return JSON.stringify(payload).replace(/</g, "\\u003c");
}
