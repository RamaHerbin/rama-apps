<script lang="ts">
	import { TextGenerateEffect, BlurReveal, Sparkles } from 'fancy-ui';
	import PhotoGrid from '$lib/components/PhotoGrid.svelte';
	import CollectionCard from '$lib/components/CollectionCard.svelte';
	import SEOHead from '$lib/components/SEOHead.svelte';
	import Lightbox from '$lib/components/Lightbox.svelte';

	let { data } = $props();
</script>

<SEOHead
	title="{data.site.title} — Photography Portfolio"
	description={data.site.description}
	url={data.site.url}
/>

<!-- Hero section -->
<section class="relative flex min-h-[70vh] items-center justify-center overflow-hidden">
	<Sparkles
		class="absolute inset-0"
		particleColor="oklch(0.708 0.165 75)"
		particleDensity={30}
		minSize={1}
		maxSize={2}
		speed={0.3}
	/>
	<div class="relative z-10 text-center px-4">
		<BlurReveal>
			<h1 class="text-5xl font-bold tracking-tight sm:text-7xl">
				<TextGenerateEffect words={data.site.title} duration={0.8} stagger={0.1} />
			</h1>
			<p class="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
				{data.site.description}
			</p>
			<div class="mt-8 flex items-center justify-center gap-4">
				<a
					href="/gallery"
					class="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
				>
					Browse Gallery
				</a>
				<a
					href="/about"
					class="rounded-lg border border-border px-6 py-3 text-sm font-medium transition-colors hover:bg-muted"
				>
					About Me
				</a>
			</div>
		</BlurReveal>
	</div>
</section>

<!-- Recent photos -->
{#if data.recentPhotos.length > 0}
	<section class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
		<BlurReveal>
			<div class="mb-8 flex items-center justify-between">
				<h2 class="text-2xl font-bold">Recent Photos</h2>
				<a href="/gallery" class="text-sm text-muted-foreground transition-colors hover:text-foreground">
					View all &rarr;
				</a>
			</div>
		</BlurReveal>
		<PhotoGrid photos={data.recentPhotos} />
	</section>
{/if}

<!-- Featured collections -->
{#if data.featuredCollections.length > 0}
	<section class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
		<BlurReveal>
			<div class="mb-8 flex items-center justify-between">
				<h2 class="text-2xl font-bold">Collections</h2>
				<a href="/collections" class="text-sm text-muted-foreground transition-colors hover:text-foreground">
					View all &rarr;
				</a>
			</div>
		</BlurReveal>
		<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
			{#each data.featuredCollections as { collection, coverPhoto, photoCount }}
				<CollectionCard {collection} {coverPhoto} {photoCount} />
			{/each}
		</div>
	</section>
{/if}

<Lightbox />
