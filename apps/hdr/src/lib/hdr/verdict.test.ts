import { describe, it, expect } from "vitest";
import { computeVerdict } from "./verdict.js";
import type { DisplaySignals } from "./detect.js";

const high = (gamutP3: boolean): DisplaySignals => ({ dynamicRangeHigh: true, gamutP3 });
const sdr = (gamutP3: boolean): DisplaySignals => ({ dynamicRangeHigh: false, gamutP3 });

describe("computeVerdict", () => {
	it("is true-hdr/yes for a high-dynamic-range display rendering webgpu-hdr", () => {
		const verdict = computeVerdict(high(true), "webgpu-hdr");
		expect(verdict.case).toBe("true-hdr");
		expect(verdict.yes).toBe(true);
	});

	it("is browser-clamped/no for a high-dynamic-range display stuck on webgpu-sdr", () => {
		const verdict = computeVerdict(high(true), "webgpu-sdr");
		expect(verdict.case).toBe("browser-clamped");
		expect(verdict.yes).toBe(false);
	});

	it("is browser-clamped/no (and mentions the GPU) for a high-dynamic-range display with no GPU rendering", () => {
		const verdict = computeVerdict(high(true), "none");
		expect(verdict.case).toBe("browser-clamped");
		expect(verdict.yes).toBe(false);
		expect(verdict.body.toLowerCase()).toContain("gpu");
	});

	it("is screen-sdr/no for a non-HDR display even when webgpu-hdr renders", () => {
		const verdict = computeVerdict(sdr(false), "webgpu-hdr");
		expect(verdict.case).toBe("screen-sdr");
		expect(verdict.yes).toBe(false);
	});

	it("is no-hdr/no with a P3 'Partial credit' flavor when the display has a P3 gamut", () => {
		const verdict = computeVerdict(sdr(true), "webgl-p3");
		expect(verdict.case).toBe("no-hdr");
		expect(verdict.yes).toBe(false);
		expect(verdict.body).toContain("Partial credit");
	});

	it("is no-hdr/no without the P3 flavor when the display has no P3 gamut", () => {
		const verdict = computeVerdict(sdr(false), "webgl-p3");
		expect(verdict.case).toBe("no-hdr");
		expect(verdict.yes).toBe(false);
		expect(verdict.body).not.toContain("Partial credit");
	});

	it("includes the render level and both signal words in the detail string", () => {
		const verdict = computeVerdict(high(true), "webgpu-hdr");
		expect(verdict.detail).toContain("webgpu-hdr");
		expect(verdict.detail).toContain("dynamic-range");
		expect(verdict.detail).toContain("color-gamut");
	});
});
