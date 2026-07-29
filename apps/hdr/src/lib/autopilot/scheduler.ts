/**
 * Drives a FluidHandle-like target along timed paths: the "HDR?" trace (eased,
 * finite) and the ambient Lissajous loop (infinite, pauses on user activity).
 *
 * The only environment touched is the injected clock and rAF pair, so the whole
 * module runs unchanged under a fake clock in tests.
 */

import type { PathPoint, Stroke } from './letters.js';

export interface AutopilotTarget {
	moveTo(x: number, y: number): void;
	penUp(): void;
}

export interface AutopilotOptions {
	/** Total trace duration. Default 5000. */
	traceDurationMs?: number;
	/** Ambient resumes this long after the last user activity. Default 3000. */
	idleResumeMs?: number;
	/** Injectable clock/rAF for tests. */
	now?: () => number;
	raf?: (cb: FrameRequestCallback) => number;
	caf?: (id: number) => void;
}

export interface Autopilot {
	/** Trace the strokes once, eased; resolves on completion. Cancels a prior trace. */
	playTrace(strokes: Stroke[]): Promise<void>;
	/** Start the infinite ambient Lissajous loop. */
	startAmbient(): void;
	/** Signal user activity: pauses ambient, auto-resumes after idleResumeMs. */
	notifyUserActive(): void;
	stop(): void;
}

const DEFAULT_TRACE_DURATION_MS = 5000;
const DEFAULT_IDLE_RESUME_MS = 3000;

/** Ambient drift: a slow, wide Lissajous figure around the middle of the screen. */
const AMBIENT_X_AMPLITUDE = 0.33;
const AMBIENT_X_FREQUENCY_HZ = 0.05;
const AMBIENT_X_PHASE = Math.PI / 2;
const AMBIENT_Y_AMPLITUDE = 0.25;
const AMBIENT_Y_FREQUENCY_HZ = 0.033;

interface Segment {
	strokeIndex: number;
	from: PathPoint;
	to: PathPoint;
	length: number;
	/** Cumulative arc length at the start of this segment. */
	offset: number;
}

/**
 * Flatten the strokes into one arc-length-parameterized segment list. Jumps
 * between strokes are pen-up travel and contribute zero length; degenerate
 * (zero-length) segments are dropped so they can never divide by zero.
 */
function flatten(strokes: Stroke[]): { segments: Segment[]; total: number } {
	const segments: Segment[] = [];
	let total = 0;
	for (const [strokeIndex, stroke] of strokes.entries()) {
		let from: PathPoint | undefined;
		for (const to of stroke) {
			if (from) {
				const length = Math.hypot(to.x - from.x, to.y - from.y);
				if (length > 0) {
					segments.push({ strokeIndex, from, to, length, offset: total });
					total += length;
				}
			}
			from = to;
		}
	}
	return { segments, total };
}

/** Center of the screen: the neutral answer when there is nothing to trace. */
function fallbackPoint(): { point: PathPoint; strokeIndex: number } {
	return { point: { x: 0.5, y: 0.5 }, strokeIndex: 0 };
}

function firstPoint(strokes: Stroke[]): { point: PathPoint; strokeIndex: number } {
	for (const [strokeIndex, stroke] of strokes.entries()) {
		const point = stroke[0];
		if (point) return { point: { x: point.x, y: point.y }, strokeIndex };
	}
	return fallbackPoint();
}

function lastPoint(strokes: Stroke[]): { point: PathPoint; strokeIndex: number } {
	let found: { point: PathPoint; strokeIndex: number } | null = null;
	for (const [strokeIndex, stroke] of strokes.entries()) {
		const point = stroke[stroke.length - 1];
		if (point) found = { point: { x: point.x, y: point.y }, strokeIndex };
	}
	return found ?? fallbackPoint();
}

/**
 * Pure helper: position along the concatenated strokes at normalized time
 * t01 in [0,1], proportional to arc length. Unit-testable.
 */
export function pointAtTime(strokes: Stroke[], t01: number): { point: PathPoint; strokeIndex: number } {
	if (!Number.isFinite(t01) || t01 <= 0) return firstPoint(strokes);
	if (t01 >= 1) return lastPoint(strokes);

	const { segments, total } = flatten(strokes);
	if (segments.length === 0 || total <= 0) return firstPoint(strokes);

	const travelled = t01 * total;
	for (const segment of segments) {
		if (travelled <= segment.offset + segment.length) {
			const local = (travelled - segment.offset) / segment.length;
			return {
				point: {
					x: segment.from.x + (segment.to.x - segment.from.x) * local,
					y: segment.from.y + (segment.to.y - segment.from.y) * local
				},
				strokeIndex: segment.strokeIndex
			};
		}
	}

	// Floating-point overshoot only.
	const last = segments[segments.length - 1];
	return last
		? { point: { x: last.to.x, y: last.to.y }, strokeIndex: last.strokeIndex }
		: fallbackPoint();
}

function easeInOutCubic(t: number): number {
	const clamped = t < 0 ? 0 : t > 1 ? 1 : t;
	return clamped < 0.5 ? 4 * clamped * clamped * clamped : 1 - Math.pow(-2 * clamped + 2, 3) / 2;
}

function defaultNow(): number {
	if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
		return performance.now();
	}
	return Date.now();
}

/** No-op off the main thread (SSR): the loops simply never tick. */
function defaultRaf(cb: FrameRequestCallback): number {
	if (typeof requestAnimationFrame === 'function') return requestAnimationFrame(cb);
	return 0;
}

function defaultCaf(id: number): void {
	if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(id);
}

export function createAutopilot(target: AutopilotTarget, opts: AutopilotOptions = {}): Autopilot {
	const traceDurationMs = opts.traceDurationMs ?? DEFAULT_TRACE_DURATION_MS;
	const idleResumeMs = opts.idleResumeMs ?? DEFAULT_IDLE_RESUME_MS;
	const now = opts.now ?? defaultNow;
	const raf = opts.raf ?? defaultRaf;
	const caf = opts.caf ?? defaultCaf;

	let traceTick: number | null = null;
	let ambientTick: number | null = null;
	let resolveTrace: (() => void) | null = null;
	/** -Infinity until the first notifyUserActive, so ambient starts unblocked. */
	let lastUserActiveAt = Number.NEGATIVE_INFINITY;
	/** Lift the pen before the next ambient splat (start, or a resume). */
	let ambientNeedsPenUp = true;

	/** Settle a pending trace promise so an awaited, cancelled trace never hangs. */
	function settleTrace(): void {
		const resolve = resolveTrace;
		resolveTrace = null;
		if (resolve) resolve();
	}

	function cancelTrace(): void {
		if (traceTick !== null) {
			caf(traceTick);
			traceTick = null;
		}
		settleTrace();
	}

	function cancelAmbient(): void {
		if (ambientTick !== null) {
			caf(ambientTick);
			ambientTick = null;
		}
	}

	function playTrace(strokes: Stroke[]): Promise<void> {
		cancelTrace();
		cancelAmbient();

		return new Promise<void>((resolve) => {
			resolveTrace = resolve;
			const startedAt = now();
			// Exactly one lift before the first splat, so the trace never draws a
			// line in from wherever the pointer happened to be. The starting point
			// is emitted synchronously so the trace begins at t01 = 0 exactly, not
			// wherever the first animation frame happens to land.
			target.penUp();
			const start = pointAtTime(strokes, 0);
			target.moveTo(start.point.x, start.point.y);
			let lastStrokeIndex: number | null = start.strokeIndex;

			const tick = () => {
				traceTick = null;
				const elapsed = traceDurationMs > 0 ? (now() - startedAt) / traceDurationMs : 1;

				if (elapsed >= 1) {
					const end = pointAtTime(strokes, 1);
					target.moveTo(end.point.x, end.point.y);
					target.penUp();
					settleTrace();
					return;
				}

				const { point, strokeIndex } = pointAtTime(strokes, easeInOutCubic(elapsed));
				// A new stroke means pen-up travel: lift before repositioning.
				if (lastStrokeIndex !== null && strokeIndex !== lastStrokeIndex) target.penUp();
				lastStrokeIndex = strokeIndex;
				target.moveTo(point.x, point.y);
				traceTick = raf(tick);
			};

			traceTick = raf(tick);
		});
	}

	function startAmbient(): void {
		cancelAmbient();
		const startedAt = now();
		ambientNeedsPenUp = true;

		const tick = () => {
			ambientTick = null;
			if (now() - lastUserActiveAt < idleResumeMs) {
				// The real cursor owns the fluid while the user is active.
				ambientNeedsPenUp = true;
			} else {
				const t = (now() - startedAt) / 1000;
				const x =
					0.5 +
					AMBIENT_X_AMPLITUDE *
						Math.sin(2 * Math.PI * AMBIENT_X_FREQUENCY_HZ * t + AMBIENT_X_PHASE);
				const y = 0.5 + AMBIENT_Y_AMPLITUDE * Math.sin(2 * Math.PI * AMBIENT_Y_FREQUENCY_HZ * t);
				if (ambientNeedsPenUp) {
					target.penUp();
					ambientNeedsPenUp = false;
				}
				target.moveTo(x, y);
			}
			ambientTick = raf(tick);
		};

		ambientTick = raf(tick);
	}

	function notifyUserActive(): void {
		lastUserActiveAt = now();
		// Whatever the tick granularity, the resume starts with a lift.
		ambientNeedsPenUp = true;
	}

	function stop(): void {
		cancelTrace();
		cancelAmbient();
	}

	return { playTrace, startAmbient, notifyUserActive, stop };
}
