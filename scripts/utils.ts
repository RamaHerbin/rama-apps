import { nanoid } from 'nanoid';
import slugify from 'slugify';

export function generateId(): string {
	return nanoid(12);
}

export function toSlug(text: string): string {
	return slugify(text, { lower: true, strict: true });
}

export function nowISO(): string {
	return new Date().toISOString();
}
