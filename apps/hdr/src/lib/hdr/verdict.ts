/**
 * STUB — WP3 replaces this file. Pure verdict matrix:
 * display signals × render level → friendly verdict.
 */

import type { RenderLevel } from '../engine/types.js';
import type { DisplaySignals } from './detect.js';

export type VerdictCase = 'true-hdr' | 'browser-clamped' | 'screen-sdr' | 'no-hdr';

export interface Verdict {
	case: VerdictCase;
	/** The headline answer to "Is your screen HDR?". */
	yes: boolean;
	title: string;
	body: string;
	/** Raw nerd line, e.g. "render: webgpu-hdr · dynamic-range: high · color-gamut: p3". */
	detail: string;
}

export function computeVerdict(_display: DisplaySignals, _render: RenderLevel): Verdict {
	throw new Error('not implemented (WP3)');
}
