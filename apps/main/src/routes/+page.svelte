<script lang="ts">
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
	} from "$lib/portfolio/index.js";
</script>

<svelte:head>
	<title>Rama Herbin - Front-End & UI Engineer</title>
	<meta
		name="description"
		content="Rama Herbin - Front-End & UI Engineer at Ansys (Synopsys Inc). Portfolio showcasing web development, photography, and creative work."
	/>
</svelte:head>

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
