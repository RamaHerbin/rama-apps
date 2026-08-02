import { getPhotos, getPhotoById, getSiteConfig } from '$lib/data/index.js';
import { editorialHomeConstellation } from '$lib/data/editorial-home.js';
import type { ResolvedConstellationEntry } from '$lib/types/index.js';

export function load() {
	const site = getSiteConfig();
	const photoCount = getPhotos().length;

	// Resolve the centralized constellation config against the real photo
	// catalog. Entries whose photoId no longer exists in data/photos.json
	// are silently dropped so editing editorial-home.ts never 404s the page.
	const constellation: ResolvedConstellationEntry[] = editorialHomeConstellation
		.map((entry) => {
			const photo = getPhotoById(entry.photoId);
			return photo ? { ...entry, photo } : null;
		})
		.filter((entry): entry is ResolvedConstellationEntry => entry !== null);

	return {
		site,
		photoCount,
		constellation
	};
}
