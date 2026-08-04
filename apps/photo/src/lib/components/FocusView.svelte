<script lang="ts">
	/**
	 * FocusView — full-viewport focus overlay for the scatter home.
	 * Big centered image, left vertical thumb strip, right vertical-rl caption,
	 * BACK button + ScatterDots at bottom center. Driven entirely by the focus store.
	 */
	import { focus } from '$lib/stores/focus.svelte.js';
	import { photoSrc } from '$lib/data/demo-photos.js';
	import ScatterDots from '$lib/components/ScatterDots.svelte';

	/** Horizontal swipe tracking (same pattern as Lightbox.svelte). */
	let startX = $state(0);
	let deltaX = $state(0);
	let swiping = $state(false);

	function handleKeydown(e: KeyboardEvent) {
		if (!focus.isOpen) return;
		switch (e.key) {
			case 'Escape':
				focus.close();
				break;
			case 'ArrowLeft':
				focus.prev();
				break;
			case 'ArrowRight':
				focus.next();
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
		if (deltaX > 80) focus.prev();
		else if (deltaX < -80) focus.next();
		deltaX = 0;
	}

	// Lock body scroll while the overlay is open; restore on close/unmount.
	$effect(() => {
		if (!focus.isOpen) return;
		const previous = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = previous;
		};
	});
</script>

<svelte:window onkeydown={handleKeydown} />

{#if focus.isOpen && focus.current}
	{@const current = focus.current}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="focus-view fixed inset-0 z-[90] overflow-hidden"
		style:background="var(--color-background)"
		style:color="var(--color-foreground)"
		ontouchstart={handleTouchStart}
		ontouchmove={handleTouchMove}
		ontouchend={handleTouchEnd}
		role="dialog"
		aria-modal="true"
		aria-label="Photo focus view"
	>
		<!-- Center: big image -->
		<div class="absolute inset-0 flex items-center justify-center px-20 sm:px-28">
			<div
				class="flex items-center justify-center"
				style:transform={swiping ? `translateX(${deltaX}px)` : undefined}
				style:transition={swiping ? 'none' : 'transform 0.2s ease-out'}
			>
				<img
					src={photoSrc(current.variants.large.jpg.url)}
					alt={current.title}
					class="max-h-[78vh] object-contain"
					style:max-width="min(72vw, calc(78vh * {current.aspectRatio}))"
					draggable="false"
				/>
			</div>
		</div>

		<!-- Left: vertical thumbnail strip -->
		<div
			class="pointer-events-auto absolute top-1/2 left-6 flex max-h-[80vh] -translate-y-1/2 flex-col gap-2 overflow-y-auto"
			aria-label="Thumbnails"
		>
			{#each focus.list as photo, i (photo.id)}
				<button
					type="button"
					onclick={() => focus.setIndex(i)}
					class="block shrink-0 overflow-hidden rounded-[2px] transition-all duration-200 ease-out"
					class:opacity-100={i === focus.index}
					class:opacity-60={i !== focus.index}
					style:width={i === focus.index ? '52px' : '40px'}
					aria-label={`View ${photo.title}`}
					aria-current={i === focus.index ? 'true' : undefined}
				>
					<img
						src={photoSrc(photo.variants.thumb.jpg.url)}
						alt={photo.title}
						class="h-full w-full object-cover"
						loading="lazy"
						decoding="async"
						draggable="false"
					/>
				</button>
			{/each}
		</div>

		<!-- Right: vertical caption -->
		<div
			class="absolute top-1/2 right-6 -translate-y-1/2 font-mono text-xs tracking-wide uppercase select-none"
			style:writing-mode="vertical-rl"
			style:color="var(--color-muted-foreground)"
		>
			{current.title} / RAMA HERBIN
		</div>

		<!-- Bottom center: BACK + dots -->
		<div class="absolute inset-x-0 bottom-8 flex flex-col items-center gap-3">
			<button
				type="button"
				onclick={() => focus.close()}
				class="font-sans text-[28px] leading-none font-extrabold tracking-tight uppercase transition-opacity hover:opacity-70"
				style:color="var(--color-foreground)"
			>
				Back
			</button>
			<ScatterDots count={3} active={focus.index % 3} />
		</div>
	</div>
{/if}

<style>
	.focus-view {
		animation: focus-enter 200ms cubic-bezier(0.16, 1, 0.3, 1) both;
	}

	@keyframes focus-enter {
		from {
			opacity: 0;
			transform: scale(0.965);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.focus-view {
			animation: none;
		}
	}
</style>
