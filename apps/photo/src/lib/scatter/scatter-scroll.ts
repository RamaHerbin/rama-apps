import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { IntroTarget } from '$lib/scatter/scatter-intro.js';

// Register the ScrollTrigger plugin exactly once, browser-only (no-op during SSR).
if (typeof window !== 'undefined') {
	gsap.registerPlugin(ScrollTrigger);
}

/** Parallax multiplier: how far one full viewport of scroll spreads the field. */
const SPREAD_FACTOR = 1.2;

/**
 * Handle to a running scatter-scroll parallax engine.
 */
export interface ScrollEngine {
	/** Kill the ScrollTrigger + tweens created here and clear the transforms they applied. */
	destroy(): void;
	/** Recompute ScrollTrigger measurements (call after layout or viewport changes). */
	refresh(): void;
}

/** Inert engine used for SSR or when there is nothing to animate. */
const NOOP_ENGINE: ScrollEngine = {
	destroy() {},
	refresh() {}
};

/**
 * Create the film-strip parallax engine: as the user scrolls `container`, each photo drifts
 * vertically at a per-item speed so the pile visibly spreads apart (pellicule effect).
 *
 * A single scrub-linked ScrollTrigger drives a timeline of per-item tweens. At scroll progress
 * `p` in [0, 1] each item's translateY equals `(item.speed - 1) * p * viewportHeight * 1.2`, so
 * items with speed < 1 lag behind the scroll and items with speed > 1 lead ahead of it.
 *
 * @param container - Scroll region whose top→bottom travel maps to progress 0→1.
 * @param targets - Element/item pairs (from the gallery) to parallax.
 * @returns A {@link ScrollEngine} handle; call `destroy()` on teardown.
 */
export function createScatterScroll(container: HTMLElement, targets: IntroTarget[]): ScrollEngine {
	// Browser-only, and nothing to do without targets.
	if (typeof window === 'undefined' || targets.length === 0) {
		return NOOP_ENGINE;
	}

	// One timeline holds every per-item tween, all starting at position 0 with equal duration so
	// they share the timeline's normalized progress. Function-based end values are re-evaluated on
	// refresh (via invalidateOnRefresh) to track viewport-height changes.
	const timeline = gsap.timeline({ paused: true });

	for (const { el, item } of targets) {
		const { speed } = item;
		timeline.fromTo(
			el,
			{ y: 0 },
			{
				y: () => (speed - 1) * window.innerHeight * SPREAD_FACTOR,
				duration: 1,
				ease: 'none'
			},
			0
		);
	}

	const trigger = ScrollTrigger.create({
		trigger: container,
		start: 'top top',
		end: 'bottom bottom',
		scrub: true,
		invalidateOnRefresh: true,
		animation: timeline
	});

	return {
		destroy() {
			trigger.kill();
			timeline.kill();
			for (const { el } of targets) {
				gsap.set(el, { clearProps: 'transform' });
			}
		},
		refresh() {
			ScrollTrigger.refresh();
		}
	};
}
