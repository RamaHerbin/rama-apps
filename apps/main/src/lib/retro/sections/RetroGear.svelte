<script lang="ts">
	/**
	 * 06 MY GEAR — three inventory cards, one per discipline.
	 *
	 * Mirrors the gear half of `portfolio/sections/Passions.svelte`: same three
	 * `home.passions.gear.*` groups, same `data-edit-list` / `data-edit-item`
	 * shape on the item rows. The std section renders them as a <ul>; here they
	 * are mono "· item" lines, which is what the mockup draws — a config file
	 * listing, not prose.
	 */
	import { c, cList } from "$lib/content/index.js";
	import { RetroCard, IconTile, SectionWindow } from "$lib/retro";

	/**
	 * Keys are spelled out per group rather than built from a namespace so every
	 * content key in this file is greppable as a literal string.
	 * The glyphs are decorative monograms (CONTRACTS §3), hence props not content.
	 */
	const GEAR = [
		{
			glyph: "</>",
			titleKey: "home.passions.gear.development.title",
			itemsKey: "home.passions.gear.development.items",
		},
		{
			glyph: "PH",
			titleKey: "home.passions.gear.photography.title",
			itemsKey: "home.passions.gear.photography.items",
		},
		{
			glyph: "MU",
			titleKey: "home.passions.gear.music.title",
			itemsKey: "home.passions.gear.music.items",
		},
	];
</script>

<SectionWindow
	index="06"
	titleKey="home.passions.gear.title"
	dosKey="retro.window.gear.dos"
	captionKey="home.passions.gear.subtitle"
	accent="rust"
>
	<div class="grid grid-cols-1 gap-5 px-6 pt-5 pb-[26px] lg:grid-cols-3">
		{#each GEAR as group (group.titleKey)}
			<!-- 18px/20px padding is the mockup's, one notch tighter than the card
			     default; it has to be inline because RetroCard's own scoped rule
			     outranks a Tailwind padding utility (see retro.css cascade note). -->
			<RetroCard style="padding: 18px 20px;">
				<div class="flex items-center gap-[10px]">
					<IconTile glyph={group.glyph} bg="var(--r-paper)" size={30} />
					<span class="text-[15.5px] font-bold" data-edit={group.titleKey}
						>{c(group.titleKey)}</span
					>
				</div>

				<div class="flex flex-col gap-[7px]" data-edit-list={group.itemsKey}>
					{#each cList(group.itemsKey) as item, i}
						<!-- the bullet sits OUTSIDE the edit target so the element's
						     textContent round-trips as exactly the content value -->
						<span class="r-mono text-[12px]">· <span data-edit-item={i}>{item}</span></span>
					{/each}
				</div>
			</RetroCard>
		{/each}
	</div>
</SectionWindow>
