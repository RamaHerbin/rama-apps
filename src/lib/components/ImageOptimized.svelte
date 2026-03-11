<script lang="ts">
	import type { PhotoVariants } from '$lib/types/index.js';
	import { getImageUrl } from '$lib/config/r2.js';
	import { cn } from '$lib/utils.js';

	interface Props {
		variants: PhotoVariants;
		alt: string;
		size?: 'thumb' | 'medium' | 'large';
		class?: string;
		loading?: 'lazy' | 'eager';
		onclick?: (e: MouseEvent) => void;
	}

	let {
		variants,
		alt,
		size = 'medium',
		class: className,
		loading = 'lazy',
		onclick
	}: Props = $props();

	let sizeVariant = $derived(variants[size]);
</script>

<picture>
	<source srcset={getImageUrl(sizeVariant.avif.url)} type="image/avif" />
	<source srcset={getImageUrl(sizeVariant.webp.url)} type="image/webp" />
	<img
		src={getImageUrl(sizeVariant.jpg.url)}
		{alt}
		width={sizeVariant.jpg.width}
		height={sizeVariant.jpg.height}
		{loading}
		decoding="async"
		class={cn('h-auto w-full object-cover', className)}
		{onclick}
	/>
</picture>
