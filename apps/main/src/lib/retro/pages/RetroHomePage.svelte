<script lang="ts">
	/**
	 * Retro-OS — the home page (`/`).
	 *
	 * Nothing but an ORDER. Every slab below is self-contained: the sections take
	 * no props and read their own content keys, so this file owns exactly two
	 * decisions — which sections exist and in which sequence they stack — and the
	 * page shell they stack inside. That is deliberate: a home page whose file is
	 * a list is a home page you can re-order without reading it.
	 *
	 * THE SHELL
	 * `28px 32px 64px` padding on a `min(1120px, …)` rail with a 26px column gap,
	 * straight from portfolio-home.dc.html's two outer divs. The horizontal
	 * padding is the only value that gives on a phone (16px under 640px) — the
	 * 2px rules and hard offset shadows never scale, so the windows would lose
	 * their frame to the viewport edge instead. Same shell the three case pages
	 * carry; it is repeated per page rather than hoisted into the routes because
	 * the routes must stay a pure seam (see src/routes/retro.css).
	 *
	 * WHY NO <main>
	 * The standard tree's `+page.svelte` keeps its own `<main>`, and both trees
	 * are in the DOM at once — only one is `display: none`. Two `<main>` elements
	 * in one document is a landmark violation that no CSS can hide, so the retro
	 * tree stays a plain div stack and lets the standard tree own the landmark.
	 *
	 * SECTION NUMBERING (01–07) lives in each section, not here: the index is part
	 * of what a section IS in this design (it is printed in its own titlebar), not
	 * something the page assigns.
	 */
	import { HeaderBar, RetroFooter } from "$lib/retro/index.js";
	import RetroHero from "../sections/RetroHero.svelte";
	import RetroTrusted from "../sections/RetroTrusted.svelte";
	import RetroAbout from "../sections/RetroAbout.svelte";
	import RetroWork from "../sections/RetroWork.svelte";
	import RetroTestimonials from "../sections/RetroTestimonials.svelte";
	import RetroBeyondCode from "../sections/RetroBeyondCode.svelte";
	import RetroGear from "../sections/RetroGear.svelte";
	import RetroConnect from "../sections/RetroConnect.svelte";
</script>

<!-- `bg-[var(--r-canvas)]` is belt-and-braces: skins.css already resolves
     `--background` to the same cream for this skin, so <body> is painted before
     this element exists. It is stated anyway because the mockup states it on
     <body>, and because the token that paints the page should be readable from
     the page that claims it rather than inferred two files away. -->
<div class="min-h-screen bg-[var(--r-canvas)] px-4 pt-7 pb-16 text-[var(--r-ink)] sm:px-8">
	<div class="mx-auto flex w-full max-w-[1120px] flex-col gap-[26px]">
		<HeaderBar />

		<RetroHero />

		<RetroTrusted />
		<RetroAbout />
		<RetroWork />
		<RetroTestimonials />
		<RetroBeyondCode />
		<RetroGear />
		<RetroConnect />

		<RetroFooter variant="home" />
	</div>
</div>
