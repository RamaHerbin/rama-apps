<script lang="ts">
	import { ImageTrailCursor } from "fancy-ui-svelte";

	const images = [
		"/portfolio/IMG_0318.jpg",
		"/portfolio/20160624.jpg",
		"/portfolio/DSCF0385-ed.jpg",
		"/portfolio/DSCF0404.jpg",
		"/portfolio/DSCF0501test.webp",
		"/portfolio/DSCF0548test.webp",
		"/portfolio/DSCF0703test2_1.webp",
	];
</script>

<svelte:head>
	<title>Rama — Photography</title>
	<meta name="description" content="Photography by Rama Herbin" />
	<meta property="og:title" content="Rama — Photography" />
	<meta property="og:description" content="Photography by Rama Herbin" />
	<meta property="og:url" content="https://photo.rama.app" />
</svelte:head>

<div class="relative h-screen w-screen overflow-hidden bg-black">
	<!-- ImageTrailCursor fullscreen hero -->
	<div class="absolute inset-0 z-10">
		<ImageTrailCursor {images} variant="type7" />
	</div>

	<!-- Subtle instruction -->
	<div class="pointer-events-none relative z-20 flex h-full items-end justify-center pb-12">
		<span class="text-white/20 text-xs tracking-[0.2em] uppercase select-none animate-pulse">
			Move your cursor
		</span>
	</div>

	<!-- Minimal top bar -->
	<header
		class="pointer-events-none absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-8 py-6"
	>
		<span class="text-white/50 text-xs tracking-[0.3em] uppercase select-none">photo.rama.app</span>
		<span class="text-white/30 text-xs tracking-wider select-none">2025</span>
	</header>
</div>
