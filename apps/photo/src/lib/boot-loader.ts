/**
 * Pure constants + helpers for the intro boot-loader overlay.
 *
 * Clean-room re-implementation of a behavioral spec (timings, easings,
 * transforms) — original code, our images, our theme tokens. See
 * `$lib/components/BootLoader.svelte` for the stateful component that
 * consumes this module.
 */

/** Total duration of the layer-stacking animation, in ms. */
export const ANIM_END_MS = 2160;

/** Number of stacked layers (8 photos + 1 flat accent cap). */
export const LAYER_COUNT = 9;

/** Fraction of a layer's own duration used as the delay to the next layer. */
export const STAGGER_RATIO = 0.28;

/** Per-layer animation duration, derived so the last layer finishes at ANIM_END_MS. */
export const DURATION_MS = ANIM_END_MS / (1 + (LAYER_COUNT - 1) * STAGGER_RATIO);

/** Delay applied between each successive layer's animation start. */
export const STAGGER_MS = DURATION_MS * STAGGER_RATIO;

/** Target `width%` for each layer, widest (last/top) layer reaching 100%. */
export const WIDTH_TARGETS: number[] = Array.from({ length: LAYER_COUNT }, (_, i) => 84 + i * 2);

/** How long the counter holds at [100] before the exit sequence starts, in ms. */
export const COUNTER_HOLD_MS = 220;

/** Easing used for the layer-stacking animation. */
export const EASE_STACK = 'cubic-bezier(0.16, 1, 0.30, 1)';

/** Expo in-out easing used for the exit patch scale. */
export const EASE_EXPO_INOUT = 'cubic-bezier(0.87, 0, 0.13, 1)';

/** Timings for the exit sequence, all relative to T=0 = start of exit. */
export const EXIT = {
	blurFadeDelay: 140,
	blurFadeDuration: 420,
	patchScaleDelay: 200,
	patchScaleDuration: 1000,
	finalFadeDelay: 1200,
	finalFadeDuration: 420
} as const;

/** Per-image preload timeout, in ms. */
export const IMAGE_TIMEOUT_MS = 1800;

/** Hard cap forcing the exit sequence even if the stack animation never settles. */
export const SAFETY_FALLBACK_MS = 3000;

/** Extra margin applied on top of the geometrically-required patch scale. */
export const PATCH_SAFETY_MARGIN = 1.05;

/**
 * sessionStorage key marking the boot-loader as already played this session.
 *
 * Kept in sync by hand with the inline guard literal in `src/app.html`
 * (`document.documentElement.classList.add('boot-pending')` guard) — that
 * script runs before any JS module loads, so it cannot import this constant.
 * If you change this value, update `app.html` too.
 */
export const STORAGE_KEY = 'photoRamaBootPlayed';

/**
 * Loads a single image, resolving the URL on success and `null` on failure
 * or timeout. Never rejects — callers can safely `Promise.all` a batch.
 */
export function preloadImage(url: string, timeoutMs: number): Promise<string | null> {
	return new Promise((resolve) => {
		let settled = false;
		let timer: ReturnType<typeof setTimeout>;

		const settle = (value: string | null) => {
			if (settled) return;
			settled = true;
			clearTimeout(timer);
			resolve(value);
		};

		const img = new Image();
		// fetchPriority is a plain property on modern browsers; harmless no-op elsewhere.
		(img as HTMLImageElement & { fetchPriority?: string }).fetchPriority = 'high';
		img.onload = () => settle(url);
		img.onerror = () => settle(null);
		img.src = url;

		timer = setTimeout(() => settle(null), timeoutMs);
	});
}

/**
 * Resolves a batch of image URLs in parallel. Any URL that fails or times
 * out is substituted with the first URL that did succeed; if none succeed,
 * every slot falls back to `urls[0]` (unresolved, but still a valid <img> src).
 */
export async function resolveBootImages(urls: string[], timeoutMs: number): Promise<string[]> {
	if (urls.length === 0) return [];

	const results = await Promise.all(urls.map((url) => preloadImage(url, timeoutMs)));
	const firstSuccess = results.find((result): result is string => result !== null);

	return results.map((result) => result ?? firstSuccess ?? urls[0]);
}

/** Minimal rect shape consumed by `computePatchScale` — a `DOMRect` satisfies this. */
export interface PatchRect {
	left: number;
	top: number;
	width: number;
	height: number;
}

/**
 * Scale factor a `rect`-sized, centered patch must reach so it covers the
 * farthest viewport corner (plus `margin` safety), measured along its own
 * diagonal so it works for any aspect ratio.
 */
export function computePatchScale(rect: PatchRect, vw: number, vh: number, margin: number): number {
	const centerX = rect.left + rect.width / 2;
	const centerY = rect.top + rect.height / 2;

	const corners = [
		{ x: 0, y: 0 },
		{ x: vw, y: 0 },
		{ x: 0, y: vh },
		{ x: vw, y: vh }
	];

	const farthestCornerDistance = Math.max(
		...corners.map((corner) => Math.hypot(corner.x - centerX, corner.y - centerY))
	);

	const diagonal = Math.hypot(rect.width, rect.height);

	return (2 * farthestCornerDistance * margin) / diagonal;
}
