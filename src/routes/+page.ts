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

	// Use recent photo thumbnails for the cursor trail, fallback to static images
	let trailImages: string[] = recentPhotos
		.slice(0, 10)
		.map((p) => p.variants?.thumb?.jpg?.url)
		.filter((url): url is string => typeof url === 'string');

	if (trailImages.length === 0) {
		trailImages = [
			'/DSCF0385-ed.jpg',
			'/DSCF0404.jpg',
			'/DSCF0501test.webp',
			'/DSCF0548test.webp',
			'/DSCF0703test2_1.webp',
			'/IMG_0318.jpg'
		];
	}

	return {
		recentPhotos,
		featuredPhotos,
		featuredCollections: collectionsWithCover,
		trailImages
	};
}
