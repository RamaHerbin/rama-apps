import fs from 'node:fs/promises';
import path from 'node:path';
import type { Photo } from '../src/lib/types/photo.js';
import type { Collection } from '../src/lib/types/collection.js';

const DATA_DIR = path.resolve(import.meta.dirname, '..', 'data');

export async function readPhotos(): Promise<Photo[]> {
	const raw = await fs.readFile(path.join(DATA_DIR, 'photos.json'), 'utf-8');
	return JSON.parse(raw);
}

export async function writePhotos(photos: Photo[]): Promise<void> {
	await fs.writeFile(
		path.join(DATA_DIR, 'photos.json'),
		JSON.stringify(photos, null, '\t') + '\n'
	);
}

export async function addPhoto(photo: Photo): Promise<void> {
	const photos = await readPhotos();
	const existing = photos.findIndex((p) => p.id === photo.id);
	if (existing !== -1) {
		photos[existing] = photo;
	} else {
		photos.push(photo);
	}
	await writePhotos(photos);
}

export async function readCollections(): Promise<Collection[]> {
	const raw = await fs.readFile(path.join(DATA_DIR, 'collections.json'), 'utf-8');
	return JSON.parse(raw);
}

export async function writeCollections(collections: Collection[]): Promise<void> {
	await fs.writeFile(
		path.join(DATA_DIR, 'collections.json'),
		JSON.stringify(collections, null, '\t') + '\n'
	);
}

export async function ensureCollection(
	id: string,
	title: string,
	slug: string
): Promise<Collection> {
	const collections = await readCollections();
	let collection = collections.find((c) => c.id === id || c.slug === slug);

	if (!collection) {
		collection = {
			id,
			slug,
			title,
			featured: false,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};
		collections.push(collection);
		await writeCollections(collections);
	}

	return collection;
}
