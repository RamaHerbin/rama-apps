import { getPhotos, getAllTags } from '$lib/data/index.js';

export function load() {
	return {
		photos: getPhotos(),
		tags: getAllTags()
	};
}
