<script lang="ts">
	/**
	 * Case-page header bar: RH tile (→ home) · title + breadcrumb · BACK · SkinSwitch.
	 *
	 * Same shell as the home `HeaderBar` (2px ink, paper, 4px shadow, 14/20 padding);
	 * what the case pages add is the breadcrumb and the BACK affordance, and what
	 * they parameterise is the page accent — it tints the active crumb and the tile's
	 * hover, so the header states which case you are inside without a word.
	 */
	import { c } from "$lib/content/index.js";
	import { accentVar, type Accent } from "../index.js";
	import RetroButton from "../atoms/RetroButton.svelte";
	import SkinSwitch from "./SkinSwitch.svelte";

	interface Crumb {
		/** content key for the segment label, e.g. "bnf.hero.eyebrow.breadcrumb-label" */
		labelKey: string;
		/** omit on the last (active) segment — it is the page you are on */
		href?: string;
	}

	interface Props {
		/** page accent: tints the active crumb and the logo tile's hover */
		accent: Accent;
		/** ordered segments, first → last; the last one is rendered as active */
		crumbs: Crumb[];
		/** where ← BACK goes (parent case, or home) */
		backHref: string;
	}

	let { accent, crumbs, backHref }: Props = $props();

	/** See HeaderBar: key-driven wordmark with a literal fallback. */
	const TILE_KEY = "retro.header.tile";
	const tile = $derived(c(TILE_KEY) === TILE_KEY ? "RH" : c(TILE_KEY));

	const lastIndex = $derived(crumbs.length - 1);
</script>

<header
	class="r-border r-shadow-4 flex flex-wrap items-center gap-4 bg-[var(--r-paper)] px-5 py-[14px]"
	style="--r-case-accent: {accentVar(accent)}"
>
	<a
		href="/"
		class="r-tile r-pixel inline-flex h-11 w-11 flex-none items-center justify-center bg-[var(--r-ink)] text-[14px] text-[var(--r-paper)]"
		aria-label="Rama Herbin — home"
		data-edit={TILE_KEY}>{tile}</a
	>

	<div class="flex min-w-0 flex-1 flex-col gap-[5px]">
		<span
			class="text-[clamp(15px,3.6vw,22px)] leading-tight font-black tracking-[-0.3px]"
			data-edit="retro.header.title">{c("retro.header.title")}</span
		>

		<nav aria-label="Breadcrumb">
			<ol
				class="r-mono flex flex-wrap items-center text-[11px] font-semibold tracking-[1px] text-[var(--r-muted)]"
			>
				{#each crumbs as crumb, i (crumb.labelKey)}
					<!-- Middle segments collapse on narrow screens: the first crumb and the
					     one you are on are the two that carry orientation. -->
					<li class="flex items-center" class:r-crumb-mid={i > 0 && i < lastIndex}>
						{#if i > 0}
							<span class="px-1.5" aria-hidden="true">/</span>
						{/if}
						{#if crumb.href && i < lastIndex}
							<a class="r-crumb-link" href={crumb.href} data-edit={crumb.labelKey}
								>{c(crumb.labelKey)}</a
							>
						{:else}
							<span
								class:r-crumb-active={i === lastIndex}
								aria-current={i === lastIndex ? "page" : undefined}
								data-edit={crumb.labelKey}>{c(crumb.labelKey)}</span
							>
						{/if}
					</li>
				{/each}
			</ol>
		</nav>
	</div>

	<RetroButton href={backHref} size="sm" variant="outline" data-edit="retro.case.back"
		>{c("retro.case.back")}</RetroButton
	>

	<SkinSwitch />
</header>

<style>
	/* The tile is the one element that takes the page accent on hover — text stays
	   paper, so the swap reads as the plate being lit rather than re-coloured. */
	@media (hover: hover) {
		.r-tile:hover {
			background: var(--r-case-accent);
		}
	}

	.r-crumb-link:hover {
		color: var(--r-ink);
	}

	.r-crumb-active {
		color: var(--r-case-accent);
		font-weight: 700;
	}

	@media (max-width: 639px) {
		.r-crumb-mid {
			display: none;
		}
	}
</style>
