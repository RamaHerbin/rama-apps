<script lang="ts">
	import './layout.css';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';

	let { data, children } = $props();
</script>

<div class="flex min-h-screen flex-col">
	<Header siteTitle={data.site.title} />
	<main class="flex-1 pt-16">
		{@render children()}
	</main>
	<Footer author={data.site.author} socials={data.site.socials} />
</div>
