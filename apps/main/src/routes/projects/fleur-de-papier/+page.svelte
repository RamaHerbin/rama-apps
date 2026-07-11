<script lang="ts">
	import { onMount } from "svelte";
	import { NavAnchor, Footer } from "$lib/portfolio/index.js";
	import {
		FilmGrain,
		MetaStrip,
		SectionLabel,
		Tag,
		MediaFrame,
		VideoLightbox,
		ContextBar,
		PrevNext,
		productions,
		fdpHeroMeta,
		approach,
		type Production
	} from "$lib/portfolio/work/index.js";

	// --- Selected-productions rows ------------------------------------------
	// The 6 productions render data-driven, in their `layout` variant. The two
	// "duo" productions (04, 05) share one 2-col row, matching the mockup's
	// "secondary two-up" block — grouped by scanning for adjacent duo items
	// rather than hardcoding which slugs occupy those slots.
	type Row =
		| { type: "single"; key: string; item: Production }
		| { type: "duo"; key: string; items: Production[] };

	function buildRows(items: Production[]): Row[] {
		const out: Row[] = [];
		for (let i = 0; i < items.length; i++) {
			const p = items[i];
			const next = items[i + 1];
			if (p.layout === "duo" && next?.layout === "duo") {
				out.push({ type: "duo", key: `${p.slug}+${next.slug}`, items: [p, next] });
				i++;
				continue;
			}
			out.push({ type: "single", key: p.slug, item: p });
		}
		return out;
	}

	const rows = buildRows(productions);

	// --- Shared video lightbox ----------------------------------------------
	let lightboxOpen = $state(false);
	let activeProduction = $state<Production | null>(null);

	function openLightbox(p: Production): void {
		activeProduction = p;
		lightboxOpen = true;
		previewing = {};
	}

	// --- Hover-to-preview (desktop, fine pointer, motion-ok only) -----------
	// MediaFrame's own play button opens the lightbox (Pattern B — the primary
	// pattern, matching every play button in the mockup). VideoPlayer's built-in
	// hover preview can't be reused here without a second, conflicting play
	// button, so this is a minimal local swap: a muted, looping <video> in
	// place of the poster while hovering, mirroring VideoPlayer's own
	// hover-preview gating logic.
	let canHoverPreview = $state(false);
	let previewing = $state<Record<string, boolean>>({});

	onMount(() => {
		canHoverPreview =
			typeof window !== "undefined" &&
			window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
			!window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	});

	function startPreview(slug: string): void {
		if (!canHoverPreview) return;
		previewing = { ...previewing, [slug]: true };
	}

	function endPreview(slug: string): void {
		if (!(slug in previewing)) return;
		const next = { ...previewing };
		delete next[slug];
		previewing = next;
	}

	const roleRows = [
		{ label: "Front-end architecture & development", tag: "ALL PROJECTS" },
		{ label: "Interaction & animation design", tag: "GSAP / CANVAS" },
		{ label: "Kiosk & touch-table deployment", tag: "ON-SITE" },
		{ label: "Flash → modern web migrations", tag: "LEGACY" }
	];
</script>

<svelte:head>
	<title>Fleur de Papier — Case Study - Rama Herbin</title>
	<meta
		name="description"
		content="Case study: interactive, educational web experiences built at Fleur de Papier for cultural institutions — BnF Richelieu, La Contemporaine, Terre Adélice and more. 2020–2023."
	/>
</svelte:head>

{#snippet tagList(tags: string[], size: "sm" | "xs" = "sm")}
	<div class="flex flex-wrap gap-2">
		{#each tags as tag (tag)}
			<Tag label={tag} class={size === "xs" ? "text-[11px]" : "text-xs"} />
		{/each}
	</div>
{/snippet}

{#snippet tbcChip()}
	<span
		class="inline-block rounded border border-border/70 px-1.5 py-[3px] align-middle font-mono text-[10px] tracking-[0.12em] text-muted-foreground"
	>
		INSTITUTION TBC
	</span>
{/snippet}

{#snippet productionMedia(p: Production, playSize: 88 | 72 | 60 | 52, featured: boolean)}
	{#if p.video}
		{@const v = p.video}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="relative" onpointerenter={() => startPreview(p.slug)} onpointerleave={() => endPreview(p.slug)}>
			<MediaFrame
				caption={{ file: `${v.fileLabel}.MP4`, duration: v.durationLabel }}
				chip={featured ? { label: "HOVER PREVIEW · MUTED", dot: true } : undefined}
				{playSize}
				playLabel={`Play ${p.title} demo full-screen`}
				onplay={() => openLightbox(p)}
			>
				{#if canHoverPreview && previewing[p.slug]}
					<!-- svelte-ignore a11y_media_has_caption -->
					<video
						class="absolute inset-0 h-full w-full object-cover"
						poster={v.poster}
						autoplay
						muted
						loop
						playsinline
						aria-hidden="true"
					>
						<source src={v.webm} type="video/webm" />
						<source src={v.mp4} type="video/mp4" />
					</video>
				{:else}
					<img
						src={v.poster}
						alt={`${p.title} — video poster`}
						class="absolute inset-0 h-full w-full object-cover"
						loading="lazy"
					/>
				{/if}
			</MediaFrame>
		</div>
	{:else}
		<MediaFrame glow={false} chip={{ label: "DEMO IN PREPARATION" }}>
			<div
				class="absolute inset-0 grid place-items-center font-mono text-[11px] tracking-[0.16em] text-muted-foreground"
			>
				IN PREPARATION
			</div>
		</MediaFrame>
	{/if}
{/snippet}

<div class="relative min-h-screen overflow-x-clip">
	<FilmGrain />
	<NavAnchor />

	<!-- ============ HERO ============ -->
	<header class="relative pt-44">
		<div
			class="pointer-events-none absolute -top-[10%] left-1/2 hidden h-[700px] w-[1100px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,oklch(0.32_0.015_80_/_0.55),transparent_65%)] dark:block"
			aria-hidden="true"
		></div>
		<div
			class="pointer-events-none absolute inset-0 hidden opacity-[0.16] [background-image:linear-gradient(oklch(0.985_0_0_/_0.08)_1px,transparent_1px),linear-gradient(90deg,oklch(0.985_0_0_/_0.08)_1px,transparent_1px)] [background-size:72px_72px] [-webkit-mask-image:radial-gradient(720px_circle_at_50%_20%,white,transparent)] [mask-image:radial-gradient(720px_circle_at_50%_20%,white,transparent)] dark:block"
			aria-hidden="true"
		></div>

		<div class="relative mx-auto max-w-[1240px] px-10">
			<!-- Eyebrow row -->
			<div
				class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border/50 pb-5 font-mono text-[11px] tracking-[0.14em] text-muted-foreground"
			>
				<span>
					<span class="text-accent-work">CASE STUDY — 01</span>
					&nbsp;&nbsp;/&nbsp;&nbsp;CULTURAL EXPERIENCES
				</span>
				<span class="flex items-center gap-2 whitespace-nowrap">
					<span
						class="h-1.5 w-1.5 rounded-full bg-accent-work motion-safe:animate-[blink_2.4s_ease-in-out_infinite]"
						aria-hidden="true"
					></span>
					2020 — 2023 · PARIS, FR
				</span>
			</div>

			<!-- Display title -->
			<div class="pt-14">
				<h1
					class="text-[clamp(72px,9.5vw,132px)] leading-[0.94] font-[750] tracking-[-0.035em] text-foreground"
				>
					Fleur de&nbsp;Papier<span class="text-accent-work">.</span>
				</h1>
			</div>

			<!-- Intro row -->
			<div
				class="grid grid-cols-1 items-end gap-10 py-12 lg:gap-16 lg:[grid-template-columns:minmax(0,7fr)_minmax(0,4fr)]"
			>
				<p class="max-w-[640px] text-2xl leading-[1.5] text-pretty text-muted-foreground">
					A Paris-based <span class="text-foreground">cultural mediation agency</span>. As creative
					developer, I built immersive, educational web experiences for cultural institutions —
					interfaces for the web, touch screens and exhibition contexts — working alongside
					designers, project managers, illustrators and the institutions themselves.
				</p>
				<div class="flex items-start lg:items-end lg:justify-end">
					<img
						src="/portfolio/FleurdePapier.svg"
						alt="Fleur de Papier logo"
						class="h-16 max-w-full object-contain opacity-85 dark:[filter:grayscale(1)_invert(1)_brightness(1.5)]"
					/>
				</div>
			</div>

			<MetaStrip items={fdpHeroMeta} />
		</div>
	</header>

	<!-- ============ (01) CONTEXT ============ -->
	<section class="relative mx-auto max-w-[1240px] px-10 pt-28">
		<SectionLabel index="01" label="CONTEXT" class="mb-12" />

		<div class="grid grid-cols-1 gap-20 lg:grid-cols-2">
			<div>
				<h2 class="mb-5 text-[32px] font-bold tracking-[-0.02em] text-foreground">The mission</h2>
				<p class="mb-4 text-[17px] leading-[1.7] text-pretty text-muted-foreground">
					Fleur de Papier crafts digital mediation for the cultural sector — turning collections,
					archives and exhibitions into experiences the public can touch, play and explore, for
					national institutions, regional museums and cultural venues.
				</p>
				<p class="text-[17px] leading-[1.7] text-pretty text-muted-foreground">
					Every production balances curatorial rigor with playfulness: content shaped together with
					curators and institutions, interfaces designed for visitors of every age, running on
					everything from gallery touch tables to exhibition kiosks.
				</p>
			</div>
			<div>
				<h2 class="mb-5 text-[32px] font-bold tracking-[-0.02em] text-foreground">My role</h2>
				<p class="mb-4 text-[17px] leading-[1.7] text-pretty text-muted-foreground">
					I worked as creative developer and front-end developer — building the interaction and
					animation layers, translating design intent into working interfaces, and taking
					productions from prototype to on-site installation alongside designers, project managers
					and illustrators.
				</p>
				<div class="flex flex-col border-t border-border/50">
					{#each roleRows as row (row.label)}
						<div class="flex items-center justify-between border-b border-border/50 py-3.5 text-[15px]">
							<span class="text-foreground">{row.label}</span>
							<span class="font-mono text-[10px] tracking-[0.1em] text-muted-foreground">{row.tag}</span
							>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</section>

	<!-- ============ (02) SELECTED PRODUCTIONS ============ -->
	<section class="relative mx-auto max-w-[1240px] px-10 pt-32">
		<SectionLabel index="02" label="SELECTED PRODUCTIONS" counter="6 PROJECTS" class="mb-4" />
		<p class="mb-16 max-w-[560px] text-[17px] text-pretty text-muted-foreground">
			Video demonstrations of the productions I developed. Hover for a silent preview, click to
			watch full-screen.
		</p>

		{#each rows as row (row.key)}
			{#if row.type === "duo"}
				<div class="mb-24 grid grid-cols-1 gap-12 lg:grid-cols-2">
					{#each row.items as p (p.slug)}
						<article id={`production-${p.index}`}>
							{@render productionMedia(p, 60, false)}
							<div class="pt-5">
								<div class="flex flex-wrap items-baseline gap-3">
									<span class="font-mono text-[11px] tracking-[0.1em] text-accent-work">{p.index}</span>
									<h3 class="text-2xl font-bold tracking-[-0.02em] text-foreground">{p.title}</h3>
									{#if p.tbc}{@render tbcChip()}{/if}
								</div>
								<p class="mt-2.5 text-[15px] leading-[1.65] text-pretty text-muted-foreground">
									{p.description}
								</p>
								<div class="mt-3.5">{@render tagList(p.tags, "xs")}</div>
							</div>
						</article>
					{/each}
				</div>
			{:else}
				{@const p = row.item}
				{#if p.layout === "full"}
					<article id={`production-${p.index}`} class="mb-32">
						{@render productionMedia(p, 88, true)}
						<div
							class="grid grid-cols-1 gap-10 pt-8 lg:gap-16 lg:[grid-template-columns:minmax(0,7fr)_minmax(0,4fr)]"
						>
							<div>
								<div class="flex flex-wrap items-baseline gap-4">
									<span class="font-mono text-xs tracking-[0.1em] text-accent-work">{p.index}</span>
									<h3
										class="text-[clamp(32px,4.5vw,44px)] leading-[1.05] font-bold tracking-[-0.025em] text-foreground"
									>
										{p.title}
									</h3>
									{#if p.featured}
										<span
											class="-translate-y-1 rounded bg-accent-work px-2 py-1 font-mono text-[10px] tracking-[0.12em] text-[oklch(0.145_0_0)]"
										>
											FEATURED
										</span>
									{/if}
								</div>
								<p class="mt-4 max-w-[620px] text-base leading-[1.7] text-pretty text-muted-foreground">
									{p.description}
								</p>
								{#if p.detailHref}
									<a
										href={p.detailHref}
										class="mt-6 inline-flex items-center gap-2.5 border-b border-border pb-1 text-[15px] font-semibold text-foreground transition-colors hover:border-foreground"
									>
										Read the full case <span class="text-accent-work" aria-hidden="true">→</span>
									</a>
								{/if}
							</div>
							<div class="flex flex-col gap-5 border-l border-border/50 pl-8">
								<div>
									<div class="mb-1.5 font-mono text-[10px] tracking-[0.14em] text-muted-foreground/70">
										MY CONTRIBUTION
									</div>
									<div class="text-[15px] leading-[1.6] text-foreground">{p.role}</div>
								</div>
								<div>
									<div class="mb-2 font-mono text-[10px] tracking-[0.14em] text-muted-foreground/70">
										TECHNOLOGIES
									</div>
									{@render tagList(p.tags)}
								</div>
							</div>
						</div>
					</article>
				{:else if p.layout === "split-left"}
					<article
						id={`production-${p.index}`}
						class="mb-32 grid grid-cols-1 items-center gap-10 lg:gap-12 lg:[grid-template-columns:minmax(0,7fr)_minmax(0,5fr)]"
					>
						{@render productionMedia(p, 72, false)}
						<div>
							<div class="flex items-baseline gap-3.5">
								<span class="font-mono text-xs tracking-[0.1em] text-accent-work">{p.index}</span>
								<h3 class="text-[clamp(28px,4vw,36px)] font-bold tracking-[-0.025em] text-foreground">
									{p.title}
								</h3>
							</div>
							<p class="mt-4 text-base leading-[1.7] text-pretty text-muted-foreground">
								{p.description}
							</p>
							<div class="mt-6 flex flex-col gap-3 border-t border-border/50 pt-4">
								<div class="flex justify-between gap-4 text-sm">
									<span class="pt-[3px] font-mono text-[10px] tracking-[0.14em] text-muted-foreground/70"
										>ROLE</span
									>
									<span class="text-right text-foreground">{p.role}</span>
								</div>
								<div class="flex justify-between gap-4 text-sm">
									<span class="pt-[3px] font-mono text-[10px] tracking-[0.14em] text-muted-foreground/70"
										>TECH</span
									>
									{@render tagList(p.tags)}
								</div>
							</div>
						</div>
					</article>
				{:else if p.layout === "split-right"}
					<article
						id={`production-${p.index}`}
						class="mb-32 grid grid-cols-1 items-center gap-10 lg:gap-12 lg:[grid-template-columns:minmax(0,5fr)_minmax(0,7fr)]"
					>
						<div class="lg:order-2">
							{@render productionMedia(p, 72, false)}
						</div>
						<div class="lg:order-1">
							<div class="flex items-baseline gap-3.5">
								<span class="font-mono text-xs tracking-[0.1em] text-accent-work">{p.index}</span>
								<h3 class="text-[clamp(28px,4vw,36px)] font-bold tracking-[-0.025em] text-foreground">
									{p.title}
								</h3>
							</div>
							<p class="mt-4 text-base leading-[1.7] text-pretty text-muted-foreground">
								{p.description}
							</p>
							<div class="mt-6 flex flex-col gap-3 border-t border-border/50 pt-4">
								<div class="flex justify-between gap-4 text-sm">
									<span class="pt-[3px] font-mono text-[10px] tracking-[0.14em] text-muted-foreground/70"
										>ROLE</span
									>
									<span class="text-right text-foreground">{p.role}</span>
								</div>
								<div class="flex justify-between gap-4 text-sm">
									<span class="pt-[3px] font-mono text-[10px] tracking-[0.14em] text-muted-foreground/70"
										>TECH</span
									>
									{@render tagList(p.tags)}
								</div>
							</div>
						</div>
					</article>
				{:else if p.layout === "slim"}
					<article
						id={`production-${p.index}`}
						class="grid grid-cols-1 items-center gap-10 border-y border-border/50 py-10 lg:gap-12 lg:[grid-template-columns:minmax(0,4fr)_minmax(0,8fr)]"
					>
						{@render productionMedia(p, 52, false)}
						<div>
							<div class="flex flex-wrap items-baseline gap-3">
								<span class="font-mono text-[11px] tracking-[0.1em] text-accent-work">{p.index}</span>
								<h3 class="text-2xl font-bold tracking-[-0.02em] text-foreground">{p.title}</h3>
								{#if p.tbc}{@render tbcChip()}{/if}
							</div>
							<p class="mt-2.5 max-w-[640px] text-[15px] leading-[1.65] text-pretty text-muted-foreground">
								{p.description}
							</p>
							<div class="mt-3.5">{@render tagList(p.tags, "xs")}</div>
						</div>
					</article>
				{/if}
			{/if}
		{/each}
	</section>

	<!-- ============ (03) APPROACH ============ -->
	<section class="relative mx-auto max-w-[1240px] px-10 pt-32">
		<SectionLabel index="03" label="APPROACH" class="mb-12" />

		<div class="flex flex-col border-t border-border/50">
			{#each approach as item (item.index)}
				<div
					class="grid grid-cols-1 items-baseline gap-3 border-b border-border/50 py-7 transition-[background-color,padding] hover:bg-foreground/[0.02] hover:pl-4 md:gap-8 md:[grid-template-columns:80px_minmax(0,7fr)_minmax(0,5fr)]"
				>
					<span class="font-mono text-xs tracking-[0.1em] text-accent-work">{item.index}</span>
					<h3 class="text-[clamp(28px,3.2vw,42px)] font-bold tracking-[-0.025em] text-foreground">
						{item.title}
					</h3>
					<p class="text-[15px] leading-[1.6] text-pretty text-muted-foreground">{item.desc}</p>
				</div>
			{/each}
		</div>
	</section>

	<!-- ============ PREV / NEXT ============ -->
	<section class="mx-auto max-w-[1240px] px-10 pt-32 pb-24">
		<PrevNext
			prev={{ eyebrow: "← BACK TO", title: "Portfolio", href: "/#projects" }}
			next={{ eyebrow: "NEXT CASE →", title: "Personal Projects", href: "/projects/personal" }}
		/>
	</section>

	<Footer />

	<ContextBar
		prev={{ href: "/#projects", label: "PORTFOLIO" }}
		center="CASE 01 — FLEUR DE PAPIER"
		next={{ href: "/projects/personal", label: "NEXT: PERSONAL" }}
	/>

	<VideoLightbox
		bind:open={lightboxOpen}
		webm={activeProduction?.video?.webm}
		mp4={activeProduction?.video?.mp4}
		fileLabel={activeProduction?.video ? `${activeProduction.video.fileLabel}.MP4` : ""}
		title={activeProduction?.title ?? "Video"}
	/>
</div>
