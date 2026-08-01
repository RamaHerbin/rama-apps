<script lang="ts">
	import './layout.css';
	import { page } from '$app/state';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import BootLoader from '$lib/components/BootLoader.svelte';

	let { data, children } = $props();

	let bootActive = $state(false);

	/** The scatter home ('/') is full-bleed under the fixed header and skips the boot loader. */
	let isHome = $derived(page.url.pathname === '/');
</script>

{#if !isHome}
	<BootLoader images={data.bootImages} bind:active={bootActive} />
{/if}

<div class="flex min-h-screen flex-col" inert={bootActive}>
	<Header siteTitle={data.site.title} />
	<main class="flex-1" class:pt-16={!isHome}>
		{@render children()}
	</main>
	<Footer author={data.site.author} socials={data.site.socials} />
</div>
