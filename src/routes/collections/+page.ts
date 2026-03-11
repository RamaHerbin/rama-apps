import { getCollections, getPhotoBySlug, getPhotosByCollection } from '$lib/data/index.js';

export function load() {
	const collections = getCollections();

	const collectionsWithCover = collections.map((c) => ({
		collection: c,
		coverPhoto: c.coverPhotoId ? getPhotoBySlug(c.coverPhotoId) : undefined,
		photoCount: getPhotosByCollection(c.id).length
	}));

	return {
		collections: collectionsWithCover
	};
}
