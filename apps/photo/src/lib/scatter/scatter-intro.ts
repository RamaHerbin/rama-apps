/**
 * Web Animations API timeline for the scatter home intro.
 *
 * Clean-room re-implementation of a behavioral spec (a pile of photos at the
 * viewport centre disperses outward to a scattered editorial layout, then the
 * name reveals). Original code, our images, our theme tokens. Pure timings,
 * easings and transforms live here; the stateful component that drives the
 * reveal (and consumes {@link INTRO_NAME_DELAY_MS}) owns the DOM lifecycle.
 *
 * Determinism: no `Math.random`/`Date.now` — per-item rotation is derived
 * purely from the item's z-index so identical layouts reproduce identical
 * intros across SSR/CSR.
 */

import type { ScatterItem } from '$lib/scatter/scatter-layout.js';

/** sessionStorage key marking the scatter intro as already played this session. */
export const INTRO_STORAGE_KEY = 'photoRamaScatterPlayed';

/** Per-item disperse duration (pile → final slot), in ms. */
export const INTRO_DISPERSE_MS = 1100;

/** Per-item start offset used to build the disperse stagger, in ms. */
export const INTRO_STAGGER_MS = 45;

/** Delay before the centre name reveals, measured from when the disperse begins, in ms. */
export const INTRO_NAME_DELAY_MS = 700;

/** Easing for the disperse animation (soft overshoot-free ease-out). */
export const EASE_DISPERSE = 'cubic-bezier(0.16, 1, 0.3, 1)';

/** Hard cap forcing `onDone` even if no animation ever settles, in ms. */
const INTRO_SAFETY_FALLBACK_MS = 3500;

/** Scale applied to each photo while stacked in the pile. */
const PILE_SCALE = 0.92;

/** Maximum absolute pile rotation, in degrees (rotation spans [-MAX, +MAX]). */
const MAX_INTRO_ROTATION_DEG = 6;

/** Size of the rotation residue set — odd so the range is symmetric about 0. */
const ROTATION_MODULUS = MAX_INTRO_ROTATION_DEG * 2 + 1;

/** Stride coprime to {@link ROTATION_MODULUS} so consecutive z values fan out evenly. */
const ROTATION_STRIDE = 7;

/**
 * Deterministic pile rotation for a stacked item, derived purely from its
 * z-index. Maps `z` onto the closed range `[-MAX_INTRO_ROTATION_DEG,
 * +MAX_INTRO_ROTATION_DEG]` degrees with no RNG.
 */
function rotationFromZ(z: number): number {
	return ((z * ROTATION_STRIDE) % ROTATION_MODULUS) - MAX_INTRO_ROTATION_DEG;
}

/** Maximum absolute pile centre offset per axis, in px. */
const MAX_PILE_OFFSET_PX = 34;

/** Residue set size for offsets — odd so the range is symmetric about 0. */
const OFFSET_MODULUS = MAX_PILE_OFFSET_PX * 2 + 1;

/** Strides coprime to {@link OFFSET_MODULUS} and distinct per axis. */
const OFFSET_STRIDE_X = 23;
const OFFSET_STRIDE_Y = 31;

/**
 * Deterministic small offset of a stacked item from the pile centre, derived
 * purely from its z-index. Without it every layer's centre lands on the exact
 * same point and the pile reads as a single photo; with it, edges of the
 * underlying layers peek out — the pile visibly holds many photos.
 */
function pileOffsetFromZ(z: number): { x: number; y: number } {
	return {
		x: ((z * OFFSET_STRIDE_X) % OFFSET_MODULUS) - MAX_PILE_OFFSET_PX,
		y: ((z * OFFSET_STRIDE_Y) % OFFSET_MODULUS) - MAX_PILE_OFFSET_PX
	};
}

/**
 * Whether the user has requested reduced motion. Returns `false` on the
 * server or where `matchMedia` is unavailable.
 */
export function prefersReducedMotion(): boolean {
	if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Whether the intro has already run this session. Guarded against SSR and
 * environments where sessionStorage throws (private mode, disabled, quota).
 */
export function introHasPlayed(): boolean {
	if (typeof window === 'undefined') return false;
	try {
		return window.sessionStorage.getItem(INTRO_STORAGE_KEY) === '1';
	} catch {
		return false;
	}
}

/** Marks the intro as played for this session. Silently no-ops if storage is unavailable. */
export function markIntroPlayed(): void {
	if (typeof window === 'undefined') return;
	try {
		window.sessionStorage.setItem(INTRO_STORAGE_KEY, '1');
	} catch {
		// Ignore storage errors (private mode, disabled, quota).
	}
}

/** A scattered photo element paired with the layout item that describes it. */
export interface IntroTarget {
	el: HTMLElement;
	item: ScatterItem;
}

/**
 * Runs the pile → scatter intro with the Web Animations API.
 *
 * Each element already sits at its final field position. For every target we
 * measure its resting centre, then animate its transform *from* a state that
 * pulls its centre onto `pileCenter` (plus a deterministic small rotation
 * derived from `item.z` and a slight `scale`) *to* `none`. Animations are
 * staggered by `item.delay`, stacked by `item.z`, and released back to inline
 * control on finish so a downstream scroll engine can drive `transform`.
 *
 * `onDone` fires once when every animation has settled, or when the safety
 * fallback elapses — whichever comes first.
 *
 * @param targets Elements to animate, each paired with its layout item.
 * @param pileCenter Viewport coordinates the pile converges on.
 * @param onDone Called exactly once when the disperse completes (or times out).
 * @returns `cancel()` — aborts all animations and timers and restores resting positions.
 */
export function runScatterIntro(
	targets: IntroTarget[],
	pileCenter: { x: number; y: number },
	onDone: () => void
): () => void {
	if (typeof window === 'undefined' || typeof document === 'undefined' || targets.length === 0) {
		onDone();
		return () => {};
	}

	// Read every resting rect first, in one batch, before mutating any transform
	// — avoids layout thrash and keeps the measured centres transform-free.
	const setups = targets.map(({ el, item }) => {
		const rect = el.getBoundingClientRect();
		return { el, item, cx: rect.left + rect.width / 2, cy: rect.top + rect.height / 2 };
	});

	const animations: Animation[] = [];
	const span = targets.length * INTRO_STAGGER_MS;
	let finished = 0;
	let settled = false;

	const callDone = () => {
		if (settled) return;
		settled = true;
		clearTimeout(safetyTimer);
		onDone();
	};

	const safetyTimer = setTimeout(callDone, INTRO_SAFETY_FALLBACK_MS);

	for (const { el, item, cx, cy } of setups) {
		const offset = pileOffsetFromZ(item.z);
		const dx = pileCenter.x + offset.x - cx;
		const dy = pileCenter.y + offset.y - cy;
		const rotation = rotationFromZ(item.z);
		const pileTransform = `translate(${dx}px, ${dy}px) rotate(${rotation}deg) scale(${PILE_SCALE})`;

		// Stack the pile by z-index, and pre-apply the pile transform inline so
		// the element never flashes at its final position before `animate` binds.
		el.style.zIndex = String(item.z);
		el.style.transform = pileTransform;

		const anim = el.animate([{ transform: pileTransform }, { transform: 'none' }], {
			duration: INTRO_DISPERSE_MS,
			delay: item.delay * span,
			easing: EASE_DISPERSE,
			fill: 'both'
		});

		anim.onfinish = () => {
			// Release the WAAPI forwards-fill hold (clear inline transform first so
			// cancelling never reveals the pile) so a scroll engine can own transform.
			el.style.transform = '';
			try {
				anim.cancel();
			} catch {
				// Animation already detached — nothing to release.
			}
			finished += 1;
			if (finished >= targets.length) callDone();
		};

		animations.push(anim);
	}

	return () => {
		settled = true; // Suppress any late onDone after an external abort.
		clearTimeout(safetyTimer);
		for (const anim of animations) {
			anim.onfinish = null;
			try {
				anim.cancel();
			} catch {
				// Already finished/cancelled — ignore.
			}
		}
		// Snap every element back to its resting (final) scatter position.
		for (const { el } of targets) el.style.transform = '';
	};
}
