/**
 * Deterministic initials avatar, returned as an inline SVG data URI.
 *
 * The testimonials are real people who wrote real LinkedIn recommendations. We
 * have no right to republish their profile photos, and both `AnimatedTooltip`
 * and `ReviewCard` type their avatar as an image `src` — so we synthesise one
 * rather than reaching for a stock photo of a stranger. Swap `image` for a real
 * file under `static/portfolio/` once someone actually consents.
 */

/** Two-letter initials: first + last word ("Mathilde Gallouët" → "MG"). */
function initials(name: string): string {
	const words = name.trim().split(/\s+/).filter(Boolean);
	if (words.length === 0) return "?";
	const first = words[0]![0]!;
	const last = words.length > 1 ? words[words.length - 1]![0]! : "";
	return (first + last).toUpperCase();
}

/** Stable hue per name, so the same person always gets the same colour. */
function hue(name: string): number {
	let hash = 0;
	for (let i = 0; i < name.length; i++) {
		hash = (hash * 31 + name.charCodeAt(i)) % 360;
	}
	return hash;
}

export function initialsAvatar(name: string): string {
	const h = hue(name);
	// Encoded rather than base64'd: keeps the markup greppable in devtools, and
	// `#` / `%` would otherwise break the data URI.
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img"><rect width="64" height="64" rx="32" fill="hsl(${h}, 55%, 42%)"/><text x="32" y="32" dy=".35em" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="26" font-weight="600" fill="#ffffff">${initials(name)}</text></svg>`;
	return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
