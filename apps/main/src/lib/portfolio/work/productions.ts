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
		title: "BnF Richelieu",
		subtitle: "Bibliothèque nationale de France",
		client: "Bibliothèque nationale de France",
		description:
			"An interactive digital experience for the Richelieu site of the Bibliothèque nationale de France. Visitors explore grouped collection items — including ancient coins — by touch, zoom into individual works for a closer look, and are welcomed by a multi-language idle attract screen (DÉBUT · START · INICIO).",
		role: "Creative development & front-end — interactions, animations and integration",
		tags: ["Touch UI", "Zoom", "Multi-language"],
		featured: true,
		layout: "full",
		video: video("bnf-richelieu", "00:29", "BNF-RICHELIEU_DEMO"),
		detailHref: "/projects/fleur-de-papier/bnf-richelieu"
	},
	{
		slug: "la-contemporaine",
		index: "02",
		title: "La Contemporaine",
		subtitle: "Museum & library of contemporary history",
		description:
			"A web cultural-mediation experience for La Contemporaine — an editorial, document-driven journey through exile testimonies and the Chilean dictatorship, built around the question “À partir de quels documents s’écrit l’histoire ?”.",
		role: "Front-end & interactive development — content integration and accessibility",
		tags: ["Editorial web", "Interactive", "Accessibility"],
		featured: true,
		layout: "split-left",
		video: video("la-contemporaine", "00:16", "LA-CONTEMPORAINE_DEMO")
	},
	{
		slug: "terre-adelice",
		index: "03",
		title: "Terre Adélice",
		subtitle: "Interactive comic",
		description:
			"An interactive comic combining illustration, narration and web interactions — the story of an artisanal ice-cream maker rooted in the Eyrieux valley, in the Ardèche.",
		role: "Creative development — graphic integration, interactions and narrative progression",
		tags: ["Interactive comic", "Illustration", "Animation"],
		featured: true,
		layout: "split-right",
		video: video("terre-adelice", "00:51", "TERRE-ADELICE_BD")
	},
	{
		slug: "atrium-de-rouen",
		index: "04",
		title: "L'Atrium de Rouen",
		subtitle: "Cultural & scientific mediation",
		description:
			"An interactive mediation app for L'Atrium de Rouen, in a cultural and scientific context — front-end development, interactive integration and animation.",
		role: "Front-end development & interactive integration",
		tags: ["Interactive", "Mediation"],
		featured: false,
		layout: "duo",
		tbc: true
	},
	{
		slug: "la-contemporaine-touch",
		index: "05",
		title: "La Contemporaine — Touch tables",
		subtitle: "In-gallery touch exploration",
		description:
			"In-gallery touch exploration of the museum collections. Visitors browse grouped artworks — WWI-era prints and drawings — and zoom into individual works in detail on large touch screens.",
		role: "Front-end & interactive development",
		tags: ["Touch tables", "Zoom", "In-gallery"],
		featured: false,
		layout: "duo",
		video: video("la-contemporaine-touch", "00:23", "LA-CONTEMPORAINE-TOUCH_DEMO")
	},
	{
		slug: "auberge-des-dauphins",
		index: "06",
		title: "Auberge des Dauphins",
		subtitle: "Forêt de Saou — heritage site",
		description:
			"A digital experience for the heritage site of the Auberge des Dauphins, in the heart of the Saou forest — an interactive mediation interface connecting cultural content, storytelling and visual experience.",
		role: "Front-end development",
		tags: ["Mediation", "Heritage"],
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
	{ label: "ROLE", value: "Creative Developer" },
	{ label: "PERIOD", value: "2020 — 2023" },
	{ label: "STACK", value: "Vue · Nuxt · GSAP" },
	{ label: "OUTPUT", value: "6 productions · 5 institutions" }
];

/** BnF Richelieu detail-page hero meta strip. STACK stays TBC (not verified per-project). */
export const bnfMeta: MetaItem[] = [
	{ label: "CLIENT", value: "Bibliothèque nationale de France" },
	{ label: "YEAR", value: "2022 (TBC)" },
	{ label: "ROLE", value: "Creative dev · front-end" },
	{ label: "STACK", value: "TBC" },
	{ label: "FORMAT", value: "Large-format touch screens" }
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
		title: "Creative development",
		desc: "Custom interaction models and canvas work where they serve the story — never as decoration."
	},
	{
		index: "02",
		title: "Accessibility",
		desc: "Public installations must work for everyone: children, seniors and first-time visitors alike."
	},
	{
		index: "03",
		title: "Performance",
		desc: "Smooth motion on modest kiosk hardware and fast loads on gallery networks — performance is part of the design."
	},
	{
		index: "04",
		title: "Animation & motion",
		desc: "Motion as narration: GSAP timelines and scroll choreography that guide attention rather than distract."
	},
	{
		index: "05",
		title: "Interactive storytelling",
		desc: "Editorial structures that turn collections and archives into narratives visitors want to follow."
	},
	{
		index: "06",
		title: "Flash → modern web",
		desc: "Migrating legacy Flash / ActionScript 3 experiences to standards-based JavaScript and Vue.js."
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
