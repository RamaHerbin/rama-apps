<script lang="ts">
	import { BlurReveal } from 'fancy-ui';
	import PhotoGrid from '$lib/components/PhotoGrid.svelte';
	import Lightbox from '$lib/components/Lightbox.svelte';
	import SEOHead from '$lib/components/SEOHead.svelte';
	import { cn } from '$lib/utils.js';

	let { data } = $props();

	let activeTag = $state<string | null>(null);

	let filteredPhotos = $derived(
		activeTag ? data.photos.filter((p) => p.tags.includes(activeTag!)) : data.photos
	);
</script>

<SEOHead
	title="Gallery — {data.site.title}"
	description="Browse all photos"
	url="{data.site.url}/gallery"
/>

<section class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
	<BlurReveal>
		<h1 class="text-3xl font-bold">Gallery</h1>
		<p class="mt-2 text-muted-foreground">All photos, sorted by most recent</p>
	</BlurReveal>

	<!-- Tag filters -->
	{#if data.tags.length > 0}
		<div class="mt-6 flex flex-wrap gap-2">
			<button
				class={cn(
					'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
					!activeTag ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:text-foreground'
				)}
				onclick={() => (activeTag = null)}
			>
				All
			</button>
			{#each data.tags as tag}
				<button
					class={cn(
						'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
						activeTag === tag ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:text-foreground'
					)}
					onclick={() => (activeTag = activeTag === tag ? null : tag)}
				>
					{tag}
				</button>
			{/each}
		</div>
	{/if}

	<div class="mt-8">
		<PhotoGrid photos={filteredPhotos} />
	</div>
</section>

<Lightbox />
