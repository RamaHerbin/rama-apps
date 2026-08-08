<script lang="ts">
	/**
	 * Home hero — grammar B: the notched frame, on graph paper, closed by a status
	 * strip.
	 *
	 * Content is the std `portfolio/sections/Hero.svelte` verbatim (same
	 * `home.hero.*` keys, same split-span structure around the Ansys link so the
	 * two trees are edited through one set of keys). Everything else is different:
	 * where the std hero is a full-viewport stage with a fluid canvas behind it,
	 * this one is a bordered slab that sits in the page flow like every other
	 * window — the chassis IS the art direction, so it takes no viewport height it
	 * hasn't earned.
	 *
	 * Three rows, per the mockup: a chrome line (version chip · STATUS lamp), the
	 * centred name block, and the status strip. The strip's left half is the
	 * standing facts (where, what) and its right half is the credit, which is why
	 * it is written as two groups rather than the mockup's flat row with a
	 * flex-spacer: two groups wrap as two units on a narrow screen instead of
	 * breaking mid-sentence.
	 */
	import { c } from "$lib/content/index.js";
	import { Chip, Led, NotchedFrame, RetroButton } from "$lib/retro";

	/**
	 * The eight decorative pixels flanking the name, transcribed from the mockup.
	 *
	 * They are anchored to whichever edge they hug (not to a centre) so the
	 * scatter keeps its distance from the frame at every width, and they are
	 * `aria-hidden` confetti: no key, no meaning. SPEC-HOME hides them under `md`,
	 * where the frame is too narrow for anything to sit beside the H1.
	 *
	 * Positions are inline styles rather than Tailwind arbitrary values because
	 * they come from data — Tailwind only emits classes it can read as literal
	 * strings in the source, so `left-[{inset}px]` would compile to nothing.
	 */
	interface ScatterPixel {
		/** the frame edge the pixel is pinned to */
		edge: "left" | "right";
		/** distance from that edge, px */
		inset: number;
		/** distance from the top of the grid area, px */
		top: number;
		color: string;
	}

	const SCATTER: ScatterPixel[] = [
		{ edge: "left", inset: 36, top: 72, color: "var(--r-blue)" },
		{ edge: "left", inset: 58, top: 128, color: "var(--r-rust)" },
		{ edge: "left", inset: 74, top: 196, color: "var(--r-gold)" },
		{ edge: "left", inset: 40, top: 252, color: "var(--r-green)" },
		{ edge: "right", inset: 36, top: 80, color: "var(--r-green)" },
		{ edge: "right", inset: 62, top: 144, color: "var(--r-gold)" },
		{ edge: "right", inset: 78, top: 208, color: "var(--r-rust)" },
		{ edge: "right", inset: 44, top: 260, color: "var(--r-blue)" },
	];
</script>

<NotchedFrame shadow={5}>
	<!-- The graph paper goes on an inner element, not on NotchedFrame's paper
	     layer: that layer paints `background: var(--r-paper)` as a shorthand, which
	     would reset the `.r-grid-bg` image out of existence. Same nesting as the
	     mockup. `overflow-hidden` is what keeps the scatter inside the notches. -->
	<div class="r-grid-bg relative overflow-hidden">
		{#each SCATTER as pixel, i (i)}
			<span
				aria-hidden="true"
				class="r-border absolute hidden h-[12px] w-[12px] md:block"
				style="{pixel.edge}: {pixel.inset}px; top: {pixel.top}px; background: {pixel.color};"
			></span>
		{/each}

		<!-- Chrome line: build stamp left, running-state lamp right -->
		<div class="relative flex flex-wrap items-center justify-between gap-3 px-5 pt-4">
			<Chip class="r-mono px-[9px] py-[3px] font-bold" data-edit="home.hero.badge.version"
				>{c("home.hero.badge.version")}</Chip
			>

			<span class="r-mono inline-flex items-center gap-2 text-[11px] font-bold tracking-[1px]">
				<span data-edit="retro.hero.status">{c("retro.hero.status")}</span>
				<Led />
			</span>
		</div>

		<!-- Name block -->
		<div
			class="relative flex flex-col items-center gap-[14px] px-6 pt-10 pb-12 text-center"
		>
			<!-- The mockup's -3px tracking is written in em so it stays -3px at the
			     88px desktop size and loosens with the clamp instead of crushing the
			     name at 40px. -->
			<h1
				class="text-[clamp(2.5rem,8.5vw,5.5rem)] leading-[0.95] font-black tracking-[-0.034em]"
				data-edit="home.hero.title"
			>
				{c("home.hero.title")}
			</h1>

			<p class="text-[clamp(19px,3.4vw,26px)] font-bold" data-edit="home.hero.role">
				{c("home.hero.role")}
			</p>

			<p class="r-mono text-[14px]">
				<span data-edit="home.hero.working-at">{c("home.hero.working-at")}</span>
				<!-- Label and URL are edited together in the link popover, so BOTH
				     data-edit and data-edit-href sit on the <a> (EDIT-CONTRACT §3). The
				     mockup sets this as a <strong>; keeping the weight and dropping the
				     underline to hover is how it stays a wordmark first, link second. -->
				<a
					class="font-bold text-[var(--r-ink)] underline-offset-4 hover:text-[var(--r-rust)] hover:underline"
					href={c("home.hero.ansys.href")}
					data-edit="home.hero.ansys.label"
					data-edit-href="home.hero.ansys.href"
					target="_blank"
					rel="noopener noreferrer"
					aria-label="Open Ansys website in a new tab">{c("home.hero.ansys.label")}</a
				>
				<span data-edit="home.hero.company-part">{c("home.hero.company-part")}</span>
				<span data-edit="home.hero.parent-company">{c("home.hero.parent-company")}</span>
			</p>

			<p class="text-[14.5px] italic text-[var(--r-muted)]" data-edit="home.hero.tagline">
				{c("home.hero.tagline")}
			</p>

			<RetroButton href="#retro-connect" variant="primary" pixelGlyph class="mt-4">
				<span data-edit="home.hero.cta">{c("home.hero.cta")}</span>
			</RetroButton>
		</div>

		<!-- Status strip -->
		<div
			class="r-mono relative flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t-2 border-[var(--r-ink)] bg-[var(--r-paper)] px-5 py-[11px] text-[11.5px] font-semibold"
		>
			<div class="flex flex-wrap items-center gap-x-3 gap-y-2">
				<span
					aria-hidden="true"
					class="r-border inline-flex h-4 w-4 flex-none items-center justify-center text-[9px]"
					>◉</span
				>
				<span data-edit="retro.hero.status.location">{c("retro.hero.status.location")}</span>

				<span aria-hidden="true" class="text-[var(--r-muted)]">|</span>

				<span
					aria-hidden="true"
					class="r-border inline-flex flex-none items-center bg-[var(--r-tint-gold)] px-[5px] text-[10px]"
					>⌨</span
				>
				<span data-edit="retro.hero.status.disciplines">{c("retro.hero.status.disciplines")}</span>
			</div>

			<div class="flex flex-wrap items-center gap-x-3 gap-y-2">
				<span class="text-[var(--r-muted)]" data-edit="retro.hero.status.built-with"
					>{c("retro.hero.status.built-with")}</span
				>
				<!-- Same destination as the footer's "Made with FancyUI" — the URL key is
				     shared, only the label is this section's own. -->
				<a
					class="r-pixel r-border bg-[var(--r-paper)] px-[7px] py-[2px] text-[10px] text-[var(--r-ink)] hover:bg-[var(--r-btn)]"
					href={c("shared.footer.made-with.href")}
					data-edit="retro.hero.status.fancyui"
					data-edit-href="shared.footer.made-with.href"
					target="_blank"
					rel="noopener noreferrer">{c("retro.hero.status.fancyui")}</a
				>
			</div>
		</div>
	</div>
</NotchedFrame>
