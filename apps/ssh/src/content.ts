import siteContent from '../../main/content/site-content.json'

/**
 * Portfolio data, sourced from the single shared content file the web app
 * (apps/main) also renders from. That JSON is a flat map of dotted string keys
 * to either strings or string arrays. We read it through tiny throw-free
 * accessors so a renamed or missing key degrades to empty content instead of
 * crashing the SSH session, then assemble a typed, view-ready `portfolio`.
 */
const content = siteContent as Record<string, unknown>

/** Read a string value by dotted key. Missing / non-string → ''. */
export function c(key: string): string {
	const value = content[key]
	return typeof value === 'string' ? value : ''
}

/** Read a string-array value by dotted key. Missing / wrong type → []. */
export function cList(key: string): string[] {
	const value = content[key]
	if (!Array.isArray(value)) return []
	return value.filter((item): item is string => typeof item === 'string')
}

export interface PortfolioProject {
	/** Two-digit ordinal, e.g. "01". */
	index: string
	title: string
	description: string
	tags: string[]
}

export interface PortfolioLink {
	label: string
	href: string
}

export interface Portfolio {
	name: string
	role: string
	tagline: string
	/** One string per paragraph, already ordered for display. */
	about: string[]
	projects: PortfolioProject[]
	contact: PortfolioLink[]
	basedIn: string
	/** Connective phrase ("working at") — pairs with `company`. */
	workingAt: string
	company: string
}

function project(key: string): PortfolioProject {
	return {
		index: c(`home.projects.${key}.index`),
		title: c(`home.projects.${key}.title`),
		description: c(`home.projects.${key}.description`),
		tags: cList(`home.projects.${key}.tags`),
	}
}

function link(key: string): PortfolioLink {
	return {
		label: c(`home.contact.${key}.label`),
		href: c(`home.contact.${key}.href`),
	}
}

/**
 * The web "About" intro is stored as sentence fragments (so the page can style
 * individual spans). We stitch them back into one readable sentence here — the
 * terminal has no rich spans to justify the split.
 */
const aboutIntro =
	`${c('home.about.intro')} ${c('home.hero.ansys.label')} ` +
	`${c('home.about.company-part')} ${c('home.about.parent-company')}` +
	`${c('home.about.creative-foundation')} ${c('home.about.gobelins')}.`

export const portfolio: Portfolio = {
	name: c('home.hero.title'),
	role: c('home.hero.role'),
	tagline: c('home.hero.tagline'),
	about: [aboutIntro, c('home.about.paragraph-2'), c('home.about.paragraph-3')].filter(Boolean),
	projects: [project('fdp'), project('ansys'), project('personal')],
	contact: [link('email'), link('linkedin'), link('github')],
	basedIn: c('home.contact.based-in'),
	workingAt: c('home.hero.working-at'),
	company: c('home.hero.ansys.label'),
}
