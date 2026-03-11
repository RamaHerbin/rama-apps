<script lang="ts">
	import { BlurReveal } from 'fancy-ui';
	import PhotoGrid from '$lib/components/PhotoGrid.svelte';
	import Lightbox from '$lib/components/Lightbox.svelte';
	import SEOHead from '$lib/components/SEOHead.svelte';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';

	let { data } = $props();
</script>

<SEOHead
	title="{data.collection.title} — {data.site.title}"
	description={data.collection.description || `Collection: ${data.collection.title}`}
	url="{data.site.url}/collections/{data.collection.slug}"
/>

<section class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
	<BlurReveal>
		<a href="/collections" class="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
			<ChevronLeftIcon class="h-4 w-4" />
			Back to Collections
		</a>
	</BlurReveal>

	<BlurReveal>
		<h1 class="text-3xl font-bold">{data.collection.title}</h1>
		{#if data.collection.description}
			<p class="mt-2 text-muted-foreground">{data.collection.description}</p>
		{/if}
		<p class="mt-1 text-sm text-muted-foreground">
			{data.photos.length} photo{data.photos.length !== 1 ? 's' : ''}
		</p>
	</BlurReveal>

	<div class="mt-8">
		<PhotoGrid photos={data.photos} />
	</div>
</section>

<Lightbox />
