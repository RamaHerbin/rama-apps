import { getCollectionBySlug, getCollections, getPhotosByCollection } from '$lib/data/index.js';
import { error } from '@sveltejs/kit';

export function entries() {
	return getCollections().map((c) => ({ slug: c.slug }));
}

export function load({ params }) {
	const collection = getCollectionBySlug(params.slug);
	if (!collection) error(404, 'Collection not found');

	const photos = getPhotosByCollection(collection.id);

	return {
		collection,
		photos
	};
}
