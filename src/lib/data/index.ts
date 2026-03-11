import type { Photo, Collection, SiteConfig } from '$lib/types/index.js';
import photosJson from '../../../data/photos.json';
import collectionsJson from '../../../data/collections.json';
import siteJson from '../../../data/site.json';

const photos = photosJson as Photo[];
const collections = collectionsJson as Collection[];
const site = siteJson as SiteConfig;

export function getSiteConfig(): SiteConfig {
	return site;
}

export function getPhotos(): Photo[] {
	return photos.sort(
		(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
	);
}

export function getPhotoBySlug(slug: string): Photo | undefined {
	return photos.find((p) => p.slug === slug);
}

export function getPhotosByCollection(collectionId: string): Photo[] {
	return getPhotos().filter((p) => p.collectionIds.includes(collectionId));
}

export function getPhotosByTag(tag: string): Photo[] {
	return getPhotos().filter((p) => p.tags.includes(tag));
}

export function getFeaturedPhotos(): Photo[] {
	return getPhotos().filter((p) => p.featured);
}

export function getAllTags(): string[] {
	const tags = new Set<string>();
	photos.forEach((p) => p.tags.forEach((t) => tags.add(t)));
	return [...tags].sort();
}

export function getCollections(): Collection[] {
	return collections.sort(
		(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
	);
}

export function getCollectionBySlug(slug: string): Collection | undefined {
	return collections.find((c) => c.slug === slug);
}

export function getFeaturedCollections(): Collection[] {
	return getCollections().filter((c) => c.featured);
}
