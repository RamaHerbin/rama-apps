<script lang="ts">
	import { ImageTrailCursor, BlurReveal } from 'fancy-ui';
	import SEOHead from '$lib/components/SEOHead.svelte';
	import Lightbox from '$lib/components/Lightbox.svelte';
	import { lightbox } from '$lib/stores/lightbox.svelte.js';
	import { getImageUrl } from '$lib/config/r2.js';
	import type { Photo } from '$lib/types/index.js';

	let { data } = $props();

	let trailImageUrls = $derived(
		data.trailImages.map((p: string) => p.startsWith('/') ? p : getImageUrl(p))
	);

	function openLightbox(photo: Photo) {
		lightbox.open(photo, data.recentPhotos);
	}
</script>

<SEOHead
	title="{data.site.title} — Photography Portfolio"
	description={data.site.description}
	url={data.site.url}
/>

<!-- Hero: ImageTrailCursor plein écran -->
<section class="relative h-[100svh] w-full cursor-none overflow-hidden bg-neutral-950">
	{#if trailImageUrls.length > 0}
		<ImageTrailCursor images={trailImageUrls} variant="type1" class="h-full w-full" />
	{/if}

	<!-- Scroll indicator -->
	<div class="pointer-events-none absolute bottom-8 left-1/2 z-[200] -translate-x-1/2 animate-bounce">
		<svg class="h-6 w-6 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
		</svg>
	</div>
</section>

<!-- Grille Instagram-style : posts récents -->
{#if data.recentPhotos.length > 0}
	<section class="mx-auto max-w-5xl px-4 py-16">
		<BlurReveal>
			<h2 class="mb-8 text-center text-2xl font-bold tracking-tight">Latest</h2>
		</BlurReveal>

		<div class="grid grid-cols-3 gap-1 sm:gap-2">
			{#each data.recentPhotos as photo (photo.id)}
				<button
					class="group relative aspect-square overflow-hidden bg-neutral-100"
					onclick={() => openLightbox(photo)}
				>
					<img
						src={getImageUrl(photo.variants.thumb.jpg.url)}
						alt={photo.title}
						loading="lazy"
						decoding="async"
						class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
					/>
					<!-- Overlay au hover -->
					<div class="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-300 group-hover:bg-black/40">
						<span class="text-sm font-medium text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
							{photo.title}
						</span>
					</div>
				</button>
			{/each}
		</div>

		<div class="mt-8 text-center">
			<a
				href="/gallery"
				class="inline-block rounded-full border border-border px-6 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
			>
				View all photos
			</a>
		</div>
	</section>
{/if}

<!-- Featured collections -->
{#if data.featuredCollections.length > 0}
	<section class="mx-auto max-w-5xl px-4 py-16">
		<BlurReveal>
			<h2 class="mb-8 text-center text-2xl font-bold tracking-tight">Collections</h2>
		</BlurReveal>
		<div class="grid gap-4 sm:grid-cols-2">
			{#each data.featuredCollections as { collection, coverPhoto, photoCount }}
				<a href="/collections/{collection.slug}" class="group relative aspect-[16/9] overflow-hidden rounded-lg bg-neutral-100">
					{#if coverPhoto}
						<img
							src={getImageUrl(coverPhoto.variants.medium.jpg.url)}
							alt={collection.title}
							class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
						/>
					{/if}
					<div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
					<div class="absolute bottom-0 left-0 p-4 text-white">
						<h3 class="text-lg font-semibold">{collection.title}</h3>
						<p class="text-sm text-white/70">{photoCount} photos</p>
					</div>
				</a>
			{/each}
		</div>
	</section>
{/if}

<Lightbox />
