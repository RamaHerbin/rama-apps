<script lang="ts">
	/**
	 * The home route is a SEAM, not a page: it renders both design trees and lets
	 * CSS pick one. src/routes/retro.css carries the whole argument for why
	 * (prerendered site + anti-FOUC IIFE ⇒ the choice has to be made in CSS before
	 * hydration); the short version is that `{#if}` here would flash the standard
	 * portfolio at every retro-os visitor.
	 *
	 * The `{#if skinState.skin !== "retro-os"}` around the standard tree is
	 * therefore NOT the switch — `[data-tree]` in retro.css is. It is a second,
	 * post-hydration cut that unmounts the standard tree's components once the
	 * client knows the skin, so their timers, observers and listeners stop running
	 * behind a `display: none` subtree. It is `!==` rather than `===` on purpose:
	 * the SSR value is always "standard", so the prerendered HTML contains the
	 * standard markup, which is what a scripting-disabled visitor keeps.
	 */
	import {
		NavAnchor,
		Hero,
		Trusted,
		About,
		Projects,
		Testimonials,
		Passions,
		Creative,
		Contact,
		Footer,
		ScrollBlurOverlay,
	} from "$lib/portfolio/index.js";
	import { createSkinState } from "$lib/stores/skin.svelte.js";
	import RetroHomePage from "$lib/retro/pages/RetroHomePage.svelte";

	const skinState = createSkinState();
</script>

{#if skinState.skin !== "retro-os"}
	<div data-tree="std">
		<NavAnchor />

		<main>
			<Hero />
			<Trusted />
			<About />
			<Projects />
			<Testimonials />
			<Passions />
			<Creative />
			<Contact />
		</main>

		<Footer />
	</div>
{/if}

<div data-tree="retro">
	<RetroHomePage />
</div>
