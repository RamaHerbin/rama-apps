import { demoPhotos } from '$lib/data/demo-photos.js';

/**
 * Home page load — supplies the scatter field's photos.
 * `prerender` is inherited from the layout; `site` comes from the parent layout load.
 */
export function load() {
	return { photos: demoPhotos };
}
