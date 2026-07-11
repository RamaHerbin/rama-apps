<script lang="ts">
	import './layout.css';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import BootLoader from '$lib/components/BootLoader.svelte';

	let { data, children } = $props();

	let bootActive = $state(false);
</script>

<BootLoader images={data.bootImages} bind:active={bootActive} />

<div class="flex min-h-screen flex-col" inert={bootActive}>
	<Header siteTitle={data.site.title} />
	<main class="flex-1 pt-16">
		{@render children()}
	</main>
	<Footer author={data.site.author} socials={data.site.socials} />
</div>
