import { describe, it, expect } from "vitest";
import { createAutopilot, pointAtTime } from "./scheduler.js";
import type { AutopilotTarget } from "./scheduler.js";
import type { Stroke } from "./letters.js";

interface Harness {
	now: () => number;
	raf: (cb: FrameRequestCallback) => number;
	caf: (id: number) => void;
	tick: (ms: number) => void;
}

function createHarness(): Harness {
	let t = 0;
	const rafQueue: Array<FrameRequestCallback | null> = [];
	const raf = (cb: FrameRequestCallback) => (rafQueue.push(cb), rafQueue.length);
	const caf = (id: number) => {
		rafQueue[id - 1] = null;
	};
	const now = () => t;
	const tick = (ms: number) => {
		t += ms;
		const cbs = rafQueue.splice(0);
		for (const cb of cbs) if (cb) cb(t);
	};
	return { now, raf, caf, tick };
}

interface RecordingTarget {
	target: AutopilotTarget;
	moves: [number, number][];
	order: string[];
	penUps: { count: number };
}

function createTarget(): RecordingTarget {
	const moves: [number, number][] = [];
	const order: string[] = [];
	const penUps = { count: 0 };
	const target: AutopilotTarget = {
		moveTo(x: number, y: number) {
			moves.push([x, y]);
			order.push("move");
		},
		penUp() {
			penUps.count++;
			order.push("penUp");
		}
	};
	return { target, moves, order, penUps };
}

/** Drives `raf` ticks until `promise` settles, or gives up after `maxTicks`. */
async function driveUntilSettled(harness: Harness, promise: Promise<void>, maxTicks = 1000, tickMs = 16) {
	let settled = false;
	promise.then(() => {
		settled = true;
	});
	for (let i = 0; i < maxTicks && !settled; i++) {
		harness.tick(tickMs);
		await Promise.resolve();
	}
	await promise;
}

describe("pointAtTime", () => {
	const strokeA: Stroke = [
		{ x: 0, y: 0 },
		{ x: 1, y: 0 }
	];
	const strokeB: Stroke = [
		{ x: 1, y: 0 },
		{ x: 1, y: 1 }
	];
	const strokes: Stroke[] = [strokeA, strokeB];

	it("returns the first point of the first stroke at t01=0", () => {
		const { point, strokeIndex } = pointAtTime(strokes, 0);
		expect(point.x).toBeCloseTo(0, 6);
		expect(point.y).toBeCloseTo(0, 6);
		expect(strokeIndex).toBe(0);
	});

	it("returns the last point of the last stroke at t01=1", () => {
		const { point, strokeIndex } = pointAtTime(strokes, 1);
		expect(point.x).toBeCloseTo(1, 6);
		expect(point.y).toBeCloseTo(1, 6);
		expect(strokeIndex).toBe(strokes.length - 1);
	});

	it("sits in the boundary region at t01=0.5 for two equal-length strokes", () => {
		const { point, strokeIndex } = pointAtTime(strokes, 0.5);
		expect(strokeIndex === 0 || strokeIndex === 1).toBe(true);
		// The boundary point between the two strokes is (1, 0); allow a loose
		// tolerance since exact inclusive/exclusive handling is an
		// implementation detail.
		expect(point.x).toBeCloseTo(1, 1);
		expect(point.y).toBeCloseTo(0, 1);
	});

	it("advances strokeIndex monotonically as t01 grows", () => {
		let last = 0;
		for (let t01 = 0; t01 <= 1; t01 += 0.05) {
			const { strokeIndex } = pointAtTime(strokes, t01);
			expect(strokeIndex).toBeGreaterThanOrEqual(last);
			last = strokeIndex;
		}
	});
});

describe("createAutopilot — playTrace", () => {
	const strokes: Stroke[] = [
		[
			{ x: 0.1, y: 0.1 },
			{ x: 0.2, y: 0.15 },
			{ x: 0.3, y: 0.1 }
		],
		[
			{ x: 0.4, y: 0.4 },
			{ x: 0.5, y: 0.45 }
		],
		[
			{ x: 0.7, y: 0.7 },
			{ x: 0.75, y: 0.8 },
			{ x: 0.8, y: 0.9 }
		]
	];

	it("lifts the pen exactly N+1 times, starts/ends on the exact first/last points, and resolves once the trace duration elapses", async () => {
		const harness = createHarness();
		const { target, moves, order, penUps } = createTarget();
		const traceDurationMs = 160;
		const autopilot = createAutopilot(target, {
			traceDurationMs,
			now: harness.now,
			raf: harness.raf,
			caf: harness.caf
		});

		const done = autopilot.playTrace(strokes);
		await driveUntilSettled(harness, done);

		expect(moves.length).toBeGreaterThan(0);

		const first = strokes[0][0];
		const lastStroke = strokes[strokes.length - 1];
		const last = lastStroke[lastStroke.length - 1];

		// First moveTo equals the first point of the first stroke (t01=0).
		expect(moves[0][0]).toBeCloseTo(first.x, 6);
		expect(moves[0][1]).toBeCloseTo(first.y, 6);
		// Final moveTo equals exactly the last point of the last stroke.
		expect(moves[moves.length - 1][0]).toBeCloseTo(last.x, 6);
		expect(moves[moves.length - 1][1]).toBeCloseTo(last.y, 6);

		// N strokes -> N+1 penUps: before the first moveTo, before each of the
		// N-1 stroke changes, and once after the final moveTo.
		expect(penUps.count).toBe(strokes.length + 1);
		expect(order[0]).toBe("penUp");
		expect(order[order.length - 1]).toBe("penUp");
	});
});

describe("createAutopilot — ambient", () => {
	it("keeps every ambient move within the lissajous bounds", () => {
		const harness = createHarness();
		const { target, moves } = createTarget();
		const autopilot = createAutopilot(target, {
			now: harness.now,
			raf: harness.raf,
			caf: harness.caf
		});

		autopilot.startAmbient();
		for (let i = 0; i < 200; i++) harness.tick(16);

		expect(moves.length).toBeGreaterThan(0);
		const eps = 1e-6;
		for (const [x, y] of moves) {
			expect(x).toBeGreaterThanOrEqual(0.17 - eps);
			expect(x).toBeLessThanOrEqual(0.83 + eps);
			expect(y).toBeGreaterThanOrEqual(0.25 - eps);
			expect(y).toBeLessThanOrEqual(0.75 + eps);
		}
	});

	it("stops new moves immediately on notifyUserActive, then resumes after idleResumeMs with a penUp beforehand", () => {
		const harness = createHarness();
		const { target, moves, order } = createTarget();
		const idleResumeMs = 300;
		const autopilot = createAutopilot(target, {
			idleResumeMs,
			now: harness.now,
			raf: harness.raf,
			caf: harness.caf
		});

		autopilot.startAmbient();
		harness.tick(16);
		harness.tick(16);
		const movesBeforePause = moves.length;
		const orderBeforePause = order.length;

		autopilot.notifyUserActive();
		harness.tick(16);
		harness.tick(16);
		harness.tick(16);
		expect(moves.length).toBe(movesBeforePause);

		for (let i = 0; i < Math.ceil(idleResumeMs / 16) + 5; i++) harness.tick(16);
		expect(moves.length).toBeGreaterThan(movesBeforePause);

		const resumedMoveIndex = order.findIndex((entry, idx) => idx >= orderBeforePause && entry === "move");
		expect(resumedMoveIndex).toBeGreaterThan(-1);
		expect(order.slice(orderBeforePause, resumedMoveIndex)).toContain("penUp");
	});

	it("stop() produces no further moves on subsequent ticks", () => {
		const harness = createHarness();
		const { target, moves } = createTarget();
		const autopilot = createAutopilot(target, {
			now: harness.now,
			raf: harness.raf,
			caf: harness.caf
		});

		autopilot.startAmbient();
		harness.tick(16);
		harness.tick(16);
		autopilot.stop();
		const movesAtStop = moves.length;

		for (let i = 0; i < 50; i++) harness.tick(16);
		expect(moves.length).toBe(movesAtStop);
	});
});
