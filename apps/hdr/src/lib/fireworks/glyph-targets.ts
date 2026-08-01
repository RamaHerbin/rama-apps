/**
 * Turns the "HDR?" glyph polylines into fireworks-seeker targets: one target
 * set per letter, each a cloud of normalized [0,1] points the glyph shell's
 * seekers spring to before the release cascade.
 *
 * Sampling density is defined in GLYPH-LOCAL units (fraction of glyph height)
 * so the seeker count per letter is stable regardless of where the run lands on
 * screen — the layout transform only moves the sampled points, it does not
 * change how many there are. Verified glyph-local arc lengths (H=2.750,
 * D=3.064, R=3.515, ?=1.396) give, per-stroke at spacing 0.028, counts
 * H=102 · D=112 · R=129 · ?=51 (the "?" renders at the 0.014 override → 102).
 */

import type { ColorRGB } from '$lib/engine/types.js';
import {
	HDR_GLYPHS,
	layoutText,
	type Glyph,
	type LayoutOptions,
	type PathPoint,
	type Stroke
} from '$lib/glyphs/letters.js';

export type { PathPoint } from '$lib/glyphs/letters.js';

export type GlyphKey = 'H' | 'D' | 'R' | '?';

/** One letter's worth of seeker targets, already placed in screen space. */
export interface GlyphTarget {
	points: PathPoint[];
	centroid: PathPoint;
	hue: ColorRGB;
}

/** Stroke count per glyph — used to slice the flat layoutText output back apart. */
export const GLYPH_STROKE_COUNTS: Record<GlyphKey, number> = { H: 3, D: 2, R: 3, '?': 2 };

/** The order the letters are laid out and launched in. */
const GLYPH_ORDER: GlyphKey[] = ['H', 'D', 'R', '?'];

/** Default seeker spacing (fraction of glyph height); the "?" packs tighter. */
export const DEFAULT_SPACING = 0.028;
const QUESTION_SPACING = 0.014;

// ── "HDR?" run layout constants (shared by the fit helper and the app) ──────
/** Gap between glyphs, as a fraction of glyph height. */
export const GLYPH_GAP = 0.1;
/** Run center x — the letters are always horizontally centered. */
export const GLYPH_CENTER_X = 0.5;
/** Glyph height at wide aspect, as a fraction of viewport height. */
export const GLYPH_HEIGHT_FULL = 0.44;
/** Run center y at wide aspect; portrait nudges the run up to clear the card. */
const GLYPH_CENTER_Y_FULL = 0.4;
const GLYPH_CENTER_Y_PORTRAIT = 0.35;
/**
 * Widest the run may be in normalized x. The run must sit inside the launch
 * band LAUNCH_X ∈ [0.08, 0.92] (art-direction §4.1); solving to 0.82 (a hair
 * under the full 0.84 span) keeps the outermost stem off the edge with float
 * headroom, while still leaving a 16:9 viewport at the full design height.
 */
const GLYPH_MAX_RUN_WIDTH = 0.82;

/** sRGB channel [0,1] → linear light, matching how the engine parses its palette. */
function srgbToLinear(c: number): number {
	return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** Hex → linear RGB so glyph hues sit in the same space as launch() colours. */
function hexToLinearRgb(hex: string): ColorRGB {
	const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	if (!m) return { r: 1, g: 1, b: 1 };
	return {
		r: srgbToLinear(parseInt(m[1], 16) / 255),
		g: srgbToLinear(parseInt(m[2], 16) / 255),
		b: srgbToLinear(parseInt(m[3], 16) / 255)
	};
}

/** Per-glyph launch hue: H=cyan, D=blue, R=violet, ?=magenta (linear light). */
export const GLYPH_HUES: Record<GlyphKey, ColorRGB> = {
	H: hexToLinearRgb('#42cfff'),
	D: hexToLinearRgb('#3d5bff'),
	R: hexToLinearRgb('#a142ff'),
	'?': hexToLinearRgb('#ff2fd6')
};

/**
 * Lay the run out with `layoutText`, then slice the flat stroke list back into
 * per-glyph groups using the known stroke counts. The screen-space strokes are
 * handy for debugging / overlays; the seeker targets themselves are sampled in
 * glyph-local space (see `buildGlyphTargets`).
 */
export function layoutGlyphs(opts: LayoutOptions): { key: GlyphKey; strokes: Stroke[] }[] {
	const glyphs = GLYPH_ORDER.map((key) => HDR_GLYPHS[key]);
	const flat = layoutText(glyphs, opts);
	const groups: { key: GlyphKey; strokes: Stroke[] }[] = [];
	let cursor = 0;
	for (const key of GLYPH_ORDER) {
		const count = GLYPH_STROKE_COUNTS[key];
		groups.push({ key, strokes: flat.slice(cursor, cursor + count) });
		cursor += count;
	}
	return groups;
}

/** Polyline arc length of a single stroke. */
function strokeLength(stroke: Stroke): number {
	let total = 0;
	for (let i = 1; i < stroke.length; i += 1) {
		total += Math.hypot(stroke[i].x - stroke[i - 1].x, stroke[i].y - stroke[i - 1].y);
	}
	return total;
}

/** Point at arc-length fraction `t01` along one stroke (linear between vertices). */
function pointAlong(stroke: Stroke, length: number, t01: number): PathPoint {
	if (stroke.length === 1 || length <= 0) return { x: stroke[0].x, y: stroke[0].y };
	const target = t01 * length;
	let travelled = 0;
	for (let i = 1; i < stroke.length; i += 1) {
		const seg = Math.hypot(stroke[i].x - stroke[i - 1].x, stroke[i].y - stroke[i - 1].y);
		if (seg <= 0) continue;
		if (travelled + seg >= target) {
			const local = (target - travelled) / seg;
			return {
				x: stroke[i - 1].x + (stroke[i].x - stroke[i - 1].x) * local,
				y: stroke[i - 1].y + (stroke[i].y - stroke[i - 1].y) * local
			};
		}
		travelled += seg;
	}
	const last = stroke[stroke.length - 1];
	return { x: last.x, y: last.y };
}

/**
 * Evenly sample every stroke by arc length, `spacing` apart. Each stroke gets
 * `n = max(1, round(L / spacing))` intervals → `n + 1` points, and points are
 * never carried across the pen-up gap between strokes.
 */
export function sampleGlyphTargets(strokes: Stroke[], spacing: number): PathPoint[] {
	const step = spacing > 0 ? spacing : DEFAULT_SPACING;
	const out: PathPoint[] = [];
	for (const stroke of strokes) {
		if (stroke.length === 0) continue;
		const length = strokeLength(stroke);
		const n = Math.max(1, Math.round(length / step));
		for (let i = 0; i <= n; i += 1) {
			out.push(pointAlong(stroke, length, i / n));
		}
	}
	return out;
}

function clamp01(value: number): number {
	if (value < 0) return 0;
	if (value > 1) return 1;
	return value;
}

/** Same per-glyph placement `layoutText` uses, kept so glyph-local samples can be projected. */
function penOffsets(glyphs: Glyph[], opts: LayoutOptions): number[] {
	const { height, gap } = opts;
	const advanceOf = (glyph: Glyph) => glyph.width * height + gap * height;
	let runWidth = -gap * height;
	for (const glyph of glyphs) runWidth += advanceOf(glyph);

	const offsets: number[] = [];
	let pen = -runWidth / 2;
	for (const glyph of glyphs) {
		offsets.push(pen);
		pen += advanceOf(glyph);
	}
	return offsets;
}

/** Run advance width in glyph-height units: Σ glyph widths + inter-glyph gaps. */
function runWidthCoefficient(): number {
	const glyphs = GLYPH_ORDER.map((key) => HDR_GLYPHS[key]);
	const sumWidth = glyphs.reduce((total, glyph) => total + glyph.width, 0);
	return sumWidth + (glyphs.length - 1) * GLYPH_GAP;
}

/**
 * Fit the "HDR?" run to the viewport aspect. At wide aspect the run sits at the
 * full design height; as the viewport narrows the run would overflow the launch
 * band LAUNCH_X ∈ [0.08, 0.92], so the height is scaled down until the whole run
 * fits inside it (run width = coeff · height / aspect ≤ GLYPH_MAX_RUN_WIDTH).
 * Portrait viewports (aspect < 1) also nudge the run up to leave the verdict
 * card room below.
 *
 * Pure. Only the projection scale changes — seeker counts are sampled in
 * glyph-local units and stay identical across every fit.
 */
export function fitGlyphHeight(aspect: number): { height: number; centerY: number } {
	const a = aspect > 0 && Number.isFinite(aspect) ? aspect : 1;
	const maxHeightForWidth = (GLYPH_MAX_RUN_WIDTH * a) / runWidthCoefficient();
	const height = Math.min(GLYPH_HEIGHT_FULL, maxHeightForWidth);
	const centerY = a < 1 ? GLYPH_CENTER_Y_PORTRAIT : GLYPH_CENTER_Y_FULL;
	return { height, centerY };
}

/**
 * Build the four seeker-target clouds for "HDR?". Each glyph is sampled in
 * glyph-local space (so counts stay put) and projected to screen space with the
 * same affine `layoutText` applies, giving in-bounds [0,1] points, a centroid
 * for the shell apex, and the launch hue.
 */
export function buildGlyphTargets(
	opts: LayoutOptions,
	spacingByKey?: Partial<Record<GlyphKey, number>>
): GlyphTarget[] {
	const glyphs = GLYPH_ORDER.map((key) => HDR_GLYPHS[key]);
	const { center, height } = opts;
	const aspect = opts.aspect > 0 && Number.isFinite(opts.aspect) ? opts.aspect : 1;
	const offsets = penOffsets(glyphs, opts);

	const targets: GlyphTarget[] = [];
	for (let i = 0; i < GLYPH_ORDER.length; i += 1) {
		const key = GLYPH_ORDER[i];
		const spacing = spacingByKey?.[key] ?? (key === '?' ? QUESTION_SPACING : DEFAULT_SPACING);
		const local = sampleGlyphTargets(HDR_GLYPHS[key].strokes, spacing);
		const penX = offsets[i];

		let sumX = 0;
		let sumY = 0;
		const points = local.map((p) => {
			const point = {
				x: clamp01(center.x + (penX + p.x * height) / aspect),
				y: clamp01(center.y + (p.y - 0.5) * height)
			};
			sumX += point.x;
			sumY += point.y;
			return point;
		});
		const centroid = points.length
			? { x: sumX / points.length, y: sumY / points.length }
			: { x: center.x, y: center.y };
		targets.push({ points, centroid, hue: GLYPH_HUES[key] });
	}
	return targets;
}
