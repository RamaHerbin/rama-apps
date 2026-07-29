import { describe, it, expect } from "vitest";
import { HDR_GLYPHS, layoutText } from "./letters.js";
import type { Stroke } from "./letters.js";

function arcLength(strokes: Stroke[]): number {
	let total = 0;
	for (const stroke of strokes) {
		for (let i = 1; i < stroke.length; i++) {
			const a = stroke[i - 1];
			const b = stroke[i];
			total += Math.hypot(b.x - a.x, b.y - a.y);
		}
	}
	return total;
}

describe("HDR_GLYPHS", () => {
	for (const key of ["H", "D", "R", "?"] as const) {
		describe(`glyph "${key}"`, () => {
			const glyph = HDR_GLYPHS[key];

			it("has at least one stroke", () => {
				expect(glyph.strokes.length).toBeGreaterThanOrEqual(1);
			});

			it("has only strokes with at least two points", () => {
				for (const stroke of glyph.strokes) {
					expect(stroke.length).toBeGreaterThanOrEqual(2);
				}
			});

			it("keeps every point within [0,1]", () => {
				for (const stroke of glyph.strokes) {
					for (const point of stroke) {
						expect(point.x).toBeGreaterThanOrEqual(0);
						expect(point.x).toBeLessThanOrEqual(1);
						expect(point.y).toBeGreaterThanOrEqual(0);
						expect(point.y).toBeLessThanOrEqual(1);
					}
				}
			});
		});
	}
});

describe("layoutText", () => {
	const glyphs = [HDR_GLYPHS.H, HDR_GLYPHS.D, HDR_GLYPHS.R, HDR_GLYPHS["?"]];
	const opts = { center: { x: 0.5, y: 0.42 }, height: 0.26, gap: 0.06, aspect: 16 / 9 };

	it("produces a non-empty set of strokes", () => {
		const strokes = layoutText(glyphs, opts);
		expect(strokes.length).toBeGreaterThan(0);
	});

	it("keeps every point within [0,1]", () => {
		const strokes = layoutText(glyphs, opts);
		expect(strokes.length).toBeGreaterThan(0);
		for (const stroke of strokes) {
			for (const point of stroke) {
				expect(point.x).toBeGreaterThanOrEqual(0);
				expect(point.x).toBeLessThanOrEqual(1);
				expect(point.y).toBeGreaterThanOrEqual(0);
				expect(point.y).toBeLessThanOrEqual(1);
			}
		}
	});

	it("centers the horizontal extent on 0.5 within tolerance 0.05", () => {
		const strokes = layoutText(glyphs, opts);
		const xs = strokes.flatMap((stroke) => stroke.map((point) => point.x));
		expect(xs.length).toBeGreaterThan(0);
		const min = Math.min(...xs);
		const max = Math.max(...xs);
		const mid = (min + max) / 2;
		expect(mid).toBeGreaterThanOrEqual(0.5 - 0.05);
		expect(mid).toBeLessThanOrEqual(0.5 + 0.05);
	});

	it("draws all four letters (total arc length > 0.5)", () => {
		const strokes = layoutText(glyphs, opts);
		expect(arcLength(strokes)).toBeGreaterThan(0.5);
	});
});
