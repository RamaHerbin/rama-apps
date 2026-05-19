<script lang="ts">
	import type { Photo } from '$lib/types/index.js';
	import { BlurReveal, CardSpotlight } from 'fancy-ui-svelte';
	import ImageOptimized from './ImageOptimized.svelte';
	import { cn } from '$lib/utils.js';

	interface Props {
		photo: Photo;
		class?: string;
	}

	let { photo, class: className }: Props = $props();
</script>

<BlurReveal class={cn('h-full', className)}>
	<a href="/gallery/{photo.slug}" class="group block h-full">
		<CardSpotlight class="overflow-hidden !border-border/30 !bg-card" slotClass="w-full">
			<div class="overflow-hidden">
				<ImageOptimized
					variants={photo.variants}
					alt={photo.title}
					size="thumb"
					class="transition-transform duration-500 group-hover:scale-105"
				/>
			</div>
			<div class="p-3">
				<h3 class="truncate text-sm font-medium">{photo.title}</h3>
				{#if photo.exif.camera}
					<p class="mt-1 truncate text-xs text-muted-foreground">{photo.exif.camera}</p>
				{/if}
			</div>
		</CardSpotlight>
	</a>
</BlurReveal>
