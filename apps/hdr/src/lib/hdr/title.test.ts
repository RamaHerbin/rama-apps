import { describe, it, expect } from "vitest";
import { splitTitle } from "./title.js";
import { computeVerdict } from "./verdict.js";

describe("splitTitle", () => {
	it("splits at the first sentence boundary", () => {
		expect(splitTitle("Oh yes. Gloriously HDR.")).toEqual(["Oh yes.", "Gloriously HDR."]);
	});

	it("keeps a single sentence on one line", () => {
		expect(splitTitle("Not today.")).toEqual(["Not today."]);
	});

	it("returns a single empty line for an empty string", () => {
		expect(splitTitle("")).toEqual([""]);
	});

	it("splits only at the first boundary, leaving the rest on line two", () => {
		expect(splitTitle("A. B. C.")).toEqual(["A.", "B. C."]);
	});

	// One test per real verdict title, pinned to computeVerdict's actual output
	// (not a copy-pasted string) so a copy change in verdict.ts fails here too.
	describe("pinned to the real verdict titles", () => {
		it("true-hdr", () => {
			const verdict = computeVerdict({ dynamicRangeHigh: true, gamutP3: true }, "webgpu-hdr");
			expect(verdict.title).toBe("Oh yes. Gloriously HDR.");
			expect(splitTitle(verdict.title)).toEqual(["Oh yes.", "Gloriously HDR."]);
		});

		it("browser-clamped", () => {
			const verdict = computeVerdict({ dynamicRangeHigh: true, gamutP3: false }, "webgpu-sdr");
			expect(verdict.title).toBe("Your screen can. Your browser won't.");
			expect(splitTitle(verdict.title)).toEqual(["Your screen can.", "Your browser won't."]);
		});

		it("screen-sdr", () => {
			const verdict = computeVerdict({ dynamicRangeHigh: false, gamutP3: false }, "webgpu-hdr");
			expect(verdict.title).toBe("Browser's ready. Screen says no.");
			expect(splitTitle(verdict.title)).toEqual(["Browser's ready.", "Screen says no."]);
		});

		it("no-hdr (single sentence, stays on one line)", () => {
			const verdict = computeVerdict({ dynamicRangeHigh: false, gamutP3: false }, "none");
			expect(verdict.title).toBe("No HDR here today.");
			expect(splitTitle(verdict.title)).toEqual(["No HDR here today."]);
		});
	});
});
