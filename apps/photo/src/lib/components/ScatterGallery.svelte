<script lang="ts">
	import { onMount } from 'svelte';
	import type { Photo } from '$lib/types/index.js';
	import type { ScatterField, ScatterItem } from '$lib/scatter/scatter-layout.js';
	import type { IntroTarget } from '$lib/scatter/scatter-intro.js';
	import { photoSrc } from '$lib/data/demo-photos.js';

	interface Props {
		/** Computed scatter field: positioned items plus total field height. */
		field: ScatterField;
		/** false renders the SSR/no-JS semantic grid fallback; true renders the interactive scatter. */
		enhanced: boolean;
		/** Called when an item is activated; receives the photo and its viewport rect for focus transitions. */
		onOpen: (photo: Photo, rect: DOMRect) => void;
		/** Called once after mount (enhanced only) with element/item pairs for intro + scroll engines. */
		registerTargets?: (targets: IntroTarget[]) => void;
	}

	let { field, enhanced, onOpen, registerTargets }: Props = $props();

	/** DOM refs for each scattered anchor, index-aligned with field.items. */
	let itemEls: HTMLAnchorElement[] = [];

	/**
	 * Activate an item: suppress navigation and hand the photo + measured rect to the parent.
	 * @param e Click event whose currentTarget is the scattered anchor.
	 * @param photo Photo bound to the activated item.
	 */
	function handleOpen(
		e: MouseEvent & { currentTarget: EventTarget & HTMLAnchorElement },
		photo: Photo
	) {
		e.preventDefault();
		onOpen(photo, e.currentTarget.getBoundingClientRect());
	}

	onMount(() => {
		if (!enhanced || !registerTargets) return;
		const targets: IntroTarget[] = [];
		field.items.forEach((item: ScatterItem, i: number) => {
			const el = itemEls[i];
			if (el) targets.push({ el, item });
		});
		registerTargets(targets);
	});
</script>

{#if enhanced}
	<div class="relative w-full" style="height: {field.fieldHeight}px;">
		{#each field.items as item, i (item.photo.id)}
			<a
				bind:this={itemEls[i]}
				href={photoSrc(item.photo.variants.large.jpg.url)}
				onclick={(e) => handleOpen(e, item.photo)}
				class="absolute block overflow-hidden will-change-transform select-none"
				style="left: {item.x}px; top: {item.y}px; width: {item.w}px; height: {item.h}px; z-index: {item.z};"
			>
				<img
					src={photoSrc(item.photo.variants.medium.jpg.url)}
					alt={item.photo.title}
					draggable={false}
					loading="lazy"
					decoding="async"
					class="h-full w-full object-cover select-none"
				/>
			</a>
		{/each}
	</div>
{:else}
	<div class="grid grid-cols-2 gap-4 p-6 sm:grid-cols-3 lg:grid-cols-4">
		{#each field.items as item (item.photo.id)}
			<a href={photoSrc(item.photo.variants.large.jpg.url)} class="block">
				<img
					src={photoSrc(item.photo.variants.thumb.jpg.url)}
					alt={item.photo.title}
					draggable={false}
					loading="lazy"
					decoding="async"
					class="h-full w-full object-cover select-none"
				/>
			</a>
		{/each}
	</div>
{/if}
