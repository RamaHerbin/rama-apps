import { describe, it, expect } from 'vitest';
import { HDR_GLYPHS } from '$lib/glyphs/letters.js';
import type { LayoutOptions } from '$lib/glyphs/letters.js';
import {
	DEFAULT_SPACING,
	GLYPH_GAP,
	GLYPH_HUES,
	GLYPH_STROKE_COUNTS,
	buildGlyphTargets,
	fitGlyphHeight,
	layoutGlyphs,
	sampleGlyphTargets,
	type GlyphKey
} from './glyph-targets.js';

const OPTS: LayoutOptions = { center: { x: 0.5, y: 0.4 }, height: 0.44, gap: 0.1, aspect: 16 / 9 };

describe('layoutGlyphs', () => {
	it('slices the run into per-glyph stroke groups [3,2,3,2]', () => {
		const groups = layoutGlyphs(OPTS);
		expect(groups.map((g) => g.key)).toEqual(['H', 'D', 'R', '?']);
		expect(groups.map((g) => g.strokes.length)).toEqual([3, 2, 3, 2]);
	});

	it('matches GLYPH_STROKE_COUNTS', () => {
		const groups = layoutGlyphs(OPTS);
		for (const group of groups) {
			expect(group.strokes.length).toBe(GLYPH_STROKE_COUNTS[group.key]);
		}
	});
});

describe('sampleGlyphTargets — counts at default spacing 0.028', () => {
	const cases: Record<GlyphKey, [number, number]> = {
		H: [95, 110],
		D: [105, 120],
		R: [122, 136],
		'?': [46, 56]
	};

	for (const key of ['H', 'D', 'R', '?'] as const) {
		it(`"${key}" seeker count lands in range`, () => {
			const count = sampleGlyphTargets(HDR_GLYPHS[key].strokes, DEFAULT_SPACING).length;
			const [lo, hi] = cases[key];
			expect(count).toBeGreaterThanOrEqual(lo);
			expect(count).toBeLessThanOrEqual(hi);
		});
	}

	it('emits n+1 points per stroke and never bridges a pen-up gap', () => {
		// Two separate unit segments: each is length 1 → round(1/0.5)=2 intervals
		// → 3 points, so 6 total (never 5, which would mean bridging the gap).
		const strokes = [
			[
				{ x: 0, y: 0 },
				{ x: 1, y: 0 }
			],
			[
				{ x: 0, y: 1 },
				{ x: 1, y: 1 }
			]
		];
		expect(sampleGlyphTargets(strokes, 0.5).length).toBe(6);
	});
});

describe('buildGlyphTargets', () => {
	it('returns the four letters in order', () => {
		const targets = buildGlyphTargets(OPTS);
		expect(targets).toHaveLength(4);
	});

	it('keeps every seeker target inside [0,1]²', () => {
		const targets = buildGlyphTargets(OPTS);
		for (const target of targets) {
			expect(target.points.length).toBeGreaterThan(0);
			for (const point of target.points) {
				expect(point.x).toBeGreaterThanOrEqual(0);
				expect(point.x).toBeLessThanOrEqual(1);
				expect(point.y).toBeGreaterThanOrEqual(0);
				expect(point.y).toBeLessThanOrEqual(1);
			}
			expect(target.centroid.x).toBeGreaterThanOrEqual(0);
			expect(target.centroid.x).toBeLessThanOrEqual(1);
			expect(target.centroid.y).toBeGreaterThanOrEqual(0);
			expect(target.centroid.y).toBeLessThanOrEqual(1);
		}
	});

	it('packs the "?" denser than the default spacing (0.014 override)', () => {
		const targets = buildGlyphTargets(OPTS);
		const question = targets[3];
		// At 0.014 the hook alone samples ~98 points vs ~49 at 0.028.
		expect(question.points.length).toBeGreaterThan(80);
	});

	it('assigns H=cyan, D=blue, R=violet, ?=magenta', () => {
		const targets = buildGlyphTargets(OPTS);
		expect(targets[0].hue).toEqual(GLYPH_HUES.H);
		expect(targets[1].hue).toEqual(GLYPH_HUES.D);
		expect(targets[2].hue).toEqual(GLYPH_HUES.R);
		expect(targets[3].hue).toEqual(GLYPH_HUES['?']);
	});
});

describe('fitGlyphHeight', () => {
	it('keeps the full design height on a 16:9 landscape viewport', () => {
		const fit = fitGlyphHeight(16 / 9);
		expect(fit.height).toBe(0.44);
		expect(fit.centerY).toBe(0.4);
	});

	it('scales the run down and nudges it up on a 390×844 portrait', () => {
		const aspect = 390 / 844;
		const fit = fitGlyphHeight(aspect);
		expect(fit.height).toBeLessThan(0.44);
		expect(fit.height).toBeGreaterThan(0);
		expect(fit.centerY).toBe(0.35);
	});

	it('fits every "HDR?" seeker inside the launch band [0.08, 0.92] on portrait', () => {
		const aspect = 390 / 844;
		const fit = fitGlyphHeight(aspect);
		const targets = buildGlyphTargets({
			center: { x: 0.5, y: fit.centerY },
			height: fit.height,
			gap: GLYPH_GAP,
			aspect
		});
		for (const target of targets) {
			for (const point of target.points) {
				expect(point.x).toBeGreaterThanOrEqual(0.08);
				expect(point.x).toBeLessThanOrEqual(0.92);
			}
		}
	});

	it('scales a square viewport down but leaves it vertically centered', () => {
		const fit = fitGlyphHeight(1);
		expect(fit.height).toBeLessThan(0.44);
		expect(fit.height).toBeGreaterThan(0);
		expect(fit.centerY).toBe(0.4);
	});

	it('leaves seeker counts identical across a wide and a narrow fit', () => {
		const wide = buildGlyphTargets({ center: { x: 0.5, y: 0.4 }, height: 0.44, gap: GLYPH_GAP, aspect: 16 / 9 });
		const narrowFit = fitGlyphHeight(390 / 844);
		const narrow = buildGlyphTargets({
			center: { x: 0.5, y: narrowFit.centerY },
			height: narrowFit.height,
			gap: GLYPH_GAP,
			aspect: 390 / 844
		});
		expect(narrow.map((t) => t.points.length)).toEqual(wide.map((t) => t.points.length));
	});

	it('falls back to a finite positive height for a degenerate aspect', () => {
		const fit = fitGlyphHeight(0);
		expect(Number.isFinite(fit.height)).toBe(true);
		expect(fit.height).toBeGreaterThan(0);
	});
});

describe('GLYPH_HUES', () => {
	// Channel dominance, robust to the sRGB→linear transform.
	it('cyan (H): blue and green lead, red trails', () => {
		const { r, g, b } = GLYPH_HUES.H;
		expect(b).toBeGreaterThan(r);
		expect(g).toBeGreaterThan(r);
	});
	it('blue (D): blue leads', () => {
		const { r, g, b } = GLYPH_HUES.D;
		expect(b).toBeGreaterThan(r);
		expect(b).toBeGreaterThan(g);
	});
	it('violet (R): red and blue over green', () => {
		const { r, g, b } = GLYPH_HUES.R;
		expect(r).toBeGreaterThan(g);
		expect(b).toBeGreaterThan(g);
	});
	it('magenta (?): red leads, green trails', () => {
		const { r, g, b } = GLYPH_HUES['?'];
		expect(r).toBeGreaterThan(g);
		expect(b).toBeGreaterThan(g);
	});
	it('stays within [0,1] per channel', () => {
		for (const key of ['H', 'D', 'R', '?'] as const) {
			const hue = GLYPH_HUES[key];
			for (const channel of [hue.r, hue.g, hue.b]) {
				expect(channel).toBeGreaterThanOrEqual(0);
				expect(channel).toBeLessThanOrEqual(1);
			}
		}
	});
});
