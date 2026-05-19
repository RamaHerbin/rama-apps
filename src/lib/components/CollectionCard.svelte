<script lang="ts">
	import type { Collection, Photo } from '$lib/types/index.js';
	import { CardSpotlight } from 'fancy-ui-svelte';
	import { BlurReveal } from 'fancy-ui-svelte';
	import ImageOptimized from './ImageOptimized.svelte';
	import { cn } from '$lib/utils.js';

	interface Props {
		collection: Collection;
		coverPhoto?: Photo;
		photoCount?: number;
		class?: string;
	}

	let { collection, coverPhoto, photoCount = 0, class: className }: Props = $props();
</script>

<BlurReveal class={cn('h-full', className)}>
	<a href="/collections/{collection.slug}" class="group block h-full">
		<CardSpotlight class="overflow-hidden !border-border/30 !bg-card" slotClass="w-full">
			<div class="aspect-[3/2] overflow-hidden bg-muted">
				{#if coverPhoto}
					<ImageOptimized
						variants={coverPhoto.variants}
						alt={collection.title}
						size="medium"
						class="h-full w-full transition-transform duration-500 group-hover:scale-105"
					/>
				{:else}
					<div class="flex h-full items-center justify-center text-muted-foreground">
						<span class="text-4xl">&#128247;</span>
					</div>
				{/if}
			</div>
			<div class="p-4">
				<h3 class="font-medium">{collection.title}</h3>
				{#if collection.description}
					<p class="mt-1 line-clamp-2 text-sm text-muted-foreground">{collection.description}</p>
				{/if}
				<p class="mt-2 text-xs text-muted-foreground">{photoCount} photo{photoCount !== 1 ? 's' : ''}</p>
			</div>
		</CardSpotlight>
	</a>
</BlurReveal>
