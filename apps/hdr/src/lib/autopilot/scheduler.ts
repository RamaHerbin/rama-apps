/**
 * STUB — WP2 replaces this file. Drives a FluidHandle-like target along
 * timed paths: the "HDR?" trace (eased, finite) and the ambient Lissajous
 * loop (infinite, pauses on user activity).
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

/**
 * Pure helper: position along the concatenated strokes at normalized time
 * t01 in [0,1], proportional to arc length. Unit-testable.
 */
export function pointAtTime(_strokes: Stroke[], _t01: number): { point: PathPoint; strokeIndex: number } {
	throw new Error('not implemented (WP2)');
}

export function createAutopilot(_target: AutopilotTarget, _opts?: AutopilotOptions): Autopilot {
	throw new Error('not implemented (WP2)');
}
