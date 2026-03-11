<script lang="ts">
	import { BlurReveal } from 'fancy-ui';
	import CollectionCard from '$lib/components/CollectionCard.svelte';
	import SEOHead from '$lib/components/SEOHead.svelte';

	let { data } = $props();
</script>

<SEOHead
	title="Collections — {data.site.title}"
	description="Browse photo collections"
	url="{data.site.url}/collections"
/>

<section class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
	<BlurReveal>
		<h1 class="text-3xl font-bold">Collections</h1>
		<p class="mt-2 text-muted-foreground">Curated sets of photographs</p>
	</BlurReveal>

	{#if data.collections.length === 0}
		<div class="flex min-h-[40vh] items-center justify-center">
			<p class="text-lg text-muted-foreground">No collections yet.</p>
		</div>
	{:else}
		<div class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.collections as { collection, coverPhoto, photoCount }}
				<CollectionCard {collection} {coverPhoto} {photoCount} />
			{/each}
		</div>
	{/if}
</section>
