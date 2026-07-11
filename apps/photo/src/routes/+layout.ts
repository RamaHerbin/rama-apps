import { getFeaturedPhotos, getPhotos, getSiteConfig } from '$lib/data/index.js';

export const prerender = true;

export function load() {
	// Pool the featured photos first so the boot-loader favors the strongest
	// shots, then top up with the rest of the catalog; cycle if there are
	// fewer than 8 photos total, or skip entirely (empty array) if there are none.
	const pool = [...getFeaturedPhotos(), ...getPhotos()];

	const bootImages: string[] = pool.length
		? Array.from({ length: 8 }, (_, i) => pool[i % pool.length].variants?.thumb?.jpg?.url).filter(
				(url): url is string => typeof url === 'string'
			)
		: [];

	return {
		site: getSiteConfig(),
		bootImages
	};
}
