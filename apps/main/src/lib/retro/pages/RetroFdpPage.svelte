<script lang="ts">
	/**
	 * Retro-OS — Fleur de Papier case study (`/projects/fleur-de-papier`).
	 *
	 * The whole page, chrome included: the route renders this and nothing else of
	 * the retro tree. Structure is the same three-act case study the standard tree
	 * ships (context → productions → approach) reading the same `fdp.*` /
	 * `productions.*` keys, re-cut as a stack of windows on the cream canvas.
	 *
	 * WHY THE LIGHTBOX IS NOT HERE
	 * `openLightbox` is a prop because the VideoLightbox is a fancy-ui component and
	 * nothing under `lib/retro/` may import one (CONTRACTS §hard rules) — and
	 * because there must be exactly ONE lightbox per route, not one per skin tree.
	 * The route owns it and hands the opener down; ProductionRow calls it with the
	 * FROZEN record so the route already has the sources it needs.
	 *
	 * ANCHORS
	 * Cross-page links target the RETRO anchors (`/#retro-projects`): the skin
	 * persists across navigation, so landing on home means landing on the retro
	 * home, where the standard `#projects` id does not exist.
	 */
	import { c } from "$lib/content/index.js";
	import {
		productions,
		fdpHeroMeta,
		approach,
		type Production
	} from "$lib/portfolio/work/productions.js";
	import {
		CaseHeaderBar,
		NotchedFrame,
		HeroTitleBar,
		RetroMetaStrip,
		SectionWindow,
		LabeledTagRow,
		NumberedCard,
		PrevNextNav,
		LogoPlate,
		RetroFooter
	} from "../index.js";
	import ProductionRow from "../case/ProductionRow.svelte";

	interface Props {
		/** opens the ROUTE's single VideoLightbox on a production's demo */
		openLightbox: (p: Production) => void;
	}

	let { openLightbox }: Props = $props();

	/** Where "01 CONTEXT" sends the reader next — same slugs as the standard page. */
	const roleRows = [
		{ slug: "front-end-architecture", bg: "var(--r-tint-rust)" },
		{ slug: "interaction-animation", bg: "var(--r-tint-blue)" },
		{ slug: "kiosk-touch-table", bg: "var(--r-tint-green)" },
		{ slug: "flash-migrations", bg: "var(--r-tint-gold)" }
	];
</script>

<div class="r-page">
	<div class="r-rail">
		<CaseHeaderBar
			accent="rust"
			crumbs={[
				{ labelKey: "retro.breadcrumb.home", href: "/" },
				{ labelKey: "retro.breadcrumb.projects", href: "/#retro-projects" },
				{ labelKey: "fdp.hero.title" }
			]}
			backHref="/#retro-projects"
		/>

		<!-- ===== HERO ===== -->
		<NotchedFrame>
			<HeroTitleBar
				chipKey="retro.fdp.hero.chip"
				accent="rust"
				tint="var(--r-tint-rust)"
				kickerKey="retro.fdp.hero.kicker"
				metaKey="fdp.hero.eyebrow.period"
			/>

			<div class="r-fdp-hero grid gap-8 px-9 py-[34px]">
				<div class="flex flex-col gap-4">
					<h1
						class="text-[clamp(34px,7.5vw,58px)] leading-none font-black tracking-[-2px]"
						data-edit="fdp.hero.title"
					>
						{c("fdp.hero.title")}
					</h1>
					<!-- One sentence, three keys: the standard page splits it the same way so
					     the middle clause can carry emphasis without nesting an edit target. -->
					<p class="max-w-[640px] text-[15px] leading-[1.65] text-[var(--r-prose)]">
						<span data-edit="fdp.hero.intro.lead">{c("fdp.hero.intro.lead")}</span>
						<span class="font-bold text-[var(--r-ink)]" data-edit="fdp.hero.intro.highlight"
							>{c("fdp.hero.intro.highlight")}</span
						><span data-edit="fdp.hero.intro.body">{c("fdp.hero.intro.body")}</span>
					</p>
				</div>

				<div class="flex items-start lg:justify-end">
					<LogoPlate
						src="/portfolio/FleurdePapier.svg"
						alt="Fleur de Papier logo"
						class="w-full max-w-[300px]"
					/>
				</div>
			</div>

			<RetroMetaStrip items={fdpHeroMeta} cols={4} editNamespace="fdp" />
		</NotchedFrame>

		<!-- ===== (01) CONTEXT ===== -->
		<SectionWindow
			id="retro-fdp-context"
			index="01"
			indexStyle="paren"
			titleKey="fdp.section.context"
			dosKey="retro.window.fdp-context.dos"
			accent="rust"
		>
			<div class="grid gap-8 px-7 py-[26px] lg:grid-cols-2">
				<div class="flex flex-col gap-3">
					<h2 class="text-[20px] font-black" data-edit="fdp.context.mission.heading">
						{c("fdp.context.mission.heading")}
					</h2>
					<p class="text-[13.5px] leading-[1.6] text-[var(--r-prose)]" data-edit="fdp.context.mission.p1">
						{c("fdp.context.mission.p1")}
					</p>
					<p class="text-[13.5px] leading-[1.6] text-[var(--r-prose)]" data-edit="fdp.context.mission.p2">
						{c("fdp.context.mission.p2")}
					</p>
				</div>

				<div class="flex flex-col gap-3">
					<h2 class="text-[20px] font-black" data-edit="fdp.context.role.heading">
						{c("fdp.context.role.heading")}
					</h2>
					<p class="text-[13.5px] leading-[1.6] text-[var(--r-prose)]" data-edit="fdp.context.role.p1">
						{c("fdp.context.role.p1")}
					</p>
					<div class="flex flex-col gap-2.5">
						{#each roleRows as row (row.slug)}
							<LabeledTagRow
								labelKey={`fdp.role-rows.${row.slug}.label`}
								tagKey={`fdp.role-rows.${row.slug}.tag`}
								bg={row.bg}
							/>
						{/each}
					</div>
				</div>
			</div>
		</SectionWindow>

		<!-- ===== (02) SELECTED PRODUCTIONS ===== -->
		<SectionWindow
			id="retro-fdp-productions"
			index="02"
			indexStyle="paren"
			titleKey="fdp.section.productions"
			dosKey="retro.window.fdp-productions.dos"
			accent="gold"
			captionKey="fdp.selected-productions.intro"
		>
			<div class="flex flex-col gap-[22px] px-6 pt-5 pb-[26px]">
				{#each productions as p (p.slug)}
					<ProductionRow production={p} onOpen={openLightbox} />
				{/each}
			</div>
		</SectionWindow>

		<!-- ===== (03) APPROACH ===== -->
		<SectionWindow
			id="retro-fdp-approach"
			index="03"
			indexStyle="paren"
			titleKey="fdp.section.approach"
			dosKey="retro.window.fdp-approach.dos"
			accent="green"
		>
			<div class="grid gap-[18px] px-6 pt-[22px] pb-[26px] md:grid-cols-2 lg:grid-cols-3">
				{#each approach as item (item.index)}
					<NumberedCard
						index={item.index}
						titleKey={`fdp.approach.${item.index}.title`}
						descKey={`fdp.approach.${item.index}.desc`}
					/>
				{/each}
			</div>
		</SectionWindow>

		<PrevNextNav
			prev={{
				kickerKey: "fdp.prev-next.prev.eyebrow",
				titleKey: "fdp.prev-next.prev.title",
				href: "/"
			}}
			next={{
				kickerKey: "fdp.prev-next.next.eyebrow",
				titleKey: "personal.hero.title",
				href: "/projects/personal"
			}}
		/>

		<RetroFooter variant="case" />
	</div>
</div>

<style>
	/* Page shell + rail, identical on all three case pages (SPEC-CASES §Shared
	   chrome). The horizontal padding is the only thing that gives on a phone —
	   the 2px rules and hard shadows never scale. */
	.r-page {
		min-height: 100vh;
		box-sizing: border-box;
		padding: 28px 32px 64px;
	}

	@media (max-width: 639px) {
		.r-page {
			padding: 20px 16px 48px;
		}
	}

	.r-rail {
		display: flex;
		max-width: 1120px;
		margin: 0 auto;
		flex-direction: column;
		gap: 26px;
	}

	/* The logo plate is a fixed 300px column beside the title, and a band under it
	   once the two would fight for width. */
	@media (min-width: 1024px) {
		.r-fdp-hero {
			grid-template-columns: minmax(0, 1fr) 300px;
		}
	}
</style>
