import { getFeaturedPhotos, getPhotos, getFeaturedCollections, getPhotosByCollection, getPhotoBySlug } from '$lib/data/index.js';

export function load() {
	const recentPhotos = getPhotos().slice(0, 12);
	const featuredPhotos = getFeaturedPhotos().slice(0, 8);
	const featuredCollections = getFeaturedCollections().slice(0, 4);

	const collectionsWithCover = featuredCollections.map((c) => ({
		collection: c,
		coverPhoto: c.coverPhotoId ? getPhotoBySlug(c.coverPhotoId) : undefined,
		photoCount: getPhotosByCollection(c.id).length
	}));

	// Use recent photo thumbnails for the cursor trail
	const trailImages = recentPhotos
		.slice(0, 10)
		.map((p) => p.variants?.thumb?.jpg?.url)
		.filter(Boolean);

	return {
		recentPhotos,
		featuredPhotos,
		featuredCollections: collectionsWithCover,
		trailImages
	};
}
