/**
 * Pure verdict matrix: display signals × render level → friendly verdict.
 *
 * Pure on purpose (no DOM, no imports beyond types) — it runs under the node
 * test environment and is the single source of truth for the answer copy.
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

function formatDetail(display: DisplaySignals, render: RenderLevel): string {
	const dynamicRange = display.dynamicRangeHigh ? 'high' : 'standard';
	const gamut = display.gamutP3 ? 'p3' : 'srgb';
	return `render: ${render} · dynamic-range: ${dynamicRange} · color-gamut: ${gamut}`;
}

export function computeVerdict(display: DisplaySignals, render: RenderLevel): Verdict {
	const detail = formatDetail(display, render);
	// Only WebGPU with extended tone mapping actually paints above white; every
	// other level is SDR output no matter how capable the screen is.
	const rendersHdr = render === 'webgpu-hdr';

	if (display.dynamicRangeHigh && rendersHdr) {
		return {
			case: 'true-hdr',
			yes: true,
			title: 'Oh yes. Gloriously HDR.',
			body: "Your screen AND your browser are showing off — that glow up there is literally brighter than white. If the two swatches below look different, that's HDR at work.",
			detail
		};
	}

	if (display.dynamicRangeHigh) {
		let body =
			'This display speaks HDR, but this browser clamps the canvas to plain old SDR. Try Chrome or Edge on this same machine and watch it glow.';
		if (render === 'none') {
			body += " (This browser couldn't start GPU rendering at all.)";
		}
		return {
			case: 'browser-clamped',
			yes: false,
			title: "Your screen can. Your browser won't.",
			body,
			detail
		};
	}

	if (rendersHdr) {
		return {
			case: 'screen-sdr',
			yes: false,
			title: "Browser's ready. Screen says no.",
			body: "Your browser would happily paint brighter-than-white — this display (or its current mode) can't show it. On some laptops HDR headroom also vanishes at max brightness.",
			detail
		};
	}

	let body = 'Everything you see is standard dynamic range — still pretty, right?';
	if (display.gamutP3) {
		body += ' You do get P3 wide gamut though. Partial credit.';
	}
	return {
		case: 'no-hdr',
		yes: false,
		title: 'No HDR here today.',
		body,
		detail
	};
}
