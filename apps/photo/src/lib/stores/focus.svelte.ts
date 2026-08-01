import type { Photo } from '$lib/types/index.js';

let isOpen = $state(false);
let current = $state<Photo | null>(null);
let list = $state<Photo[]>([]);
let index = $state(0);
let fromRect = $state<DOMRect | null>(null);

/** Global focus-overlay store: the big centered image view with thumb strip and caption. */
export const focus = {
	get isOpen() {
		return isOpen;
	},
	get current() {
		return current;
	},
	get list() {
		return list;
	},
	get index() {
		return index;
	},
	get total() {
		return list.length;
	},
	get hasPrev() {
		return index > 0;
	},
	get hasNext() {
		return index < list.length - 1;
	},
	get fromRect() {
		return fromRect;
	},

	/**
	 * Open the focus overlay on a photo within a list.
	 * @param photo - The photo to focus.
	 * @param photos - The ordered list the photo belongs to.
	 * @param rect - Optional origin rect for a from-thumbnail entry animation.
	 */
	open(photo: Photo, photos: Photo[], rect?: DOMRect) {
		list = photos;
		index = photos.findIndex((p) => p.id === photo.id);
		current = photo;
		fromRect = rect ?? null;
		isOpen = true;
	},

	/** Close the focus overlay and clear transient state. */
	close() {
		isOpen = false;
		current = null;
		fromRect = null;
	},

	/** Advance to the next photo if one exists. */
	next() {
		if (index < list.length - 1) {
			index++;
			current = list[index];
		}
	},

	/** Return to the previous photo if one exists. */
	prev() {
		if (index > 0) {
			index--;
			current = list[index];
		}
	},

	/**
	 * Jump to a specific index, clamped to the bounds of the list.
	 * @param i - Target index; values outside [0, total - 1] are clamped.
	 */
	setIndex(i: number) {
		if (list.length === 0) return;
		const clamped = Math.max(0, Math.min(i, list.length - 1));
		index = clamped;
		current = list[clamped];
	}
};
