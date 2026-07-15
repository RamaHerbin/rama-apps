<script lang="ts">
	import { SectionLabel, Tag, MediaFrame } from "$lib/portfolio/work/index.js";
	import AnsysLogo from "$lib/portfolio/AnsysLogo.svelte";
	import { LineHoverLink } from "fancy-ui-svelte";
	import { c, cList } from "$lib/content/index.js";
</script>

<section id="projects" class="px-6 py-20">
	<div class="mx-auto max-w-6xl">
		<!-- SectionLabel does not forward data-edit attributes to its rendered DOM,
		     so label/counter are content-driven but not directly click-to-edit here. -->
		<SectionLabel labelKey="home.projects.label" counterKey="home.projects.counter" class="mb-6" />

		<div
			class="mb-16 grid grid-cols-1 items-end gap-12 lg:[grid-template-columns:minmax(0,7fr)_minmax(0,5fr)]"
		>
			<h2
				class="text-foreground text-[clamp(40px,7vw,56px)] leading-none font-[750] tracking-[-0.03em]"
				data-edit="home.projects.title"
			>
				{c("home.projects.title")}
			</h2>
			<p class="text-muted-foreground text-[17px] leading-[1.6] text-pretty" data-edit="home.projects.intro">
				{c("home.projects.intro")}
			</p>
		</div>

		<!-- 01 · Fleur de Papier — whole card is clickable via a stretched link;
		     the "View the case study" CTA (scribble) is the keyboard/SR link. -->
		<div
			class="group/card border-border/50 hover:bg-foreground/[0.02] relative grid grid-cols-1 items-center gap-12 border-t py-10 transition-colors lg:[grid-template-columns:minmax(0,7fr)_minmax(0,5fr)]"
		>
			<!--
				Stretched link: covers the whole card for mouse clicks (z-[1] so it
				sits above the positioned MediaFrame; the CTA below is z-10, so it
				stays independently clickable). Hidden from the a11y tree + focus
				order so it doesn't duplicate the CTA link, which is the real
				accessible link.
			-->
			<a
				href="/projects/fleur-de-papier"
				aria-hidden="true"
				tabindex="-1"
				class="absolute inset-0 z-[1]"
			></a>

			<!-- glow moved to card-level hover, since the stretched link sits over the media -->
			<MediaFrame
				aspect="16 / 10"
				glow={false}
				class="transition-shadow duration-300 group-hover/card:shadow-[0_0_60px_oklch(0.32_0.015_80_/_0.3)]"
			>
				<img
					src="/videos/fleur-de-papier/bnf-richelieu-poster.jpg"
					alt=""
					class="absolute inset-0 h-full w-full object-cover"
					loading="lazy"
				/>
				<div
					class="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-[oklch(0.1_0_0_/_0.85)] to-transparent px-5 pt-10 pb-3.5 font-mono text-[10px] tracking-[0.1em] text-white/75"
				>
					<span data-edit="home.projects.fdp.caption">{c("home.projects.fdp.caption")}</span>
					<span class="flex items-center gap-1.5">
						<span class="bg-accent-work h-1.5 w-1.5 rounded-full" aria-hidden="true"></span>
						<span data-edit="home.projects.fdp.case-label">{c("home.projects.fdp.case-label")}</span>
					</span>
				</div>
			</MediaFrame>

			<div>
				<div class="flex items-baseline gap-3.5 font-mono text-[11px] tracking-[0.12em]">
					<span class="text-accent-work" data-edit="home.projects.fdp.index"
						>{c("home.projects.fdp.index")}</span
					>
					<span class="text-muted-foreground" data-edit="home.projects.fdp.eyebrow"
						>{c("home.projects.fdp.eyebrow")}</span
					>
				</div>
				<h3
					class="text-foreground mt-3.5 text-[clamp(28px,4vw,40px)] leading-[1.05] font-bold tracking-[-0.025em]"
					data-edit="home.projects.fdp.title"
				>
					{c("home.projects.fdp.title")}
				</h3>
				<p
					class="text-muted-foreground mt-4 text-base leading-[1.65] text-pretty"
					data-edit="home.projects.fdp.description"
				>
					{c("home.projects.fdp.description")}
				</p>
				<div class="mt-[18px] flex flex-wrap gap-2" data-edit-list="home.projects.fdp.tags">
					{#each cList("home.projects.fdp.tags") as t, i}
						<span data-edit-item={i}><Tag label={t} /></span>
					{/each}
				</div>
				<LineHoverLink
					href="/projects/fleur-de-papier"
					variant="scribble"
					class="text-foreground relative z-10 mt-6 inline-flex items-center text-[15px] font-semibold"
				>
					<span data-edit="home.projects.fdp.cta">{c("home.projects.fdp.cta")}</span>
					<span class="text-accent-work ml-2" aria-hidden="true">&rarr;</span>
				</LineHoverLink>
			</div>
		</div>

		<!-- 02 · Ansys — confidential, not a link -->
		<div
			class="border-border/50 hover:bg-foreground/[0.02] grid grid-cols-1 items-center gap-12 border-t py-10 transition-colors lg:[grid-template-columns:minmax(0,7fr)_minmax(0,5fr)]"
		>
			<div>
				<div class="flex items-baseline gap-3.5 font-mono text-[11px] tracking-[0.12em]">
					<span class="text-accent-work" data-edit="home.projects.ansys.index"
						>{c("home.projects.ansys.index")}</span
					>
					<span class="text-muted-foreground" data-edit="home.projects.ansys.eyebrow"
						>{c("home.projects.ansys.eyebrow")}</span
					>
				</div>
				<h3
					class="text-foreground mt-3.5 text-[clamp(28px,4vw,40px)] leading-[1.05] font-bold tracking-[-0.025em]"
					data-edit="home.projects.ansys.title"
				>
					{c("home.projects.ansys.title")}
				</h3>
				<p
					class="text-muted-foreground mt-4 text-base leading-[1.65] text-pretty"
					data-edit="home.projects.ansys.description"
				>
					{c("home.projects.ansys.description")}
				</p>
				<div class="mt-[18px] flex flex-wrap gap-2" data-edit-list="home.projects.ansys.tags">
					{#each cList("home.projects.ansys.tags") as t, i}
						<span data-edit-item={i}><Tag label={t} /></span>
					{/each}
				</div>
				<div class="text-muted-foreground mt-6 inline-flex items-center gap-2 text-[13px]">
					<svg
						class="h-4 w-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
						></path>
					</svg>
					<span data-edit="home.projects.ansys.confidential-note"
						>{c("home.projects.ansys.confidential-note")}</span
					>
				</div>
			</div>

			<MediaFrame aspect="16 / 10" class="bg-black">
				<div class="absolute inset-0 flex items-center justify-center p-12 sm:p-16">
					<AnsysLogo class="h-auto w-[55%] max-w-[260px]" />
				</div>
				<div
					class="pointer-events-none absolute inset-x-0 bottom-0 flex items-end bg-gradient-to-t from-[oklch(0.1_0_0_/_0.85)] to-transparent px-5 pt-10 pb-3.5 font-mono text-[10px] tracking-[0.1em] text-white/75"
				>
					<span class="flex items-center gap-1.5">
						<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
							></path>
						</svg>
						<span data-edit="home.projects.ansys.nda-label">{c("home.projects.ansys.nda-label")}</span>
					</span>
				</div>
			</MediaFrame>
		</div>

		<!-- 03 · Personal Projects -->
		<a
			href="/projects/personal"
			class="group border-border/50 hover:bg-foreground/[0.02] grid grid-cols-1 items-center gap-12 border-t border-b py-10 transition-colors lg:[grid-template-columns:minmax(0,7fr)_minmax(0,5fr)]"
		>
			<div>
				<div class="flex items-baseline gap-3.5 font-mono text-[11px] tracking-[0.12em]">
					<span class="text-accent-work" data-edit="home.projects.personal.index"
						>{c("home.projects.personal.index")}</span
					>
					<span class="text-muted-foreground" data-edit="home.projects.personal.eyebrow"
						>{c("home.projects.personal.eyebrow")}</span
					>
				</div>
				<h3
					class="text-foreground mt-3.5 text-[clamp(28px,4vw,40px)] leading-[1.05] font-bold tracking-[-0.025em]"
					data-edit="home.projects.personal.title"
				>
					{c("home.projects.personal.title")}
				</h3>
				<p
					class="text-muted-foreground mt-4 text-base leading-[1.65] text-pretty"
					data-edit="home.projects.personal.description"
				>
					{c("home.projects.personal.description")}
				</p>
			</div>

			<div class="flex items-center justify-end gap-6">
				<div class="flex flex-wrap justify-end gap-2" data-edit-list="home.projects.personal.tags">
					{#each cList("home.projects.personal.tags") as t, i}
						<span data-edit-item={i}><Tag label={t} /></span>
					{/each}
				</div>
				<span
					class="border-border/70 text-foreground flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border"
					aria-hidden="true"
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M17 8l4 4m0 0l-4 4m4-4H3"
						></path>
					</svg>
				</span>
			</div>
		</a>

		<div class="mt-12 text-center">
			<p class="text-muted-foreground mx-auto max-w-2xl text-sm" data-edit="home.projects.footnote">
				{c("home.projects.footnote")}
			</p>
		</div>
	</div>
</section>

<style>
	/*
		Draw the "View the case study" scribble on hover of the WHOLE card, not
		only the link itself. LineHoverLink only triggers the draw on the link's
		own :hover; replicate its drawn state (stroke-dashoffset: 0 — see the
		component's own `:hover .link-hover__graphic--stroke path` rule) under the
		card's group-hover. The path keeps the component's 0.6s transition.
	*/
	:global(.group\/card:hover .link-hover__graphic--scribble path) {
		stroke-dashoffset: 0;
	}
</style>
