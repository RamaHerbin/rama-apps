<script lang="ts">
	import { BlurReveal, GlareCard, Focus } from 'fancy-ui';
	import ImageOptimized from '$lib/components/ImageOptimized.svelte';
	import ExifDisplay from '$lib/components/ExifDisplay.svelte';
	import SEOHead from '$lib/components/SEOHead.svelte';
	import { getImageUrl } from '$lib/config/r2.js';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';

	let { data } = $props();

	let jsonLd = $derived({
		'@context': 'https://schema.org',
		'@type': 'Photograph',
		name: data.photo.title,
		description: data.photo.description || '',
		image: getImageUrl(data.photo.variants.large.jpg.url),
		dateCreated: data.photo.exif.dateTaken || data.photo.createdAt,
		author: {
			'@type': 'Person',
			name: data.site.author
		}
	});
</script>

<SEOHead
	title="{data.photo.title} — {data.site.title}"
	description={data.photo.description || `Photo: ${data.photo.title}`}
	url="{data.site.url}/gallery/{data.photo.slug}"
	image={getImageUrl(data.photo.variants.large.jpg.url)}
	type="article"
	{jsonLd}
/>

<section class="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
	<!-- Back link -->
	<BlurReveal>
		<a href="/gallery" class="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
			<ChevronLeftIcon class="h-4 w-4" />
			Back to Gallery
		</a>
	</BlurReveal>

	<!-- Photo -->
	<BlurReveal>
		<div class="overflow-hidden rounded-lg">
			<GlareCard class="mx-auto max-w-4xl">
				<ImageOptimized
					variants={data.photo.variants}
					alt={data.photo.title}
					size="large"
					loading="eager"
				/>
			</GlareCard>
		</div>
	</BlurReveal>

	<!-- Title and description -->
	<div class="mt-8 max-w-4xl mx-auto">
		<BlurReveal>
			<h1 class="text-3xl font-bold">{data.photo.title}</h1>
			{#if data.photo.description}
				<p class="mt-2 text-muted-foreground">{data.photo.description}</p>
			{/if}
		</BlurReveal>

		<!-- Tags -->
		{#if data.photo.tags.length > 0}
			<BlurReveal>
				<div class="mt-4 flex flex-wrap gap-2">
					{#each data.photo.tags as tag}
						<a
							href="/gallery?tag={tag}"
							class="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
						>
							{tag}
						</a>
					{/each}
				</div>
			</BlurReveal>
		{/if}

		<!-- EXIF -->
		<BlurReveal>
			<div class="mt-8 rounded-lg border border-border p-4">
				<h2 class="mb-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">Camera Details</h2>
				<ExifDisplay exif={data.photo.exif} />
			</div>
		</BlurReveal>

		<!-- Nav prev/next -->
		<div class="mt-8 flex items-center justify-between">
			{#if data.prevPhoto}
				<a
					href="/gallery/{data.prevPhoto.slug}"
					class="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
				>
					<ChevronLeftIcon class="h-4 w-4" />
					{data.prevPhoto.title}
				</a>
			{:else}
				<div></div>
			{/if}
			{#if data.nextPhoto}
				<a
					href="/gallery/{data.nextPhoto.slug}"
					class="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
				>
					{data.nextPhoto.title}
					<ChevronRightIcon class="h-4 w-4" />
				</a>
			{/if}
		</div>
	</div>
</section>
