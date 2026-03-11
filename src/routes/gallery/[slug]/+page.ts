import { getPhotoBySlug, getPhotos } from '$lib/data/index.js';
import { error } from '@sveltejs/kit';

export function entries() {
	return getPhotos().map((p) => ({ slug: p.slug }));
}

export function load({ params }) {
	const photo = getPhotoBySlug(params.slug);
	if (!photo) error(404, 'Photo not found');

	const allPhotos = getPhotos();
	const currentIndex = allPhotos.findIndex((p) => p.slug === params.slug);
	const prevPhoto = currentIndex > 0 ? allPhotos[currentIndex - 1] : null;
	const nextPhoto = currentIndex < allPhotos.length - 1 ? allPhotos[currentIndex + 1] : null;

	return {
		photo,
		prevPhoto,
		nextPhoto
	};
}
