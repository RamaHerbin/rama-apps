<script lang="ts">
	/**
	 * One row of the FdP "selected productions" list: demo frame on the left, the
	 * production's dossier on the right.
	 *
	 * WHY ONE LAYOUT FOR ALL SIX
	 * The standard tree gives each production its own layout variant (`full`,
	 * `split-left`, `duo`, `slim`) because that page is an editorial scroll. This
	 * one is a file listing inside a window — six comparable entries, same shape,
	 * so `p.layout` is deliberately ignored here. Everything else in the FROZEN
	 * `Production` record is used, and every string still re-reads through `c()`
	 * (the record's own `title`/`description` were resolved at module-eval time and
	 * would not react to an edit).
	 *
	 * The per-slug tint is the only decision this component makes on its own: each
	 * production owns one wash, carried by its tag pills, so a row reads as one
	 * object rather than a stack of parts. It lives here rather than in the data
	 * because it is art direction for this skin only — `productions.ts` is frozen
	 * and shared with the standard tree.
	 */
	import { c, cList } from "$lib/content/index.js";
	import type { Production } from "$lib/portfolio/work/productions.js";
	import NumChip from "../atoms/NumChip.svelte";
	import RetroTag from "../atoms/RetroTag.svelte";
	import RetroButton from "../atoms/RetroButton.svelte";
	import StatusPill from "../atoms/StatusPill.svelte";
	import VideoFrame from "../media/VideoFrame.svelte";
	import EmptyMediaFrame from "../media/EmptyMediaFrame.svelte";

	interface Props {
		/** FROZEN record from `$lib/portfolio/work/productions` */
		production: Production;
		/** hands the production to the ROUTE's single VideoLightbox */
		onOpen: (p: Production) => void;
	}

	let { production, onOpen }: Props = $props();

	/** slug → its wash. Unknown slugs fall back to gold (SPEC-CASES §ProductionRow). */
	const TINTS: Record<string, string> = {
		"bnf-richelieu": "var(--r-tint-rust)",
		"la-contemporaine": "var(--r-tint-blue)",
		"terre-adelice": "var(--r-tint-green)",
		"atrium-de-rouen": "var(--r-tint-gold)",
		"la-contemporaine-touch": "var(--r-tint-blue)",
		"auberge-des-dauphins": "var(--r-tint-green)",
	};

	const tint = $derived(TINTS[production.slug] ?? "var(--r-tint-gold)");
	const titleKey = $derived(`productions.${production.slug}.title`);
	const descKey = $derived(`productions.${production.slug}.description`);
	const roleKey = $derived(`productions.${production.slug}.role`);
	const tagsKey = $derived(`productions.${production.slug}.tags`);
</script>

<article
	id={`retro-production-${production.index}`}
	class="r-prow r-border r-shadow-3 grid gap-6 bg-[var(--r-paper)] p-[18px]"
>
	<div>
		{#if production.video}
			{@const v = production.video}
			<VideoFrame
				poster={v.poster}
				fileLabel={`${v.fileLabel}.MP4`}
				duration={v.durationLabel}
				alt={`${c(titleKey)}, video poster`}
				onOpen={() => onOpen(production)}
			/>
		{:else}
			<EmptyMediaFrame labelKey="fdp.production-media.demo-in-preparation-chip" />
		{/if}
	</div>

	<div class="flex flex-col gap-2.5">
		<div class="flex flex-wrap items-center gap-2.5">
			<NumChip label={production.index} class="text-[11px] px-2 py-[3px]" />
			<h3 class="text-[20px] font-black" data-edit={titleKey}>{c(titleKey)}</h3>
			<!-- `featured` is true on three productions, but the chip belongs only to the
			     headline one — same rule as the std page, which renders it in the `full`
			     layout branch alone (and the mockup badges 01 only). -->
			{#if production.featured && production.layout === "full"}
				<StatusPill bg="var(--r-btn)" data-edit="fdp.production-media.featured-chip"
					>{c("fdp.production-media.featured-chip")}</StatusPill
				>
			{/if}
			{#if production.tbc}
				<StatusPill bg="var(--r-tint-gold)" data-edit="fdp.production-media.institution-tbc"
					>{c("fdp.production-media.institution-tbc")}</StatusPill
				>
			{/if}
		</div>

		<p class="flex-1 text-[13.5px] leading-[1.6] text-[var(--r-prose)]" data-edit={descKey}>
			{c(descKey)}
		</p>

		<div class="flex flex-col gap-1">
			<span
				class="r-mono text-[10px] font-bold tracking-[1px] text-[var(--r-muted)]"
				data-edit="fdp.production-media.contribution-label"
				>{c("fdp.production-media.contribution-label")}</span
			>
			<!-- Text flush against the tags: the edit runtime commits raw textContent. -->
			<span class="text-[12.5px] font-semibold" data-edit={roleKey}>{c(roleKey)}</span>
		</div>

		<div class="flex flex-wrap gap-2" data-edit-list={tagsKey}>
			{#each cList(tagsKey) as tag, i (i)}
				<RetroTag bg={tint} data-edit-item={i}>{tag}</RetroTag>
			{/each}
		</div>

		{#if production.detailHref}
			<!-- The arrow is chrome, so it sits OUTSIDE the data-edit span: that span's
			     textContent has to round-trip as exactly the content string. -->
			<RetroButton
				href={production.detailHref}
				variant="primary"
				size="sm"
				class="w-fit self-start uppercase"
			>
				<span data-edit="fdp.production-media.read-full-case"
					>{c("fdp.production-media.read-full-case")}</span
				>
				<span aria-hidden="true">→</span>
			</RetroButton>
		{/if}

		{#if production.credits?.length}
			<!-- Collaborator credits are FROZEN data, not content keys (the standard
			     page renders them raw too) — only the "CREDITS" label is editable. -->
			<div
				class="r-dashed-top r-mono flex flex-wrap items-baseline gap-x-1.5 gap-y-1 pt-2 text-[10.5px] text-[var(--r-muted)]"
			>
				<span data-edit="fdp.production-media.credits-label"
					>{c("fdp.production-media.credits-label")}</span
				>
				<span aria-hidden="true">—</span>
				{#each production.credits as cr, i (cr.url)}
					{#if i > 0}<span aria-hidden="true">·</span>{/if}
					<span>{cr.role}</span>
					<a class="r-prow-credit" href={cr.url} target="_blank" rel="noopener noreferrer"
						>{cr.name} {cr.instagram}</a
					>
				{/each}
			</div>
		{/if}
	</div>
</article>

<style>
	/* 400px is the demo frame's designed width, not a proportion — below the
	   breakpoint the frame goes full-width and the dossier drops under it. */
	@media (min-width: 1024px) {
		.r-prow {
			grid-template-columns: 400px minmax(0, 1fr);
		}
	}

	.r-prow-credit {
		color: var(--r-ink);
		font-weight: 600;
	}

	@media (hover: hover) {
		.r-prow-credit:hover {
			color: var(--r-rust);
		}
	}
</style>
