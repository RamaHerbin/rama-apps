<script lang="ts">
	import { lightbox } from '$lib/stores/lightbox.svelte.js';
	import { getImageUrl } from '$lib/config/r2.js';
	import ExifDisplay from './ExifDisplay.svelte';
	import XIcon from '@lucide/svelte/icons/x';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import InfoIcon from '@lucide/svelte/icons/info';

	let startX = $state(0);
	let deltaX = $state(0);
	let swiping = $state(false);

	function handleKeydown(e: KeyboardEvent) {
		if (!lightbox.isOpen) return;
		switch (e.key) {
			case 'Escape':
				lightbox.close();
				break;
			case 'ArrowLeft':
				lightbox.prev();
				break;
			case 'ArrowRight':
				lightbox.next();
				break;
			case 'i':
				lightbox.toggleExif();
				break;
		}
	}

	function handleTouchStart(e: TouchEvent) {
		startX = e.touches[0].clientX;
		swiping = true;
		deltaX = 0;
	}

	function handleTouchMove(e: TouchEvent) {
		if (!swiping) return;
		deltaX = e.touches[0].clientX - startX;
	}

	function handleTouchEnd() {
		if (!swiping) return;
		swiping = false;
		if (deltaX > 80) lightbox.prev();
		else if (deltaX < -80) lightbox.next();
		deltaX = 0;
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			lightbox.close();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if lightbox.isOpen && lightbox.currentPhoto}
	{@const photo = lightbox.currentPhoto}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-[100] flex items-center justify-center bg-black/95"
		onclick={handleBackdropClick}
		ontouchstart={handleTouchStart}
		ontouchmove={handleTouchMove}
		ontouchend={handleTouchEnd}
		role="dialog"
		aria-modal="true"
		aria-label="Photo lightbox"
	>
		<!-- Top bar -->
		<div class="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4">
			<span class="text-sm text-white/70">
				{lightbox.currentIndex + 1} / {lightbox.total}
			</span>
			<div class="flex items-center gap-2">
				<button
					onclick={() => lightbox.toggleExif()}
					class="rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
					aria-label="Toggle EXIF info"
				>
					<InfoIcon class="h-5 w-5" />
				</button>
				<button
					onclick={() => lightbox.close()}
					class="rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
					aria-label="Close lightbox"
				>
					<XIcon class="h-5 w-5" />
				</button>
			</div>
		</div>

		<!-- Prev button -->
		{#if lightbox.hasPrev}
			<button
				onclick={() => lightbox.prev()}
				class="absolute left-4 z-10 rounded-full p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
				aria-label="Previous photo"
			>
				<ChevronLeftIcon class="h-8 w-8" />
			</button>
		{/if}

		<!-- Image -->
		<div
			class="flex max-h-[85vh] max-w-[90vw] items-center justify-center"
			style:transform={swiping ? `translateX(${deltaX}px)` : undefined}
			style:transition={swiping ? 'none' : 'transform 0.2s'}
		>
			<img
				src={getImageUrl(photo.variants.large.jpg.url)}
				alt={photo.title}
				class="max-h-[85vh] max-w-[90vw] object-contain"
			/>
		</div>

		<!-- Next button -->
		{#if lightbox.hasNext}
			<button
				onclick={() => lightbox.next()}
				class="absolute right-4 z-10 rounded-full p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
				aria-label="Next photo"
			>
				<ChevronRightIcon class="h-8 w-8" />
			</button>
		{/if}

		<!-- EXIF overlay -->
		{#if lightbox.showExif}
			<div class="absolute bottom-0 left-0 right-0 bg-black/80 p-4 backdrop-blur-sm">
				<h3 class="mb-2 text-sm font-medium text-white">{photo.title}</h3>
				{#if photo.description}
					<p class="mb-3 text-xs text-white/70">{photo.description}</p>
				{/if}
				<ExifDisplay exif={photo.exif} compact class="text-white/70 [&_svg]:text-white/50" />
			</div>
		{/if}
	</div>
{/if}
