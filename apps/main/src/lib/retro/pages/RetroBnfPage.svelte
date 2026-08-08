<script lang="ts">
	/**
	 * BnF Richelieu — the Retro-OS rendering of the production detail page.
	 *
	 * A page in this tree is a STACK: header bar, notched hero, then one section
	 * window per block, pager, footer — 26px apart on the 1120px rail. It owns no
	 * design of its own; every slab below is a primitive from `$lib/retro` and this
	 * file only decides the order, the accents and which content key feeds what.
	 *
	 * WHAT IT DELIBERATELY DOES NOT OWN
	 * The lightbox. `openLightbox` arrives as a prop because the ROUTE mounts the
	 * single `VideoLightbox` instance shared with the standard tree — both trees are
	 * in the DOM at once (see src/routes/retro.css), so a lightbox per page would
	 * mean two of them, and the retro copy would have to re-implement playback,
	 * focus trapping and the `claimPlayback` handshake that already exist.
	 *
	 * CONTENT PARITY WITH THE STANDARD PAGE
	 * Every string comes from the same `bnf.*` / `productions.bnf-richelieu.*` keys
	 * the standard page reads, and the meta strip re-reads `bnf.meta.*` through the
	 * FROZEN `bnfMeta` schema. The two designs therefore cannot drift: an edit in
	 * either tree is the same key.
	 */
	import { c } from "$lib/content/index.js";
	import {
		CaseHeaderBar,
		DefinitionRow,
		FigurePlate,
		HeroTitleBar,
		InlineIndexLabel,
		NotchedFrame,
		PrevNextNav,
		RetroFooter,
		RetroMetaStrip,
		SectionWindow,
		VideoFrame
	} from "$lib/retro/index.js";
	import { bnfMeta, productions } from "$lib/portfolio/work/productions.js";
	import type { Production } from "$lib/portfolio/work/productions.js";

	interface Props {
		/** opens the route-owned VideoLightbox on a production */
		openLightbox: (production: Production) => void;
	}

	let { openLightbox }: Props = $props();

	// `productions` is a frozen data contract — bnf-richelieu is always index 0,
	// but look it up by slug so this page doesn't silently break if the order
	// changes (same lookup the standard page does, for the same reason).
	const production = productions.find((p) => p.slug === "bnf-richelieu")!;
	const video = production.video!;

	const FIG_BASE = "/videos/fleur-de-papier";
</script>

<div class="min-h-screen px-4 pt-7 pb-16 text-[var(--r-ink)] sm:px-8">
	<div class="mx-auto flex w-full max-w-[1120px] flex-col gap-[26px]">
		<!-- Three levels, because this page hangs off a case study rather than off
		     home: the middle crumb is a live link back to Fleur de Papier. -->
		<CaseHeaderBar
			accent="blue"
			crumbs={[
				{ labelKey: "retro.breadcrumb.home", href: "/" },
				{ labelKey: "bnf.hero.eyebrow.breadcrumb-label", href: "/projects/fleur-de-papier" },
				{ labelKey: "productions.bnf-richelieu.title" }
			]}
			backHref="/projects/fleur-de-papier"
		/>

		<!-- ============ HERO ============ -->
		<NotchedFrame>
			<HeroTitleBar
				chipKey="retro.bnf.hero.chip"
				accent="blue"
				tint="var(--r-tint-blue)"
				kickerKey="retro.bnf.hero.kicker"
				metaKey="bnf.hero.eyebrow.period"
			/>

			<div class="flex flex-col gap-5 px-6 py-7 sm:px-9 sm:py-[34px]">
				<!-- Text kept flush against the tags throughout this file: the edit
				     runtime commits an element's raw textContent, so indentation
				     around the expression would be saved into the JSON. -->
				<h1
					class="text-[clamp(34px,7vw,58px)] leading-none font-black tracking-[-0.035em]"
					data-edit="productions.bnf-richelieu.title"
				>{c("productions.bnf-richelieu.title")}</h1>
				<p
					class="max-w-[820px] text-[15px] leading-[1.65] text-[var(--r-prose)]"
					data-edit="productions.bnf-richelieu.description"
				>{c("productions.bnf-richelieu.description")}</p>
			</div>

			<!-- Inside the frame, not under it: the strip is the hero's own footer
			     row and its top rule is the seam. -->
			<RetroMetaStrip items={bnfMeta} cols={5} editNamespace="bnf" />
		</NotchedFrame>

		<!-- ============ FULL DEMO ============ -->
		<VideoFrame
			poster={video.poster}
			fileLabel="{video.fileLabel}.MP4"
			duration={video.durationLabel}
			size="lg"
			badgeKey="bnf.hero.video-chip"
			alt="{production.title}, video poster"
			onOpen={() => openLightbox(production)}
		/>

		<!-- ============ BRIEF / BUILT ============ -->
		<!-- The one window with no index chip: it carries TWO numbered blocks, so
		     the ordinals move inline into the body as InlineIndexLabels. -->
		<SectionWindow
			id="retro-bnf-brief"
			titleKey="bnf.section.brief"
			dosKey="retro.window.bnf-brief.dos"
			accent="blue"
		>
			<div class="grid gap-8 px-7 py-[26px] md:grid-cols-2">
				<div class="flex flex-col gap-3.5">
					<InlineIndexLabel index="01" labelKey="bnf.section.brief" />
					<p
						class="text-[13.5px] leading-[1.6] text-[var(--r-prose)]"
						data-edit="bnf.brief.p1"
					>{c("bnf.brief.p1")}</p>
					<p
						class="text-[13.5px] leading-[1.6] text-[var(--r-prose)]"
						data-edit="bnf.brief.p2"
					>{c("bnf.brief.p2")}</p>
				</div>
				<div class="flex flex-col gap-3.5">
					<InlineIndexLabel index="02" labelKey="bnf.section.built" />
					<p
						class="text-[13.5px] leading-[1.6] text-[var(--r-prose)]"
						data-edit="bnf.built.p1"
					>{c("bnf.built.p1")}</p>
					<p
						class="text-[13.5px] leading-[1.6] text-[var(--r-prose)]"
						data-edit="bnf.built.p2"
					>{c("bnf.built.p2")}</p>
				</div>
			</div>
		</SectionWindow>

		<!-- ============ IN DETAIL ============ -->
		<SectionWindow
			id="retro-bnf-detail"
			index="03"
			indexStyle="paren"
			titleKey="bnf.section.detail"
			dosKey="retro.window.bnf-detail.dos"
			accent="gold"
		>
			<div class="flex flex-col gap-6 p-6 pb-7">
				<!-- Row 1: the touch figure against the two reading notes. -->
				<div class="grid items-center gap-6 md:grid-cols-2">
					<FigurePlate
						src="{FIG_BASE}/bnf-richelieu-fig-a.jpg"
						alt="Screen capture: cleaning the coins with a fingertip"
						captionKey="bnf.detail.fig-a.label"
						chipKey="bnf.detail.fig-a.tag"
						chipBg="var(--r-tint-blue)"
					/>
					<div class="flex flex-col gap-[18px]">
						<div class="flex flex-col gap-2">
							<h3
								class="text-[20px] leading-tight font-black tracking-[-0.02em]"
								data-edit="bnf.detail.note-1.title"
							>{c("bnf.detail.note-1.title")}</h3>
							<p
								class="text-[13.5px] leading-[1.6] text-[var(--r-prose)]"
								data-edit="bnf.detail.note-1.desc"
							>{c("bnf.detail.note-1.desc")}</p>
						</div>
						<div class="flex flex-col gap-2">
							<h3
								class="text-[20px] leading-tight font-black tracking-[-0.02em]"
								data-edit="bnf.detail.note-2.title"
							>{c("bnf.detail.note-2.title")}</h3>
							<p
								class="text-[13.5px] leading-[1.6] text-[var(--r-prose)]"
								data-edit="bnf.detail.note-2.desc"
							>{c("bnf.detail.note-2.desc")}</p>
						</div>
					</div>
				</div>

				<!-- Row 2: the remaining two figures, side by side. -->
				<div class="grid gap-6 md:grid-cols-2">
					<FigurePlate
						src="{FIG_BASE}/bnf-richelieu-fig-b.jpg"
						alt="Screen capture: illustrated narrative of Joseph Pellerin's coin inventory"
						captionKey="bnf.detail.fig-b.label"
						chipKey="bnf.detail.fig-b.tag"
						chipBg="var(--r-tint-rust)"
					/>
					<FigurePlate
						src="{FIG_BASE}/bnf-richelieu-fig-c.jpg"
						alt="Screen capture: the 169 BCE coin-hoard opening scene with the DÉBUT / START / INICIO language bar"
						captionKey="bnf.detail.fig-c.label"
						chipKey="bnf.detail.fig-c.tag"
						chipBg="var(--r-tint-green)"
					/>
				</div>
			</div>
		</SectionWindow>

		<!-- ============ ENGINEERING NOTES ============ -->
		<SectionWindow
			id="retro-bnf-notes"
			index="04"
			indexStyle="paren"
			titleKey="bnf.section.notes"
			dosKey="retro.window.bnf-notes.dos"
			accent="green"
			captionKey="bnf.engineering.intro"
		>
			<!-- Four tinted rows, one per axis. The tints run blue → green → gold →
			     rust so the block reads as a set rather than as the section accent
			     repeated four times. -->
			<div class="flex flex-col gap-2.5 px-6 pt-[18px] pb-[26px]">
				<DefinitionRow
					labelKey="bnf.engineering.interaction.label"
					descKey="bnf.engineering.interaction.desc"
					bg="var(--r-tint-blue)"
				/>
				<DefinitionRow
					labelKey="bnf.engineering.languages.label"
					descKey="bnf.engineering.languages.desc"
					bg="var(--r-tint-green)"
				/>
				<DefinitionRow
					labelKey="bnf.engineering.experience.label"
					descKey="bnf.engineering.experience.desc"
					bg="var(--r-tint-gold)"
				/>
				<DefinitionRow
					labelKey="bnf.engineering.stack.label"
					descKey="bnf.engineering.stack.desc"
					bg="var(--r-tint-rust)"
				/>
			</div>
		</SectionWindow>

		<!-- ============ PREV / NEXT ============ -->
		<!-- Forward target is the retro tree's own anchor: the standard page's
		     #production-02 id belongs to the other subtree, which is display:none
		     while this one is visible. -->
		<PrevNextNav
			prev={{
				kickerKey: "bnf.prev-next.prev.eyebrow",
				titleKey: "bnf.prev-next.prev.title",
				href: "/projects/fleur-de-papier"
			}}
			next={{
				kickerKey: "bnf.prev-next.next.eyebrow",
				titleKey: "productions.la-contemporaine.title",
				href: "/projects/fleur-de-papier#retro-production-02"
			}}
		/>

		<RetroFooter variant="case" />
	</div>
</div>
