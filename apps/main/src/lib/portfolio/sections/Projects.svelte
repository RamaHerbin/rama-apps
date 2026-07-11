<script lang="ts">
	import { SectionLabel, Tag, MediaFrame } from "$lib/portfolio/work/index.js";
</script>

<section id="projects" class="px-6 py-20">
	<div class="mx-auto max-w-6xl">
		<SectionLabel label="SELECTED WORK" counter="03 PROJECTS" class="mb-6" />

		<div
			class="mb-16 grid grid-cols-1 items-end gap-12 lg:[grid-template-columns:minmax(0,7fr)_minmax(0,5fr)]"
		>
			<h2 class="text-foreground text-[clamp(40px,7vw,56px)] leading-none font-[750] tracking-[-0.03em]">
				Selected Work
			</h2>
			<p class="text-muted-foreground text-[17px] leading-[1.6] text-pretty">
				Creative applications, cultural experiences and professional work — some shown through
				video demos where confidentiality applies.
			</p>
		</div>

		<!-- 01 · Fleur de Papier — links to the case study -->
		<a
			href="/projects/fleur-de-papier"
			class="group border-border/50 hover:bg-foreground/[0.02] grid grid-cols-1 items-center gap-12 border-t py-10 transition-colors lg:[grid-template-columns:minmax(0,7fr)_minmax(0,5fr)]"
		>
			<MediaFrame aspect="16 / 10">
				<img
					src="/videos/fleur-de-papier/bnf-richelieu-poster.jpg"
					alt=""
					class="absolute inset-0 h-full w-full object-cover"
					loading="lazy"
				/>
				<div
					class="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-[oklch(0.1_0_0_/_0.85)] to-transparent px-5 pt-10 pb-3.5 font-mono text-[10px] tracking-[0.1em] text-white/75"
				>
					<span>6 PRODUCTIONS &middot; VIDEO DEMOS</span>
					<span class="flex items-center gap-1.5">
						<span class="bg-accent-work h-1.5 w-1.5 rounded-full" aria-hidden="true"></span>
						CASE 01
					</span>
				</div>
			</MediaFrame>

			<div>
				<div class="flex items-baseline gap-3.5 font-mono text-[11px] tracking-[0.12em]">
					<span class="text-accent-work">01</span>
					<span class="text-muted-foreground">FLEUR DE PAPIER &mdash; CULTURAL MEDIATION AGENCY</span>
				</div>
				<h3
					class="text-foreground mt-3.5 text-[clamp(28px,4vw,40px)] leading-[1.05] font-bold tracking-[-0.025em]"
				>
					Cultural Applications
				</h3>
				<p class="text-muted-foreground mt-4 text-base leading-[1.65] text-pretty">
					Interactive experiences for the BnF Richelieu, La Contemporaine, L'Atrium de Rouen and
					more &mdash; touch installations, editorial web apps and an interactive comic, all
					demonstrated on video.
				</p>
				<div class="mt-[18px] flex flex-wrap gap-2">
					<Tag label="Vue 3" />
					<Tag label="Nuxt" />
					<Tag label="GSAP" />
					<Tag label="Creative Dev" />
				</div>
				<span
					class="text-foreground group-hover:border-foreground border-border mt-6 inline-flex items-center gap-2.5 border-b pb-1 text-[15px] font-semibold transition-colors"
				>
					View the case study
					<span class="text-accent-work" aria-hidden="true">&rarr;</span>
				</span>
			</div>
		</a>

		<!-- 02 · Ansys — confidential, not a link -->
		<div
			class="border-border/50 hover:bg-foreground/[0.02] grid grid-cols-1 items-center gap-12 border-t py-10 transition-colors lg:[grid-template-columns:minmax(0,7fr)_minmax(0,5fr)]"
		>
			<div>
				<div class="flex items-baseline gap-3.5 font-mono text-[11px] tracking-[0.12em]">
					<span class="text-accent-work">02</span>
					<span class="text-muted-foreground">ANSYS &mdash; SYNOPSYS INC. &middot; CURRENT</span>
				</div>
				<h3
					class="text-foreground mt-3.5 text-[clamp(28px,4vw,40px)] leading-[1.05] font-bold tracking-[-0.025em]"
				>
					Digital Safety Manager
				</h3>
				<p class="text-muted-foreground mt-4 text-base leading-[1.65] text-pretty">
					Enterprise-scale safety applications built with Angular &mdash; UI/UX for safety
					engineers planning, executing and monitoring safety cases.
				</p>
				<div class="mt-[18px] flex flex-wrap gap-2">
					<Tag label="Angular" />
					<Tag label="TypeScript" />
					<Tag label="Enterprise" />
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
					<span>Confidential project &mdash; no public visuals</span>
				</div>
			</div>

			<div
				class="border-border/60 bg-surface-raised relative overflow-hidden rounded-[14px] border bg-[repeating-linear-gradient(-45deg,transparent,transparent_12px,var(--color-border)_12px,var(--color-border)_24px)]"
			>
				<div class="flex aspect-[16/10] flex-col items-center justify-center gap-3.5">
					<svg
						class="text-muted-foreground h-7 w-7"
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
					<span class="text-muted-foreground font-mono text-[11px] tracking-[0.16em]">
						DETAILS UNDER NDA
					</span>
				</div>
			</div>
		</div>

		<!-- 03 · Personal Projects -->
		<a
			href="/projects/personal"
			class="group border-border/50 hover:bg-foreground/[0.02] grid grid-cols-1 items-center gap-12 border-t border-b py-10 transition-colors lg:[grid-template-columns:minmax(0,7fr)_minmax(0,5fr)]"
		>
			<div>
				<div class="flex items-baseline gap-3.5 font-mono text-[11px] tracking-[0.12em]">
					<span class="text-accent-work">03</span>
					<span class="text-muted-foreground">SIDE PROJECTS &amp; EXPERIMENTS</span>
				</div>
				<h3
					class="text-foreground mt-3.5 text-[clamp(28px,4vw,40px)] leading-[1.05] font-bold tracking-[-0.025em]"
				>
					Personal Projects
				</h3>
				<p class="text-muted-foreground mt-4 text-base leading-[1.65] text-pretty">
					Portfolio iterations, a blog platform and creative experiments &mdash; exploring new
					technologies and design patterns.
				</p>
			</div>

			<div class="flex items-center justify-end gap-6">
				<div class="flex flex-wrap justify-end gap-2">
					<Tag label="Vue" />
					<Tag label="Nuxt" />
					<Tag label="Blog" />
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
			<p class="text-muted-foreground mx-auto max-w-2xl text-sm">
				Some projects are presented through video demonstrations due to confidentiality agreements
				and client privacy requirements.
			</p>
		</div>
	</div>
</section>
