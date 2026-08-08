<script lang="ts">
	/**
	 * 05 BEYOND CODE — the two-card "what I do when I'm not shipping" window.
	 *
	 * Mirrors the top half of `portfolio/sections/Passions.svelte` (the std section
	 * carries BOTH this and the gear block; the gear half lives in RetroGear here,
	 * because the mockup splits them into two windows — 05 and 06).
	 *
	 * The two cards are written out rather than looped: they share a shell but not
	 * a body — one ends in a photo pair, the other in a tag row — and a loop over
	 * two items with a branch inside it is longer than the thing it replaces.
	 */
	import { c, cList } from "$lib/content/index.js";
	import { RetroCard, IconTile, RetroTag, SectionWindow, accentTint, type Accent } from "$lib/retro";

	/**
	 * The same two frames the std Passions section shows, same order, same alts.
	 * Alt text is authored here rather than in site-content because it is a
	 * description of a fixed asset, not editable copy — std does the same.
	 */
	const PHOTOS = [
		{ src: "/portfolio/DSCF0404.jpg", alt: "Mountains in Savoie, France" },
		{ src: "/portfolio/20160624.jpg", alt: "Sunset over the coast in Denmark" },
	];

	/**
	 * Music pills cycle the four accent tints so a long row reads as a spectrum
	 * rather than a block of one colour (the mockup hand-picks the same first four
	 * and then falls back to paper; cycling keeps it going for any list length).
	 */
	const TAG_ACCENTS: Accent[] = ["blue", "green", "gold", "rust"];
</script>

<SectionWindow
	index="05"
	titleKey="home.passions.title"
	dosKey="retro.window.beyond.dos"
	captionKey="home.passions.subtitle"
	accent="green"
>
	<div class="grid grid-cols-1 gap-5 px-6 pt-5 pb-[26px] md:grid-cols-2">
		<!-- Photography -->
		<RetroCard>
			<div class="flex items-center gap-3">
				<IconTile glyph="📷" bg="var(--r-tint-green)" />
				<span class="text-[16.5px] font-bold" data-edit="home.passions.photography.title"
					>{c("home.passions.photography.title")}</span
				>
			</div>

			<p
				class="text-[13px] leading-[1.6] text-[var(--r-prose)]"
				data-edit="home.passions.photography.description"
			>
				{c("home.passions.photography.description")}
			</p>

			<div class="grid grid-cols-2 gap-3">
				{#each PHOTOS as photo (photo.src)}
					<!-- fixed 130px stage, per the mockup: the pair is a contact sheet,
					     so both frames must be the same height whatever the crop -->
					<div class="r-border relative h-[130px] overflow-hidden">
						<img
							src={photo.src}
							alt={photo.alt}
							class="h-full w-full object-cover"
							loading="lazy"
						/>
					</div>
				{/each}
			</div>
		</RetroCard>

		<!-- Music & Guitar -->
		<RetroCard>
			<div class="flex items-center gap-3">
				<IconTile glyph="♪" bg="var(--r-tint-blue)" />
				<span class="text-[16.5px] font-bold" data-edit="home.passions.music.title"
					>{c("home.passions.music.title")}</span
				>
			</div>

			<p
				class="text-[13px] leading-[1.6] text-[var(--r-prose)]"
				data-edit="home.passions.music.description"
			>
				{c("home.passions.music.description")}
			</p>

			<div
				class="flex flex-wrap content-start gap-2"
				data-edit-list="home.passions.music.tags"
			>
				{#each cList("home.passions.music.tags") as tag, i}
					<RetroTag bg={accentTint(TAG_ACCENTS[i % TAG_ACCENTS.length])} data-edit-item={i}
						>{tag}</RetroTag
					>
				{/each}
			</div>
		</RetroCard>
	</div>
</SectionWindow>
