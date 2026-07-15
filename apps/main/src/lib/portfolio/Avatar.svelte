<script lang="ts">
	import { cn } from "$lib/utils.js";

	interface Props {
		/** Fallback image src: the JPG for real photos, or an inline SVG data URI
		 *  for generated initials. Always renders, so it works on its own. */
		src: string;
		/** Optional WebP source, preferred by browsers that support it. Omitted
		 *  for initials avatars (the data URI is already tiny). */
		webp?: string;
		/** Sets alt text and the width/height attributes (square). */
		name: string;
		size: number;
		class?: string;
	}

	let { src, webp, name, size, class: className }: Props = $props();
</script>

<picture>
	{#if webp}
		<source srcset={webp} type="image/webp" />
	{/if}
	<img
		class={cn("rounded-full object-cover", className)}
		width={size}
		height={size}
		loading="lazy"
		alt={`Profile picture of ${name}`}
		{src}
	/>
</picture>
