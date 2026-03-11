import { getSiteConfig } from '$lib/data/index.js';

export function getImageUrl(path: string): string {
	const { r2PublicUrl } = getSiteConfig();
	const base = r2PublicUrl.endsWith('/') ? r2PublicUrl.slice(0, -1) : r2PublicUrl;
	const cleanPath = path.startsWith('/') ? path.slice(1) : path;
	return `${base}/${cleanPath}`;
}
