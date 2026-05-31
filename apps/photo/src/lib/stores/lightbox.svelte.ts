import type { Photo } from '$lib/types/index.js';

let isOpen = $state(false);
let currentPhoto = $state<Photo | null>(null);
let photoList = $state<Photo[]>([]);
let currentIndex = $state(0);
let showExif = $state(false);

export const lightbox = {
	get isOpen() {
		return isOpen;
	},
	get currentPhoto() {
		return currentPhoto;
	},
	get currentIndex() {
		return currentIndex;
	},
	get total() {
		return photoList.length;
	},
	get showExif() {
		return showExif;
	},
	get hasPrev() {
		return currentIndex > 0;
	},
	get hasNext() {
		return currentIndex < photoList.length - 1;
	},

	open(photo: Photo, photos: Photo[]) {
		photoList = photos;
		currentIndex = photos.findIndex((p) => p.id === photo.id);
		currentPhoto = photo;
		isOpen = true;
		showExif = false;
	},

	close() {
		isOpen = false;
		currentPhoto = null;
		showExif = false;
	},

	next() {
		if (currentIndex < photoList.length - 1) {
			currentIndex++;
			currentPhoto = photoList[currentIndex];
		}
	},

	prev() {
		if (currentIndex > 0) {
			currentIndex--;
			currentPhoto = photoList[currentIndex];
		}
	},

	toggleExif() {
		showExif = !showExif;
	}
};
