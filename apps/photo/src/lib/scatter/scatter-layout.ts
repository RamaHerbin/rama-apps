/**
 * Pure, deterministic layout math for the scattered photo home.
 *
 * Given a set of photos and a viewport, produces an editorial "scatter" field:
 * loosely clustered images leaning left/right, a clear central band reserved for
 * the name reveal, and per-item parallax speeds + intro stagger slots.
 *
 * This module is intentionally free of DOM access, browser globals, and any
 * non-deterministic source (`Math.random`, `Date.now`). Identical inputs always
 * yield identical output so the layout is stable across SSR and CSR hydration.
 * See `$lib/scatter/scatter-intro.ts` and `$lib/scatter/scatter-scroll.ts` for
 * the stateful animation layers that consume this field.
 */

import type { Photo } from '$lib/types/index.js';

/** Viewport dimensions the scatter field is laid out against, in CSS pixels. */
export interface ScatterViewport {
	/** Viewport width in px. */
	width: number;
	/** Viewport height in px. */
	height: number;
}

/** A single positioned photo within the scatter field. */
export interface ScatterItem {
	/** The source photo. */
	photo: Photo;
	/** Left offset within the field, in px. */
	x: number;
	/** Top offset within the field, in px. */
	y: number;
	/** Display width, in px. */
	w: number;
	/** Display height, in px — always `w / photo.aspectRatio`. */
	h: number;
	/** Stacking order, `1..items.length`, following draw (creation) order. */
	z: number;
	/** Parallax factor in `[0.72, 1.38]`; `<1` lags scroll, `>1` leads it. */
	speed: number;
	/** Intro stagger slot, normalized `0..1` by dispersal (scatter) order. */
	delay: number;
}

/** The fully-computed scatter field returned by {@link computeScatterLayout}. */
export interface ScatterField {
	/** Positioned items, in draw order (index === draw order === `z - 1`). */
	items: ScatterItem[];
	/** Total scrollable height of the field, in px. */
	fieldHeight: number;
}

/** Default RNG seed — keeps the reference layout stable across builds. */
const DEFAULT_SCATTER_SEED = 20260801;

/** Item display width range, expressed as a fraction of viewport width (16–30vw). */
const SIZE_MIN_VW = 0.16;
const SIZE_MAX_VW = 0.3;

/** Absolute clamp on the vw-derived display width, in px (guards tiny/huge viewports). */
const MIN_ITEM_PX = 120;
const MAX_ITEM_PX = 620;

/** Parallax speed range applied per item. */
const SPEED_MIN = 0.72;
const SPEED_MAX = 1.38;

/** Half-extents of the central name zone, as fractions of the first viewport. */
const NAME_HALF_W_FRAC = 0.23; // → central 46% of width
const NAME_HALF_H_FRAC = 0.09; // → central 18% of height

/**
 * Horizontal lean for items outside the name band: left-leaning items may reach
 * up to this fraction of width, right-leaning items start at its complement, so
 * clusters favour their side while still overlapping through the middle.
 */
const LEAN_MAX_FRAC = 0.6;

/** Vertical jitter spread, as a fraction of one slot's normalized height. */
const VERTICAL_JITTER = 0.9;

/** Clamps `value` into the inclusive `[min, max]` range. */
function clamp(value: number, min: number, max: number): number {
	return value < min ? min : value > max ? max : value;
}

/**
 * Mulberry32 seeded PRNG. Returns a stateful generator producing floats in
 * `[0, 1)`. Deterministic: a given `seed` always yields the same sequence.
 *
 * @param seed - 32-bit unsigned integer seed.
 * @returns A function returning the next pseudo-random float in `[0, 1)`.
 */
export function mulberry32(seed: number): () => number {
	let a = seed >>> 0;
	return function next(): number {
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/**
 * Computes a deterministic editorial scatter layout for the home page.
 *
 * Items are sized 16–30vw (clamped to sane px bounds), distributed vertically
 * across the field with jitter, and leaned into irregular left/right clusters.
 * The central name zone (~46% width × 18% height of the first viewport) is kept
 * clear: items whose vertical span crosses that band are pushed entirely into a
 * side gutter, and all other items sit outside the band's vertical range, so the
 * name-reveal rectangle stays empty. Each item also receives a parallax `speed`
 * and an intro `delay` (dispersal order, nearest-to-centre first).
 *
 * @param photos - Photos to place, in their intended draw order.
 * @param viewport - Target viewport dimensions in px.
 * @param seed - Optional RNG seed; defaults to {@link DEFAULT_SCATTER_SEED}.
 * @returns The positioned {@link ScatterField}. Same inputs → identical output.
 */
export function computeScatterLayout(
	photos: Photo[],
	viewport: ScatterViewport,
	seed: number = DEFAULT_SCATTER_SEED
): ScatterField {
	const n = photos.length;
	const vw = viewport.width;
	const vh = viewport.height;

	const fieldHeight = Math.max(2.6, n / 8) * vh;

	if (n === 0) {
		return { items: [], fieldHeight };
	}

	const rng = mulberry32(seed);

	// Central name zone rectangle (first viewport only).
	const centerX = vw / 2;
	const centerY = vh / 2;
	const nameLeft = centerX - NAME_HALF_W_FRAC * vw;
	const nameRight = centerX + NAME_HALF_W_FRAC * vw;
	const nameTop = centerY - NAME_HALF_H_FRAC * vh;
	const nameBottom = centerY + NAME_HALF_H_FRAC * vh;

	const margin = Math.max(16, vw * 0.02);

	const items: ScatterItem[] = photos.map((photo, i) => {
		// Fixed draw order per item keeps the RNG stream deterministic.
		const rSize = rng();
		const rSide = rng();
		const rX = rng();
		const rYJitter = rng();
		const rSpeed = rng();

		// Size: vw-based width, clamped to px bounds; height follows aspect ratio.
		const frac = SIZE_MIN_VW + rSize * (SIZE_MAX_VW - SIZE_MIN_VW);
		let w = clamp(frac * vw, MIN_ITEM_PX, MAX_ITEM_PX);
		let h = w / photo.aspectRatio;

		// Vertical slot: even progression + bounded jitter → irregular but spread.
		const baseT = (i + 0.5) / n;
		const jitter = (rYJitter - 0.5) * (VERTICAL_JITTER / n);
		const t = clamp(baseT + jitter, 0, 1);
		let y = t * Math.max(0, fieldHeight - h);

		// Mostly-alternating side lean: index parity balances left/right down the
		// field (a pure coin flip can crowd one side of a viewport), with a 15%
		// deterministic flip so the rhythm never turns mechanical.
		const leanLeft = (i % 2 === 0) !== (rSide < 0.15);

		// Does this item's vertical span cross the name band? (First viewport only.)
		const inNameBand = y < nameBottom && y + h > nameTop;

		let x: number;
		if (inNameBand) {
			// Force the item entirely into a side gutter so the name zone stays clear.
			// Cap width to the gutter so even the widest items cannot intrude.
			const leftGutter = Math.max(1, nameLeft - margin);
			const rightGutter = Math.max(1, vw - margin - nameRight);
			const gutter = leanLeft ? leftGutter : rightGutter;

			if (w > gutter) {
				w = clamp(gutter, 1, MAX_ITEM_PX);
				h = w / photo.aspectRatio;
				// Width shrank, so re-derive the vertical position for the new height.
				y = t * Math.max(0, fieldHeight - h);
			}

			const xLo = leanLeft ? margin : nameRight;
			const xHi = leanLeft ? nameLeft - w : vw - margin - w;
			x = xLo + rX * Math.max(0, xHi - xLo);
		} else {
			// Free placement with a side lean; clusters may overlap through the middle.
			const xLo = leanLeft ? margin : LEAN_MAX_FRAC * vw - w;
			const xHi = leanLeft ? LEAN_MAX_FRAC * vw - w : vw - margin - w;
			const lo = Math.max(margin, xLo);
			const hi = Math.max(lo, xHi);
			x = lo + rX * (hi - lo);
		}

		x = clamp(x, 0, Math.max(0, vw - w));

		const speed = SPEED_MIN + rSpeed * (SPEED_MAX - SPEED_MIN);

		return {
			photo,
			x,
			y,
			w,
			h,
			z: i + 1,
			speed,
			delay: 0 // Assigned below once every position is known.
		};
	});

	// Intro dispersal order: nearest to the first-viewport centre reveals first.
	const denom = Math.max(1, n - 1);
	const order = items
		.map((item, i) => ({
			i,
			d: Math.hypot(item.x + item.w / 2 - centerX, item.y + item.h / 2 - centerY)
		}))
		.sort((a, b) => a.d - b.d || a.i - b.i);

	order.forEach((entry, rank) => {
		items[entry.i].delay = rank / denom;
	});

	return { items, fieldHeight };
}
