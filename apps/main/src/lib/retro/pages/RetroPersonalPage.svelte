<script lang="ts">
	/**
	 * Retro-OS — /projects/personal.
	 *
	 * The whole page: case header, notched hero, one section window holding the six
	 * project cards, pager, footer. It takes NO props — every string is read from
	 * the content layer, so the route only has to place it inside the retro tree.
	 *
	 * The card table below is the page. It is data rather than six near-identical
	 * blocks of markup because the only thing that varies between the cards is
	 * which content keys they read and which colour they take, and a table makes
	 * a wrong accent/pale pairing visible at a glance. Order mirrors the standard
	 * page (`src/routes/projects/personal/+page.svelte`) 1:1.
	 *
	 * MISSING CONTENT (reported, not invented — see ProjectCard's status guard):
	 *   personal.card-fancyui.status  "Open source"  → pill stays hidden until it exists
	 *   personal.card-archive.status  "2023"         → same
	 *   the section window's own title key (spec: "PROJECTS"); it borrows the
	 *   breadcrumb's string in the meantime, see the SectionWindow below.
	 */
	import { c } from "$lib/content/index.js";
	import {
		CaseHeaderBar,
		NotchedFrame,
		HeroTitleBar,
		SectionWindow,
		PrevNextNav,
		RetroFooter,
		type Accent
	} from "$lib/retro/index.js";
	import ProjectCard from "../case/ProjectCard.svelte";

	interface CardSpec {
		/** content-key stem: `personal.card-<slug>` */
		slug: string;
		glyph: string;
		accent: Accent;
		bg: string;
		statusKey?: string;
		statusBg?: string;
		noteKey?: string;
		links?: { labelKey: string; hrefKey?: string; href?: string; variant?: "primary" | "outline" }[];
	}

	const CARDS: CardSpec[] = [
		{
			slug: "fancyui",
			glyph: "UI",
			accent: "green",
			bg: "var(--r-tint-green)",
			statusKey: "personal.card-fancyui.status",
			statusBg: "var(--r-avatar-3)",
			links: [
				{
					labelKey: "personal.card-fancyui.docs.label",
					hrefKey: "personal.card-fancyui.docs.href",
					variant: "primary"
				},
				{
					labelKey: "personal.card-fancyui.github.label",
					hrefKey: "personal.card-fancyui.github.href"
				}
			]
		},
		{
			slug: "hdr",
			glyph: "HDR",
			accent: "blue",
			bg: "var(--r-tint-blue)",
			links: [
				{
					labelKey: "personal.card-hdr.visit.label",
					hrefKey: "personal.card-hdr.visit.href",
					variant: "primary"
				},
				{ labelKey: "personal.card-hdr.github.label", hrefKey: "personal.card-hdr.github.href" }
			]
		},
		{
			slug: "portfolio-2025",
			glyph: "2K25",
			accent: "gold",
			bg: "var(--r-tint-gold)",
			noteKey: "personal.card-portfolio-2025.viewing-note",
			links: [
				{
					labelKey: "personal.card-portfolio-2025.github.label",
					hrefKey: "personal.card-portfolio-2025.github.href"
				}
			]
		},
		{
			slug: "blog",
			glyph: "BLG",
			accent: "rust",
			bg: "var(--r-tint-rust)",
			links: [
				{
					labelKey: "personal.card-blog.visit.label",
					hrefKey: "personal.card-blog.visit.href",
					variant: "primary"
				}
			]
		},
		{
			slug: "archive",
			glyph: "PDF",
			accent: "gold",
			bg: "var(--r-tint-gold)",
			statusKey: "personal.card-archive.status",
			statusBg: "var(--r-tint-gold)",
			// A static file in /static, not a content-owned URL — kept hardcoded
			// exactly as the standard page has it.
			links: [
				{
					labelKey: "personal.card-archive.view.label",
					href: "/rama-herbin-portfolio-2023.pdf",
					variant: "primary"
				}
			]
		},
		{
			slug: "experiments",
			glyph: "LAB",
			accent: "green",
			bg: "var(--r-tint-green)",
			statusKey: "personal.card-experiments.status",
			statusBg: "var(--r-btn)"
		}
	];
</script>

<!-- Rail and page padding per SPEC-CASES (28px 32px 64px, 1120px, column gap 26),
     with the horizontal padding clamped so the windows keep their 2px frame off
     the viewport edge on a phone. -->
<div
	class="flex min-h-screen flex-col items-center bg-[var(--r-canvas)] px-[clamp(14px,4vw,32px)] pt-7 pb-16 text-[var(--r-ink)]"
>
	<div class="flex w-full max-w-[1120px] flex-col gap-[26px]">
		<CaseHeaderBar
			accent="green"
			crumbs={[
				{ labelKey: "retro.breadcrumb.home", href: "/" },
				{ labelKey: "retro.breadcrumb.projects" },
				{ labelKey: "personal.hero.title" }
			]}
			backHref="/#retro-projects"
		/>

		<NotchedFrame>
			<HeroTitleBar
				chipKey="retro.personal.hero.chip"
				accent="green"
				tint="var(--r-tint-green)"
				kickerKey="retro.personal.hero.kicker"
				metaKey="retro.personal.hero.meta"
			/>

			<!-- The one centered hero of the three case pages: this page has no client,
			     no period and no logo to sit beside the title, so the title owns the
			     axis. -->
			<!-- Text kept flush against the tags: the edit runtime commits an element's
			     raw textContent, so indentation around the expression would be saved. -->
			<div class="flex flex-col items-center gap-4 px-9 py-[38px] text-center">
				<h1
					class="text-[clamp(2.25rem,8vw,58px)] leading-none font-black tracking-[-2px]"
					data-edit="personal.hero.title"
				>{c("personal.hero.title")}</h1>
				<p
					class="r-mono text-[13px] text-[var(--r-muted)]"
					data-edit="personal.hero.subtitle"
				>{c("personal.hero.subtitle")}</p>
			</div>
		</NotchedFrame>

		<!-- titleKey: the spec's "PROJECTS" has no key of its own yet, so the window
		     borrows the breadcrumb segment that already says exactly that. Editing
		     one therefore edits both until `retro.window.personal-projects.title`
		     exists — reported to the orchestrator. -->
		<SectionWindow
			id="retro-personal-projects"
			index="01"
			indexStyle="paren"
			titleKey="retro.breadcrumb.projects"
			dosKey="retro.window.personal-projects.dos"
			accent="green"
		>
			<div class="grid grid-cols-1 gap-5 px-6 pt-[22px] pb-[26px] md:grid-cols-2">
				{#each CARDS as card (card.slug)}
					<ProjectCard
						glyph={card.glyph}
						accent={card.accent}
						bg={card.bg}
						titleKey="personal.card-{card.slug}.title"
						descKey="personal.card-{card.slug}.description"
						tagsKey="personal.card-{card.slug}.tags"
						statusKey={card.statusKey}
						statusBg={card.statusBg}
						noteKey={card.noteKey}
						links={card.links}
					/>
				{/each}
			</div>
		</SectionWindow>

		<PrevNextNav
			prev={{
				kickerKey: "retro.personal.prev.eyebrow",
				titleKey: "fdp.hero.title",
				href: "/projects/fleur-de-papier"
			}}
			next={{
				kickerKey: "retro.personal.next.eyebrow",
				titleKey: "retro.personal.next.title",
				href: "/"
			}}
		/>

		<RetroFooter />
	</div>
</div>
