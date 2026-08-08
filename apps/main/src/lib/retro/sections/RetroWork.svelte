<script lang="ts">
	/**
	 * 03 SELECTED WORK — the retro port of `$lib/portfolio/sections/Projects.svelte`.
	 *
	 * The standard section stacks three full-width rows with poster media; the
	 * mockup files the same three projects as a 3-up card shelf, so the port
	 * keeps the CONTENT (`home.projects.{ansys,fdp,personal}.*`, verbatim keys)
	 * and takes the LAYOUT from the mockup.
	 *
	 * The card list is a local table rather than three hand-written cards: the
	 * three differ only in which keys they read and which accent they carry, and
	 * a table makes that the visible fact. Everything in it is either a content
	 * KEY or a decorative prop (glyph, accent, route) — no visible string is
	 * spelled here.
	 */
	import { c, cList } from "$lib/content/index.js";
	import {
		accentTint,
		Chip,
		IconTile,
		RetroButton,
		RetroCard,
		RetroTag,
		SectionWindow
	} from "$lib/retro";
	import type { Accent } from "$lib/retro";

	interface Work {
		/** pixel monogram in the icon tile — decorative, never content */
		glyph: string;
		/** drives the hover shadow, the icon tile fill and the tag fills */
		accent: Accent;
		titleKey: string;
		/** the standard section's eyebrow, set as the card's organisation line */
		orgKey: string;
		descKey: string;
		tagsKey: string;
		/** mono line above the footer, on a dashed rule. Omitted where no key exists. */
		footKey?: string;
		/** hardcoded route + content key for its label, like the standard section's CTA */
		cta?: { href: string; labelKey: string };
		/** dashed "not a link" badge, mutually exclusive with `cta` */
		ndaKey?: string;
	}

	const works: Work[] = [
		{
			glyph: "W",
			accent: "gold",
			titleKey: "home.projects.ansys.title",
			orgKey: "home.projects.ansys.eyebrow",
			descKey: "home.projects.ansys.description",
			tagsKey: "home.projects.ansys.tags",
			footKey: "home.projects.ansys.confidential-note",
			ndaKey: "home.projects.ansys.nda-label"
		},
		{
			glyph: "C",
			accent: "blue",
			titleKey: "home.projects.fdp.title",
			orgKey: "home.projects.fdp.eyebrow",
			descKey: "home.projects.fdp.description",
			tagsKey: "home.projects.fdp.tags",
			footKey: "home.projects.fdp.caption",
			cta: { href: "/projects/fleur-de-papier", labelKey: "home.projects.fdp.cta" }
		},
		{
			glyph: "P",
			accent: "green",
			titleKey: "home.projects.personal.title",
			orgKey: "home.projects.personal.eyebrow",
			descKey: "home.projects.personal.description",
			tagsKey: "home.projects.personal.tags",
			cta: { href: "/projects/personal", labelKey: "retro.work.personal.cta" }
		}
	];
</script>

<!-- `retro-projects`, not `retro-work`: this is the retro tree's counterpart to
     the standard tree's `#projects`, and three call sites already link to it —
     both case pages' breadcrumb and BACK targets (`/#retro-projects`). The
     prerenderer treats a link to a missing id as a build error, so the anchor
     name is a contract, not a label. -->
<SectionWindow
	id="retro-projects"
	index="03"
	titleKey="home.projects.title"
	dosKey="retro.window.work.dos"
	accent="gold"
	captionKey="home.projects.intro"
>
	<div class="grid gap-5 px-6 pt-5 pb-5 lg:grid-cols-3">
		{#each works as w (w.titleKey)}
			<!-- The card is NOT a link: two of the three have nowhere to go, and the
			     one route that exists is carried by the key at the bottom — same
			     division as the mockup. `accent` only recolours the hover shadow. -->
			<RetroCard accent={w.accent}>
				<div class="flex items-center gap-3">
					<IconTile glyph={w.glyph} size={38} bg={accentTint(w.accent)} />
					<span class="text-[16.5px] font-bold" data-edit={w.titleKey}>{c(w.titleKey)}</span>
				</div>

				<div class="text-[13.5px] font-bold" data-edit={w.orgKey}>{c(w.orgKey)}</div>

				<!-- flex-1 is what lines the three footers up: the description absorbs
				     the height difference instead of the cards ending ragged. -->
				<p class="flex-1 text-[13px] leading-[1.55] text-[var(--r-prose)]" data-edit={w.descKey}>
					{c(w.descKey)}
				</p>

				<div class="flex flex-wrap gap-2" data-edit-list={w.tagsKey}>
					{#each cList(w.tagsKey) as tag, i (i)}
						<RetroTag bg={accentTint(w.accent)} data-edit-item={i}>{tag}</RetroTag>
					{/each}
				</div>

				{#if w.footKey}
					<div
						class="r-dashed-top r-mono pt-[10px] text-[11px] text-[var(--r-muted)]"
						data-edit={w.footKey}
					>
						{c(w.footKey)}
					</div>
				{/if}

				{#if w.cta}
					<!-- href is a route, not content, so it carries no data-edit-href;
					     the label lives in a nested span so its textContent still
					     round-trips (EDIT-CONTRACT §3) — the same shape the standard
					     section uses for this exact link. -->
					<RetroButton href={w.cta.href} variant="primary" size="sm" class="uppercase">
						<span data-edit={w.cta.labelKey}>{c(w.cta.labelKey)}</span>
					</RetroButton>
				{/if}

				{#if w.ndaKey}
					<Chip
						tone="tint"
						bg={accentTint("gold")}
						dashed
						class="r-pixel justify-center px-[12px] py-[7px] text-[9px]"
						data-edit={w.ndaKey}>{c(w.ndaKey)}</Chip
					>
				{/if}
			</RetroCard>
		{/each}
	</div>

	<!-- The mockup has no footnote row; the standard section does, and dropping
	     the confidentiality note would drop content rather than restyle it. It
	     lands as a dashed-rule credit line, the same device the cards use. -->
	<div class="px-6 pb-[26px]">
		<p
			class="r-dashed-top r-mono pt-3 text-center text-[11px] leading-[1.6] text-[var(--r-muted)]"
			data-edit="home.projects.footnote"
		>
			{c("home.projects.footnote")}
		</p>
	</div>
</SectionWindow>
