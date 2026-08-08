<script lang="ts">
	/**
	 * Personal-projects card — the only card in the skin whose hover shadow takes a
	 * COLOUR instead of ink. Six of them tile the perso page's one section window,
	 * and each owns an accent, so the grid reads as six different things rather
	 * than six copies of a card; the accent lift is what says so on contact.
	 *
	 * The shell is `RetroCard` (grammar D: 2px ink, 3px shadow, 20px padding,
	 * column gap 12) — it already implements the accent lift, so this file is only
	 * the card's ANATOMY: header row, paragraph, tag row, dashed link footer.
	 *
	 * `bg` is the card's PALE, not its surface. The surface is always paper; the
	 * pale is the wash shared by the icon tile and the tag pills, and it is passed
	 * in rather than derived from `accent` for the same reason HeroTitleBar takes
	 * its tint: the page pairs them by hand and the atom must not out-guess it.
	 */
	import { c, cList } from "$lib/content/index.js";
	import type { Accent } from "../index.js";
	import RetroCard from "../windows/RetroCard.svelte";
	import IconTile from "../atoms/IconTile.svelte";
	import StatusPill from "../atoms/StatusPill.svelte";
	import RetroTag from "../atoms/RetroTag.svelte";
	import RetroButton from "../atoms/RetroButton.svelte";

	interface ProjectLink {
		/** content key for the visible label */
		labelKey: string;
		/** content key holding the URL — editable through the link popover */
		hrefKey?: string;
		/** literal URL, for a target the content layer does not own (the 2023 PDF) */
		href?: string;
		/** "primary" = the gold key, at most one per card */
		variant?: "primary" | "outline";
	}

	interface Props {
		/** pixel monogram — UI / HDR / 2K25 / BLG / PDF / LAB. Decorative, never content */
		glyph: string;
		/** the card's accent: recolours the hover shadow */
		accent: Accent;
		/** the card's pale wash — fills the icon tile and the tag pills */
		bg: string;
		titleKey: string;
		descKey: string;
		/** content key for the `string[]` tag row */
		tagsKey: string;
		/** content key for the status stamp; the pill is dropped when it resolves to nothing */
		statusKey?: string;
		/** status fill — the pill's meaning is its colour, so it is required alongside statusKey */
		statusBg?: string;
		/** content key for the muted aside in the link footer ("You're viewing it!") */
		noteKey?: string;
		links?: ProjectLink[];
	}

	let {
		glyph,
		accent,
		bg,
		titleKey,
		descKey,
		tagsKey,
		statusKey,
		statusBg,
		noteKey,
		links = []
	}: Props = $props();

	// A missing key makes c() return the key itself (EDIT-CONTRACT §2), which as a
	// 9px pixel stamp would read as debug output on the page. Two of the six cards
	// are specified to carry a status whose key does not exist in site-content.json
	// yet (fancyui "Open source", archive "2023"), and inventing content is not
	// ours to do — so the pill is wired at the call site and simply does not paint
	// until the key lands. The console.warn from c() is the signal that it hasn't.
	const statusText = $derived(statusKey ? c(statusKey) : undefined);
	const showStatus = $derived(
		statusKey !== undefined && statusBg !== undefined && statusText !== statusKey
	);
	// Narrowed here rather than asserted in the markup: template expressions are
	// plain JS, so a `!` there would not survive the compiler.
	const statusFill = $derived(statusBg ?? "var(--r-paper)");

	const hasFooter = $derived(links.length > 0 || noteKey !== undefined);
</script>

<RetroCard {accent}>
	<div class="flex items-center gap-3">
		<IconTile {glyph} {bg} class="text-[10px]" />
		<h3 class="min-w-0 flex-1 text-[18px] font-black" data-edit={titleKey}>{c(titleKey)}</h3>
		{#if showStatus}
			<StatusPill bg={statusFill} class="flex-none" data-edit={statusKey}>{statusText}</StatusPill>
		{/if}
	</div>

	<!-- flex-1: the paragraph is the card's spring, so six cards of unequal copy
	     still line their dashed footers up across a row of the grid.
	     Text is kept flush against the tags here and everywhere in this tree: the
	     edit runtime commits an element's raw textContent, so the indentation of a
	     pretty-printed expression would be saved into the content file. -->
	<p
		class="flex-1 text-[13.5px] leading-[1.6] text-[var(--r-prose)]"
		data-edit={descKey}
	>{c(descKey)}</p>

	<div class="flex flex-wrap gap-2" data-edit-list={tagsKey}>
		{#each cList(tagsKey) as tag, i (i)}
			<RetroTag {bg} data-edit-item={i}>{tag}</RetroTag>
		{/each}
	</div>

	{#if hasFooter}
		<div class="r-dashed-top flex flex-wrap items-center gap-3 pt-3">
			{#each links as link (link.labelKey)}
				<!-- Label and URL are edited together in one popover, so BOTH attributes
				     sit on the <a> RetroButton renders (EDIT-CONTRACT §3). The archive
				     link passes no hrefKey — its target is a static asset, not content —
				     and then the label is edited inline like any other text. -->
				<RetroButton
					href={link.hrefKey ? c(link.hrefKey) : link.href}
					external
					size="sm"
					variant={link.variant ?? "outline"}
					data-edit={link.labelKey}
					data-edit-href={link.hrefKey}>{c(link.labelKey)}</RetroButton
				>
			{/each}

			{#if noteKey}
				<span class="r-mono text-[11px] text-[var(--r-muted)]" data-edit={noteKey}
					>{c(noteKey)}</span
				>
			{/if}
		</div>
	{/if}
</RetroCard>
