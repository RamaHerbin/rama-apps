/**
 * Site identity — the canonical, immutable facts about rama.app.
 *
 * Pure constants: no runes, no DOM, no `$app/*` imports. Everything here is
 * safe to read at module scope during prerender, in a Vercel node function, or
 * from a plain `tsx` script (the sitemap endpoint and the icon generator both
 * import it).
 *
 * Why absolute URLs matter: `kit.prerender.origin` defaults to
 * `http://sveltekit-prerender`, so `page.url.origin` / `page.url.href` are
 * poisoned at build time. Facebook, LinkedIn, Slack and X also refuse to
 * resolve relative `og:image` / `og:url` values. Every outward-facing URL must
 * therefore be built from `SITE.origin` via `absoluteUrl()` — never from the
 * request URL.
 */

// =============================================================================
// Types
// =============================================================================

/** A social-card image descriptor. `url` is root-relative; absolutise on use. */
export interface OgImage {
	/** Root-relative path, e.g. `/og-image.png`. */
	readonly url: string;
	readonly width: number;
	readonly height: number;
	/** MIME type, e.g. `image/png`. */
	readonly type: string;
	/** Human alt text — read aloud by screen readers on LinkedIn/Slack unfurls. */
	readonly alt: string;
}

export interface PostalIdentity {
	readonly locality: string;
	/** ISO 3166-1 alpha-2. */
	readonly country: string;
}

export interface PersonIdentity {
	readonly name: string;
	readonly givenName: string;
	readonly familyName: string;
	readonly jobTitle: string;
	/** One-sentence factual bio used as `Person.description` in JSON-LD. */
	readonly description: string;
	/** Portrait already shipped in `static/` — real, measured dimensions. */
	readonly image: OgImage;
	readonly address: PostalIdentity;
	/** Topics the person is credibly associated with (entity disambiguation). */
	readonly knowsAbout: readonly string[];
	/** BCP-47 language tags. */
	readonly knowsLanguage: readonly string[];
}

export interface EmployerIdentity {
	/** Schema.org `name` of the immediate employer. */
	readonly name: string;
	/** Parent company, emitted as `parentOrganization`. */
	readonly parentName: string;
	/** Prose form used in copy: "Ansys, part of Synopsys Inc." */
	readonly displayName: string;
	readonly url: string;
}

export interface SchoolIdentity {
	readonly name: string;
}

export interface SiteIdentity {
	/** Absolute origin, no trailing slash. */
	readonly origin: string;
	readonly siteName: string;
	/** `<html lang>` value. */
	readonly lang: string;
	/** Open Graph locale (underscore form). */
	readonly locale: string;
	readonly person: PersonIdentity;
	readonly employer: EmployerIdentity;
	readonly school: SchoolIdentity;
	/** Profiles that corroborate the same identity, for `sameAs`. */
	readonly sameAs: readonly string[];
	/** Default social card, used by every route unless it overrides it. */
	readonly ogImage: OgImage;
}

// =============================================================================
// The identity
// =============================================================================

export const SITE = {
	origin: "https://rama.app",
	siteName: "Rama Herbin",
	lang: "en",
	locale: "en_US",

	person: {
		name: "Rama Herbin",
		givenName: "Rama",
		familyName: "Herbin",
		jobTitle: "Front-End & UI Engineer",
		// No `email` here on purpose — see the note in jsonld.ts personNode(). The
		// address lives in content/site-content.json ("home.contact.email.href") and
		// is exposed once, as the mailto: link on the home page.
		description:
			"Front-End & UI Engineer at Ansys (part of Synopsys Inc.), building safety-critical interfaces for Ansys Digital Safety Manager from Lyon, France. Previously creative developer at Fleur de Papier, on cultural installations and web experiences.",
		// 778 x 571 — measured on static/portfolio/profile-rama.jpg, not guessed.
		image: {
			url: "/portfolio/profile-rama.jpg",
			width: 778,
			height: 571,
			type: "image/jpeg",
			alt: "Portrait of Rama Herbin",
		},
		address: {
			locality: "Lyon",
			country: "FR",
		},
		knowsAbout: [
			"Front-end engineering",
			"UI engineering",
			"Design systems",
			"Svelte",
			"TypeScript",
			"Angular",
			"Web performance",
			"Interaction design",
			"Creative coding",
			"Photography",
		],
		knowsLanguage: ["fr", "en"],
	},

	employer: {
		name: "Ansys",
		parentName: "Synopsys Inc.",
		displayName: "Ansys, part of Synopsys Inc.",
		url: "https://www.ansys.com",
	},

	// No `url` on purpose: the school's canonical domain is not part of the
	// verified identity contract, and a dead link in structured data is worse
	// than an absent one. `EducationalOrganization` is valid with a name alone.
	school: {
		name: "Gobelins Paris, l'École de l'Image",
	},

	sameAs: [
		"https://github.com/RamaHerbin",
		"https://www.linkedin.com/in/rama-herbin/",
		"https://photo.rama.app",
		"https://blog.rama.app",
		"https://fancy-ui.rama.app",
	],

	ogImage: {
		url: "/og-image.png",
		width: 1200,
		height: 630,
		type: "image/png",
		alt: "Rama Herbin — Front-End & UI Engineer",
	},
} as const satisfies SiteIdentity;

// =============================================================================
// URL helpers
// =============================================================================

/**
 * Normalise an in-site pathname: force a leading slash, collapse duplicate
 * slashes, and drop the trailing slash on everything but the root.
 *
 * `kit.trailingSlash` is at its default (`'never'`), so `/photo` and `/photo/`
 * must never produce two different canonicals.
 */
export function normalisePath(pathname: string): string {
	const withLeadingSlash = pathname.startsWith("/") ? pathname : `/${pathname}`;
	const collapsed = withLeadingSlash.replace(/\/{2,}/g, "/");
	return collapsed.length > 1 ? collapsed.replace(/\/+$/, "") : "/";
}

/**
 * Join `SITE.origin` with a root-relative path.
 *
 * Inputs carrying an explicit scheme (`https://…`, `data:…`) pass through
 * untouched, so a route can point `og:image` at an external CDN later without
 * special-casing.
 *
 * Protocol-relative input deliberately does NOT pass through: a request for
 * `https://rama.app//evil.com/x` arrives as pathname `//evil.com/x`, and
 * echoing that into `<link rel="canonical">` would hand the canonical to
 * another host. It is collapsed to a normal path instead.
 *
 *   absoluteUrl("/")            → "https://rama.app/"
 *   absoluteUrl("photo")        → "https://rama.app/photo"
 *   absoluteUrl("/photo/")      → "https://rama.app/photo"
 *   absoluteUrl("//evil.com/x") → "https://rama.app/evil.com/x"
 */
export function absoluteUrl(path: string): string {
	if (/^[a-z][a-z0-9+.-]*:/i.test(path)) return path;
	return `${SITE.origin}${normalisePath(path)}`;
}
