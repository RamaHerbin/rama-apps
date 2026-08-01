/**
 * Runs the "HDR?" intro against an absolute timeline: four glyph shells rise on
 * a stagger, hold their letters, then release together, and a small peony pops
 * the question-mark dot. A single injected rAF loop reads an injected clock, so
 * the whole thing runs deterministically under a fake clock in tests.
 *
 * Reduced-motion and the no-engine path are the caller's business — a
 * choreographer is only ever built with a live handle.
 */

import type { FireworksHandle } from '$lib/engine/types.js';
import type { GlyphTarget, PathPoint } from './glyph-targets.js';

export interface Choreographer {
	/** Play the intro over the four glyph targets; resolves when it settles. */
	playIntro(targets: GlyphTarget[]): Promise<void>;
	/** Cancel the loop, settle any pending promise, and refuse further work. */
	stop(): void;
}

export interface ChoreographerDeps {
	clock: () => number;
	raf: (cb: FrameRequestCallback) => number;
	caf: (id: number) => void;
}

/** Launch offsets (ms from intro start) and flight time per glyph. */
const LAUNCH_SCHEDULE = [
	{ at: 0, flightMs: 600 },
	{ at: 180, flightMs: 600 },
	{ at: 360, flightMs: 600 },
	{ at: 540, flightMs: 620 }
] as const;

/** All glyphs release their seekers at this absolute time → a 500 ms cascade. */
const RELEASE_AT_MS = 2000;
/** The "?" dot flourish pops here. */
const DOT_AT_MS = 1450;
/** playIntro resolves here → the verdict card enters. */
const RESOLVE_AT_MS = 2300;

const SEED_BASE = 0x1d;

interface Event {
	at: number;
	run: () => void;
}

export function createChoreographer(handle: FireworksHandle, deps: ChoreographerDeps): Choreographer {
	const { clock, raf, caf } = deps;

	let loopId: number | null = null;
	let resolveIntro: (() => void) | null = null;
	let disposed = false;

	function settle(): void {
		if (loopId !== null) {
			caf(loopId);
			loopId = null;
		}
		const resolve = resolveIntro;
		resolveIntro = null;
		if (resolve) resolve();
	}

	function launchGlyph(target: GlyphTarget, at: number, flightMs: number, index: number): void {
		handle.launch({
			apex: target.centroid,
			shell: 'glyph',
			glyphPoints: target.points,
			color: target.hue,
			flightMs,
			releaseAtMs: RELEASE_AT_MS - at,
			intensity: 'intro',
			seed: SEED_BASE + index
		});
	}

	function launchDot(target: GlyphTarget): void {
		const dot: PathPoint = target.points[target.points.length - 1] ?? target.centroid;
		handle.launch({
			apex: dot,
			// flightMs wins over apex height in the engine's solver, so a rocket
			// from the bottom would detonate long before reaching the dot. Start
			// the accent just below the dot instead: a short hop that bursts on it.
			from: { x: dot.x, y: Math.min(1, dot.y + 0.05) },
			shell: 'peony',
			color: target.hue,
			scale: 0.4,
			flightMs: 160,
			intensity: 'intro',
			seed: SEED_BASE + 0x63
		});
	}

	function buildEvents(targets: GlyphTarget[]): Event[] {
		const events: Event[] = [];
		const n = Math.min(LAUNCH_SCHEDULE.length, targets.length);
		for (let i = 0; i < n; i += 1) {
			const target = targets[i];
			const { at, flightMs } = LAUNCH_SCHEDULE[i];
			events.push({ at, run: () => launchGlyph(target, at, flightMs, i) });
		}
		const last = targets[targets.length - 1];
		if (last) events.push({ at: DOT_AT_MS, run: () => launchDot(last) });
		events.sort((a, b) => a.at - b.at);
		return events;
	}

	function playIntro(targets: GlyphTarget[]): Promise<void> {
		if (disposed) return Promise.resolve();

		return new Promise<void>((resolve) => {
			resolveIntro = resolve;
			const startedAt = clock();
			const events = buildEvents(targets);
			let idx = 0;

			const pump = (elapsed: number) => {
				while (idx < events.length && elapsed >= events[idx].at) {
					const event = events[idx];
					idx += 1;
					try {
						event.run();
					} catch (err) {
						console.warn('[hdr] intro launch', err);
					}
				}
			};

			const tick = () => {
				loopId = null;
				if (disposed) {
					settle();
					return;
				}
				const elapsed = clock() - startedAt;
				pump(elapsed);
				if (elapsed >= RESOLVE_AT_MS) {
					settle();
					return;
				}
				loopId = raf(tick);
			};

			// Fire the t=0 launch synchronously so it lands exactly at the start,
			// then let the loop drive the rest.
			pump(clock() - startedAt);
			if (disposed) {
				settle();
				return;
			}
			loopId = raf(tick);
		});
	}

	function stop(): void {
		disposed = true;
		settle();
	}

	return { playIntro, stop };
}
