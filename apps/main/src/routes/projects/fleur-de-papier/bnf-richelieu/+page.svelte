<script lang="ts">
	import { NavAnchor, Footer } from "$lib/portfolio/index.js";
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

{#snippet figure(src: string, alt: string, label: string, tag: string)}
	<div class="border-border/60 bg-surface-raised overflow-hidden rounded-[14px] border">
		<div class="relative aspect-[16/10]">
			<img {src} {alt} loading="lazy" class="absolute inset-0 h-full w-full object-cover" />
		</div>
		<div
			class="border-border/50 text-muted-foreground flex justify-between border-t px-5 py-3.5 font-mono text-[10px] tracking-[0.12em]"
		>
			<span>{label}</span>
			<span class="text-accent-work">{tag}</span>
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
		prev={{ href: "/projects/fleur-de-papier", label: "FLEUR DE PAPIER" }}
		center="PRODUCTION 01 / 06"
		next={{ href: "/projects/fleur-de-papier#production-02", label: "NEXT: LA CONTEMPORAINE" }}
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
						class="text-muted-foreground hover:text-foreground transition-colors">FLEUR DE PAPIER</a
					>
					&nbsp;&nbsp;/&nbsp;&nbsp;
					<span class="text-accent-work">PRODUCTION 01</span>
				</span>
				<span>2022 (TBC) · PARIS, FR</span>
			</div>

			<div class="py-12">
				<h1
					class="text-foreground text-[clamp(56px,7vw,104px)] leading-[0.96] font-[750] tracking-[-0.035em]"
				>
					BnF Richelieu
				</h1>
				<p class="text-muted-foreground mt-6 max-w-[720px] text-[22px] leading-[1.5] text-pretty">
					{production.description}
				</p>
			</div>

			<MetaStrip items={bnfMeta} dense columns={5} class="mb-12" />

			<!-- Hero video -->
			<MediaFrame
				caption={{ file: `${video.fileLabel}.MP4`, duration: video.durationLabel }}
				chip={{ label: "FULL DEMO", dot: true }}
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
				<SectionLabel index="01" label="THE BRIEF" variant="eyebrow" class="mb-5" />
				<p class="text-muted-foreground mb-4 text-[17px] leading-[1.7] text-pretty">
					For the reopening of the Richelieu site after its renovation, the Bibliothèque nationale
					de France wanted visitors to explore collection highlights beyond the vitrines — the
					stories and details a label can't hold.
				</p>
				<p class="text-muted-foreground text-[17px] leading-[1.7] text-pretty">
					The experience had to welcome every kind of visitor: from art historians to
					first-time visitors, from French speakers to international guests, exploring alone or
					gathered in a small group around the same screen.
				</p>
			</div>
			<div>
				<SectionLabel index="02" label="WHAT I BUILT" variant="eyebrow" class="mb-5" />
				<p class="text-muted-foreground mb-4 text-[17px] leading-[1.7] text-pretty">
					I worked on the creative development and front-end of the experience — translating the
					graphic intent into a touch-driven interface, from integration through interactions and
					animation.
				</p>
				<p class="text-muted-foreground text-[17px] leading-[1.7] text-pretty">
					Visitors explore grouped collection highlights — including ancient coins — by touch,
					then zoom into individual works for a closer look. A multi-language idle attract screen
					(DÉBUT · START · INICIO) invites passers-by without a word of instruction.
				</p>
			</div>
		</div>
	</section>

	<!-- ============ IN DETAIL ============ -->
	<section class="mx-auto max-w-[1240px] px-10 pt-28">
		<SectionLabel index="03" label="IN DETAIL" class="mb-12" />

		<div class="mb-12 grid grid-cols-1 gap-12 lg:[grid-template-columns:minmax(0,7fr)_minmax(0,5fr)]">
			{@render figure(
				`${FIG_BASE}/bnf-richelieu-fig-a.jpg`,
				"Screen capture — cleaning the coins with a fingertip",
				"FIG. A — COIN CLEANING",
				"TOUCH"
			)}
			<div class="flex flex-col justify-center gap-6">
				<div class="border-accent-work border-l-2 pl-6">
					<h3 class="text-foreground mb-2 text-[22px] font-bold tracking-[-0.02em]">
						Fluid navigation between works
					</h3>
					<p class="text-muted-foreground text-[15px] leading-[1.65] text-pretty">
						Artworks, maps and stories share one continuous space — smooth transitions keep
						visitors oriented as they move between scales, from the full collection down to a
						single detail.
					</p>
				</div>
				<div class="border-border border-l-2 pl-6">
					<h3 class="text-foreground mb-2 text-[22px] font-bold tracking-[-0.02em]">
						Zero-instruction interface
					</h3>
					<p class="text-muted-foreground text-[15px] leading-[1.65] text-pretty">
						A multi-language idle attract screen demonstrates the experience before anyone
						touches it, so the first interaction teaches the rest.
					</p>
				</div>
			</div>
		</div>

		<div class="grid grid-cols-1 gap-12 lg:grid-cols-2">
			{@render figure(
				`${FIG_BASE}/bnf-richelieu-fig-b.jpg`,
				"Screen capture — illustrated narrative of Joseph Pellerin's coin inventory",
				"FIG. B — ILLUSTRATED NARRATIVE",
				"STORY"
			)}
			{@render figure(
				`${FIG_BASE}/bnf-richelieu-fig-c.jpg`,
				"Screen capture — the 169 BCE coin-hoard opening scene with the DÉBUT / START / INICIO language bar",
				"FIG. C — MULTI-LANGUAGE INTERFACE",
				"FR · EN · ES"
			)}
		</div>
	</section>

	<!-- ============ ENGINEERING NOTES ============ -->
	<section class="mx-auto max-w-[1240px] px-10 pt-28">
		<div
			class="border-border/50 bg-foreground/[0.02] grid grid-cols-1 gap-16 rounded-[14px] border p-10 lg:[grid-template-columns:minmax(0,4fr)_minmax(0,8fr)]"
		>
			<div>
				<SectionLabel index="04" label="ENGINEERING NOTES" variant="eyebrow" class="mb-4" />
				<p class="text-muted-foreground text-[15px] leading-[1.65] text-pretty">
					A few notes on how the experience was built for a shared, public touch screen.
				</p>
			</div>
			<div class="flex flex-col">
				<div
					class="border-border/50 grid grid-cols-[180px_1fr] gap-6 border-b py-3.5 text-[15px]"
				>
					<span class="text-muted-foreground pt-0.5 font-mono text-[11px] tracking-[0.1em]"
						>INTERACTION</span
					>
					<span class="text-foreground">
						Touch-first gestures designed for a shared, large-format screen — generous hit
						targets that work for one visitor or several at once.
					</span>
				</div>
				<div
					class="border-border/50 grid grid-cols-[180px_1fr] gap-6 border-b py-3.5 text-[15px]"
				>
					<span class="text-muted-foreground pt-0.5 font-mono text-[11px] tracking-[0.1em]"
						>LANGUAGES</span
					>
					<span class="text-foreground">
						French, English and Spanish content switching, shown in the attract screen (DÉBUT ·
						START · INICIO).
					</span>
				</div>
				<div
					class="border-border/50 grid grid-cols-[180px_1fr] gap-6 border-b py-3.5 text-[15px]"
				>
					<span class="text-muted-foreground pt-0.5 font-mono text-[11px] tracking-[0.1em]"
						>EXPERIENCE</span
					>
					<span class="text-foreground">
						An idle attract loop invites passers-by to start exploring without a word of
						instruction.
					</span>
				</div>
				<div class="grid grid-cols-[180px_1fr] gap-6 py-3.5 text-[15px]">
					<span class="text-muted-foreground pt-0.5 font-mono text-[11px] tracking-[0.1em]"
						>STACK</span
					>
					<span class="text-foreground">
						Specific technologies for this production are still to be confirmed.
					</span>
				</div>
			</div>
		</div>
	</section>

	<!-- ============ PREV / NEXT ============ -->
	<section class="mx-auto max-w-[1240px] px-10 pt-32 pb-24">
		<PrevNext
			prev={{
				eyebrow: "← ALL PRODUCTIONS",
				title: "Fleur de Papier",
				href: "/projects/fleur-de-papier"
			}}
			next={{
				eyebrow: "NEXT PRODUCTION →",
				title: "La Contemporaine",
				href: "/projects/fleur-de-papier#production-02"
			}}
		/>
	</section>

	<Footer />
</div>
