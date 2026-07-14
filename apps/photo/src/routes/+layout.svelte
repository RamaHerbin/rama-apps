<script lang="ts">
	import './layout.css';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import BootLoader from '$lib/components/BootLoader.svelte';
	import { page } from '$app/state';

	let { data, children } = $props();

	let bootActive = $state(false);

	// The home route is a full-bleed, corner-pinned "editorial stage"
	// (see routes/+page.svelte) with its own <header>/nav and bottom-strip
	// <footer> baked into the page — it intentionally replaces the global
	// chrome instead of nesting inside it, so every other route keeps the
	// standard Header/Footer wrapper unchanged.
	let isImmersiveHome = $derived(page.url.pathname === '/');
</script>

<BootLoader images={data.bootImages} bind:active={bootActive} />

{#if isImmersiveHome}
	<div inert={bootActive}>
		{@render children()}
	</div>
{:else}
	<div class="flex min-h-screen flex-col" inert={bootActive}>
		<Header siteTitle={data.site.title} />
		<main class="flex-1 pt-16">
			{@render children()}
		</main>
		<Footer author={data.site.author} socials={data.site.socials} />
	</div>
{/if}
