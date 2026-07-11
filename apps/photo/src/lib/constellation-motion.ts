/**
 * Pure constants + helpers for the desktop "surf" mechanics (wheel/drag ->
 * smoothed horizontal scroll) and depth parallax on the editorial home
 * page's photo constellation. See `src/routes/+page.svelte` for the
 * stateful DOM wiring that consumes this module (onMount, following the
 * same split used by `$lib/boot-loader.ts` + `BootLoader.svelte`).
 */

/** Clamp `value` to the inclusive range [min, max]. */
export function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

/** Linear interpolation from `a` to `b` by factor `t` (0..1). */
export function lerp(a: number, b: number, t: number): number {
	return a + (b - a) * t;
}

/** Per-frame easing factor for the smoothed-scroll rAF loop (0..1, higher = snappier). */
export const SURF_LERP_FACTOR = 0.14;

/** Below this pixel distance-to-target, the smoothing loop stops (settled). */
export const SURF_SETTLE_PX = 0.5;

/** Wheel delta -> horizontal scroll distance multiplier. */
export const WHEEL_TO_SCROLL = 1.1;

/** Pointer-drag release velocity (px/ms) -> momentum "flick" distance multiplier. */
export const DRAG_MOMENTUM_MULTIPLIER = 140;

/** Max distance a single post-release momentum flick may travel, in px. */
export const DRAG_MOMENTUM_MAX_PX = 480;

/** Max per-item depth-parallax drift, in px — a cinematic nudge, not a full pan. */
export const PARALLAX_MAX_PX = 12;

/** Scroll-position -> per-depth-unit drift coefficient (kept tiny; PARALLAX_MAX_PX is the real ceiling). */
export const PARALLAX_COEFFICIENT = 0.012;

/**
 * Depth-weighted horizontal drift for one constellation item as the strip
 * scrolls, in px. `depth` is the item's collage depth/z-index (see
 * `ConstellationEntry`); `midDepth` is the average depth across the whole
 * constellation, so foreground (above-mid) and background (below-mid)
 * layers drift in opposite directions — reading as parallax rather than a
 * uniform pan. Always clamped to a subtle range.
 */
export function computeParallaxOffset(scrollLeft: number, depth: number, midDepth: number): number {
	const weight = depth - midDepth;
	return clamp(scrollLeft * weight * PARALLAX_COEFFICIENT, -PARALLAX_MAX_PX, PARALLAX_MAX_PX);
}

/** Average of a list of depth values; falls back to 0 for an empty list. */
export function averageDepth(depths: number[]): number {
	if (depths.length === 0) return 0;
	return depths.reduce((sum, d) => sum + d, 0) / depths.length;
}

/** Intro timing: photo stagger step, in seconds (~40-80ms range from the design brief). */
export const INTRO_PHOTO_STAGGER_S = 0.06;

/** Intro timing: duration of each photo's rise+fade, in seconds. */
export const INTRO_PHOTO_DURATION_S = 0.85;

/** Intro timing: duration of the headline mask reveal, in seconds. */
export const INTRO_HEADLINE_DURATION_S = 0.9;

/** Intro timing: how much of the headline reveal to overlap before photos start staggering in, in seconds. */
export const INTRO_PHOTOS_START_OFFSET_S = 0.45;
