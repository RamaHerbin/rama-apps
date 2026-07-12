/**
 * Fleur de Papier — productions data (FROZEN CONTENT CONTRACT).
 *
 * Factual, safe content only. Video demos live under
 *   /videos/fleur-de-papier/<slug>.webm | .mp4
 *   /videos/fleur-de-papier/<slug>-poster.jpg
 * (files are added by the ingest phase; paths are stable regardless).
 *
 * Slots without a video (04, 06) are rendered as placeholder frames with a
 * "DEMO IN PREPARATION" chip. Their `tbc: true` also flags unverified specifics.
 */

import { c, cList } from "$lib/content/index.js";

export type ProductionIndex = "01" | "02" | "03" | "04" | "05" | "06";

export type ProductionLayout = "full" | "split-left" | "split-right" | "duo" | "slim";

export interface ProductionVideo {
	/** Path to the WebM source, e.g. /videos/fleur-de-papier/bnf-richelieu.webm */
	webm: string;
	/** Path to the MP4 fallback source */
	mp4: string;
	/** Poster still shown before playback */
	poster: string;
	/** Real clip length, e.g. "01:31" */
	durationLabel: string;
	/** Caption-strip file label, e.g. "BNF-RICHELIEU_DEMO" */
	fileLabel: string;
}

export interface Production {
	slug: string;
	index: ProductionIndex;
	title: string;
	subtitle?: string;
	client?: string;
	description: string;
	role: string;
	tags: string[];
	featured: boolean;
	layout: ProductionLayout;
	video?: ProductionVideo;
	/** true when specifics (institution / stack / year) are still to be confirmed */
	tbc?: boolean;
	/** internal link to a dedicated detail page, if one exists */
	detailHref?: string;
}

const VIDEO_BASE = "/videos/fleur-de-papier";

function video(slug: string, durationLabel: string, fileLabel: string): ProductionVideo {
	return {
		webm: `${VIDEO_BASE}/${slug}.webm`,
		mp4: `${VIDEO_BASE}/${slug}.mp4`,
		poster: `${VIDEO_BASE}/${slug}-poster.jpg`,
		durationLabel,
		fileLabel
	};
}

export const productions: Production[] = [
	{
		slug: "bnf-richelieu",
		index: "01",
		title: c("productions.bnf-richelieu.title"),
		subtitle: c("productions.bnf-richelieu.subtitle"),
		client: c("productions.bnf-richelieu.client"),
		description: c("productions.bnf-richelieu.description"),
		role: c("productions.bnf-richelieu.role"),
		tags: cList("productions.bnf-richelieu.tags"),
		featured: true,
		layout: "full",
		video: video("bnf-richelieu", "00:29", "BNF-RICHELIEU_DEMO"),
		detailHref: "/projects/fleur-de-papier/bnf-richelieu"
	},
	{
		slug: "la-contemporaine",
		index: "02",
		title: c("productions.la-contemporaine.title"),
		subtitle: c("productions.la-contemporaine.subtitle"),
		description: c("productions.la-contemporaine.description"),
		role: c("productions.la-contemporaine.role"),
		tags: cList("productions.la-contemporaine.tags"),
		featured: true,
		layout: "split-left",
		video: video("la-contemporaine", "00:16", "LA-CONTEMPORAINE_DEMO")
	},
	{
		slug: "terre-adelice",
		index: "03",
		title: c("productions.terre-adelice.title"),
		subtitle: c("productions.terre-adelice.subtitle"),
		description: c("productions.terre-adelice.description"),
		role: c("productions.terre-adelice.role"),
		tags: cList("productions.terre-adelice.tags"),
		featured: true,
		layout: "split-right",
		video: video("terre-adelice", "00:51", "TERRE-ADELICE_BD")
	},
	{
		slug: "atrium-de-rouen",
		index: "04",
		title: c("productions.atrium-de-rouen.title"),
		subtitle: c("productions.atrium-de-rouen.subtitle"),
		description: c("productions.atrium-de-rouen.description"),
		role: c("productions.atrium-de-rouen.role"),
		tags: cList("productions.atrium-de-rouen.tags"),
		featured: false,
		layout: "duo",
		tbc: true
	},
	{
		slug: "la-contemporaine-touch",
		index: "05",
		title: c("productions.la-contemporaine-touch.title"),
		subtitle: c("productions.la-contemporaine-touch.subtitle"),
		description: c("productions.la-contemporaine-touch.description"),
		role: c("productions.la-contemporaine-touch.role"),
		tags: cList("productions.la-contemporaine-touch.tags"),
		featured: false,
		layout: "duo",
		video: video("la-contemporaine-touch", "00:23", "LA-CONTEMPORAINE-TOUCH_DEMO")
	},
	{
		slug: "auberge-des-dauphins",
		index: "06",
		title: c("productions.auberge-des-dauphins.title"),
		subtitle: c("productions.auberge-des-dauphins.subtitle"),
		description: c("productions.auberge-des-dauphins.description"),
		role: c("productions.auberge-des-dauphins.role"),
		tags: cList("productions.auberge-des-dauphins.tags"),
		featured: false,
		layout: "slim",
		tbc: true
	}
];

export interface MetaItem {
	label: string;
	value: string;
}

/** Fleur de Papier case-study hero meta strip (safe, user-provided values). */
export const fdpHeroMeta: MetaItem[] = [
	{ label: "ROLE", value: c("fdp.meta.role") },
	{ label: "PERIOD", value: c("fdp.meta.period") },
	{ label: "STACK", value: c("fdp.meta.stack") },
	{ label: "OUTPUT", value: c("fdp.meta.output") }
];

/** BnF Richelieu detail-page hero meta strip. STACK stays TBC (not verified per-project). */
export const bnfMeta: MetaItem[] = [
	{ label: "CLIENT", value: c("bnf.meta.client") },
	{ label: "YEAR", value: c("bnf.meta.year") },
	{ label: "ROLE", value: c("bnf.meta.role") },
	{ label: "STACK", value: c("bnf.meta.stack") },
	{ label: "FORMAT", value: c("bnf.meta.format") }
];

export interface ApproachItem {
	index: string;
	title: string;
	desc: string;
}

/**
 * "Approach" list for the case study. Safe, generic descriptions of how the
 * work was done across productions — including the Flash → modern web migration
 * that the agency-wide role covered.
 */
export const approach: ApproachItem[] = [
	{
		index: "01",
		title: c("fdp.approach.01.title"),
		desc: c("fdp.approach.01.desc")
	},
	{
		index: "02",
		title: c("fdp.approach.02.title"),
		desc: c("fdp.approach.02.desc")
	},
	{
		index: "03",
		title: c("fdp.approach.03.title"),
		desc: c("fdp.approach.03.desc")
	},
	{
		index: "04",
		title: c("fdp.approach.04.title"),
		desc: c("fdp.approach.04.desc")
	},
	{
		index: "05",
		title: c("fdp.approach.05.title"),
		desc: c("fdp.approach.05.desc")
	},
	{
		index: "06",
		title: c("fdp.approach.06.title"),
		desc: c("fdp.approach.06.desc")
	}
];

/** Agency-wide stack (NOT per-project) — for a technologies list on the case study. */
export const agencyStack: string[] = [
	"JavaScript",
	"Vue.js",
	"Nuxt.js",
	"Three.js",
	"WebGL",
	"GSAP",
	"Node.js",
	"ActionScript 3",
	"jQuery",
	"PHP"
];
