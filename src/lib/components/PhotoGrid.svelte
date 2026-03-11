<script lang="ts">
	import type { Photo } from '$lib/types/index.js';
	import PhotoCard from './PhotoCard.svelte';
	import { cn } from '$lib/utils.js';

	interface Props {
		photos: Photo[];
		class?: string;
	}

	let { photos, class: className }: Props = $props();
</script>

{#if photos.length === 0}
	<div class="flex min-h-[40vh] items-center justify-center">
		<p class="text-lg text-muted-foreground">No photos yet.</p>
	</div>
{:else}
	<div
		class={cn(
			'columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4',
			className
		)}
	>
		{#each photos as photo (photo.id)}
			<div class="mb-4 break-inside-avoid">
				<PhotoCard {photo} />
			</div>
		{/each}
	</div>
{/if}
