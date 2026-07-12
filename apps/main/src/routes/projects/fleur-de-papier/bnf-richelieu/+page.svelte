<script lang="ts">
	import { NavAnchor, Footer } from "$lib/portfolio/index.js";
	import { c } from "$lib/content/index.js";
	import {
		FilmGrain,
		ContextBar,
		SectionLabel,
		MetaStrip,
		MediaFrame,
		VideoLightbox,
		PrevNext,
		productions,
		bnfMeta
	} from "$lib/portfolio/work/index.js";

	// `productions` is a frozen data contract — bnf-richelieu is always index 0,
	// but look it up by slug so this page doesn't silently break if the order changes.
	const production = productions.find((p) => p.slug === "bnf-richelieu")!;
	const video = production.video!;

	let lightboxOpen = $state(false);

	const FIG_BASE = "/videos/fleur-de-papier";
</script>

{#snippet figure(src: string, alt: string, labelKey: string, tagKey: string)}
	<div class="border-border/60 bg-surface-raised overflow-hidden rounded-[14px] border">
		<div class="relative aspect-[16/10]">
			<img {src} {alt} loading="lazy" class="absolute inset-0 h-full w-full object-cover" />
		</div>
		<div
			class="border-border/50 text-muted-foreground flex justify-between border-t px-5 py-3.5 font-mono text-[10px] tracking-[0.12em]"
		>
			<span data-edit={labelKey}>{c(labelKey)}</span>
			<span class="text-accent-work" data-edit={tagKey}>{c(tagKey)}</span>
		</div>
	</div>
{/snippet}

<svelte:head>
	<title>BnF Richelieu — Fleur de Papier — Rama Herbin</title>
	<meta
		name="description"
		content="An interactive digital experience for the Richelieu site of the Bibliothèque nationale de France — collection highlights explorable by touch."
	/>
</svelte:head>

<div class="relative min-h-screen overflow-x-clip">
	<FilmGrain />
	<NavAnchor />
	<ContextBar
		prev={{ href: "/projects/fleur-de-papier", labelKey: "bnf.context-bar.prev-label" }}
		centerKey="bnf.context-bar.center"
		next={{
			href: "/projects/fleur-de-papier#production-02",
			labelKey: "bnf.context-bar.next-label"
		}}
	/>

	<!-- ============ HERO ============ -->
	<header class="relative mx-auto max-w-[1240px] px-10 pt-44">
		<div
			aria-hidden="true"
			class="pointer-events-none absolute -top-[5%] left-1/2 hidden h-[560px] w-[900px] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,oklch(0.32_0.015_80_/_0.5),transparent_65%)] dark:block"
		></div>

		<div class="relative">
			<div
				class="border-border/50 text-muted-foreground flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b pb-5 font-mono text-[11px] tracking-[0.14em]"
			>
				<span>
					<a
						href="/projects/fleur-de-papier"
						class="text-muted-foreground hover:text-foreground transition-colors"
						data-edit="bnf.hero.eyebrow.breadcrumb-label"
						>{c("bnf.hero.eyebrow.breadcrumb-label")}</a
					>
					&nbsp;&nbsp;/&nbsp;&nbsp;
					<span class="text-accent-work" data-edit="bnf.hero.eyebrow.production-label"
						>{c("bnf.hero.eyebrow.production-label")}</span
					>
				</span>
				<span data-edit="bnf.hero.eyebrow.period">{c("bnf.hero.eyebrow.period")}</span>
			</div>

			<div class="py-12">
				<h1
					class="text-foreground text-[clamp(56px,7vw,104px)] leading-[0.96] font-[750] tracking-[-0.035em]"
					data-edit="productions.bnf-richelieu.title"
				>
					{c("productions.bnf-richelieu.title")}
				</h1>
				<p
					class="text-muted-foreground mt-6 max-w-[720px] text-[22px] leading-[1.5] text-pretty"
					data-edit="productions.bnf-richelieu.description"
				>
					{c("productions.bnf-richelieu.description")}
				</p>
			</div>

			<MetaStrip items={bnfMeta} dense columns={5} class="mb-12" editNamespace="bnf" />

			<!-- Hero video -->
			<MediaFrame
				caption={{ file: `${video.fileLabel}.MP4`, duration: video.durationLabel }}
				chip={{ labelKey: "bnf.hero.video-chip", dot: true }}
				playSize={88}
				onplay={() => (lightboxOpen = true)}
				playLabel={`Play ${production.title} demo full-screen`}
			>
				<img
					src={video.poster}
					alt={`${production.title} — video poster`}
					class="absolute inset-0 h-full w-full object-cover"
				/>
			</MediaFrame>
			<VideoLightbox
				bind:open={lightboxOpen}
				webm={video.webm}
				mp4={video.mp4}
				fileLabel={`${video.fileLabel}.MP4`}
				title={production.title}
			/>
		</div>
	</header>

	<!-- ============ BRIEF / BUILD ============ -->
	<section class="mx-auto max-w-[1240px] px-10 pt-28">
		<h2 class="sr-only">The brief and what I built</h2>
		<div class="grid grid-cols-1 gap-20 lg:grid-cols-2">
			<div>
				<SectionLabel index="01" labelKey="bnf.section.brief" variant="eyebrow" class="mb-5" />
				<p
					class="text-muted-foreground mb-4 text-[17px] leading-[1.7] text-pretty"
					data-edit="bnf.brief.p1"
				>
					{c("bnf.brief.p1")}
				</p>
				<p class="text-muted-foreground text-[17px] leading-[1.7] text-pretty" data-edit="bnf.brief.p2">
					{c("bnf.brief.p2")}
				</p>
			</div>
			<div>
				<SectionLabel index="02" labelKey="bnf.section.built" variant="eyebrow" class="mb-5" />
				<p
					class="text-muted-foreground mb-4 text-[17px] leading-[1.7] text-pretty"
					data-edit="bnf.built.p1"
				>
					{c("bnf.built.p1")}
				</p>
				<p class="text-muted-foreground text-[17px] leading-[1.7] text-pretty" data-edit="bnf.built.p2">
					{c("bnf.built.p2")}
				</p>
			</div>
		</div>
	</section>

	<!-- ============ IN DETAIL ============ -->
	<section class="mx-auto max-w-[1240px] px-10 pt-28">
		<SectionLabel index="03" labelKey="bnf.section.detail" class="mb-12" />

		<div class="mb-12 grid grid-cols-1 gap-12 lg:[grid-template-columns:minmax(0,7fr)_minmax(0,5fr)]">
			{@render figure(
				`${FIG_BASE}/bnf-richelieu-fig-a.jpg`,
				"Screen capture — cleaning the coins with a fingertip",
				"bnf.detail.fig-a.label",
				"bnf.detail.fig-a.tag"
			)}
			<div class="flex flex-col justify-center gap-6">
				<div class="border-accent-work border-l-2 pl-6">
					<h3
						class="text-foreground mb-2 text-[22px] font-bold tracking-[-0.02em]"
						data-edit="bnf.detail.note-1.title"
					>
						{c("bnf.detail.note-1.title")}
					</h3>
					<p
						class="text-muted-foreground text-[15px] leading-[1.65] text-pretty"
						data-edit="bnf.detail.note-1.desc"
					>
						{c("bnf.detail.note-1.desc")}
					</p>
				</div>
				<div class="border-border border-l-2 pl-6">
					<h3
						class="text-foreground mb-2 text-[22px] font-bold tracking-[-0.02em]"
						data-edit="bnf.detail.note-2.title"
					>
						{c("bnf.detail.note-2.title")}
					</h3>
					<p
						class="text-muted-foreground text-[15px] leading-[1.65] text-pretty"
						data-edit="bnf.detail.note-2.desc"
					>
						{c("bnf.detail.note-2.desc")}
					</p>
				</div>
			</div>
		</div>

		<div class="grid grid-cols-1 gap-12 lg:grid-cols-2">
			{@render figure(
				`${FIG_BASE}/bnf-richelieu-fig-b.jpg`,
				"Screen capture — illustrated narrative of Joseph Pellerin's coin inventory",
				"bnf.detail.fig-b.label",
				"bnf.detail.fig-b.tag"
			)}
			{@render figure(
				`${FIG_BASE}/bnf-richelieu-fig-c.jpg`,
				"Screen capture — the 169 BCE coin-hoard opening scene with the DÉBUT / START / INICIO language bar",
				"bnf.detail.fig-c.label",
				"bnf.detail.fig-c.tag"
			)}
		</div>
	</section>

	<!-- ============ ENGINEERING NOTES ============ -->
	<section class="mx-auto max-w-[1240px] px-10 pt-28">
		<div
			class="border-border/50 bg-foreground/[0.02] grid grid-cols-1 gap-16 rounded-[14px] border p-10 lg:[grid-template-columns:minmax(0,4fr)_minmax(0,8fr)]"
		>
			<div>
				<SectionLabel index="04" labelKey="bnf.section.notes" variant="eyebrow" class="mb-4" />
				<p class="text-muted-foreground text-[15px] leading-[1.65] text-pretty" data-edit="bnf.engineering.intro">
					{c("bnf.engineering.intro")}
				</p>
			</div>
			<div class="flex flex-col">
				<div
					class="border-border/50 grid grid-cols-[180px_1fr] gap-6 border-b py-3.5 text-[15px]"
				>
					<span
						class="text-muted-foreground pt-0.5 font-mono text-[11px] tracking-[0.1em]"
						data-edit="bnf.engineering.interaction.label">{c("bnf.engineering.interaction.label")}</span
					>
					<span class="text-foreground" data-edit="bnf.engineering.interaction.desc">
						{c("bnf.engineering.interaction.desc")}
					</span>
				</div>
				<div
					class="border-border/50 grid grid-cols-[180px_1fr] gap-6 border-b py-3.5 text-[15px]"
				>
					<span
						class="text-muted-foreground pt-0.5 font-mono text-[11px] tracking-[0.1em]"
						data-edit="bnf.engineering.languages.label">{c("bnf.engineering.languages.label")}</span
					>
					<span class="text-foreground" data-edit="bnf.engineering.languages.desc">
						{c("bnf.engineering.languages.desc")}
					</span>
				</div>
				<div
					class="border-border/50 grid grid-cols-[180px_1fr] gap-6 border-b py-3.5 text-[15px]"
				>
					<span
						class="text-muted-foreground pt-0.5 font-mono text-[11px] tracking-[0.1em]"
						data-edit="bnf.engineering.experience.label">{c("bnf.engineering.experience.label")}</span
					>
					<span class="text-foreground" data-edit="bnf.engineering.experience.desc">
						{c("bnf.engineering.experience.desc")}
					</span>
				</div>
				<div class="grid grid-cols-[180px_1fr] gap-6 py-3.5 text-[15px]">
					<span
						class="text-muted-foreground pt-0.5 font-mono text-[11px] tracking-[0.1em]"
						data-edit="bnf.engineering.stack.label">{c("bnf.engineering.stack.label")}</span
					>
					<span class="text-foreground" data-edit="bnf.engineering.stack.desc">
						{c("bnf.engineering.stack.desc")}
					</span>
				</div>
			</div>
		</div>
	</section>

	<!-- ============ PREV / NEXT ============ -->
	<section class="mx-auto max-w-[1240px] px-10 pt-32 pb-24">
		<PrevNext
			prev={{
				eyebrowKey: "bnf.prev-next.prev.eyebrow",
				titleKey: "bnf.prev-next.prev.title",
				href: "/projects/fleur-de-papier"
			}}
			next={{
				eyebrowKey: "bnf.prev-next.next.eyebrow",
				titleKey: "productions.la-contemporaine.title",
				href: "/projects/fleur-de-papier#production-02"
			}}
		/>
	</section>

	<Footer />
</div>
