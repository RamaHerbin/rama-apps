import { describe, it, expect } from 'vitest';
import { createChoreographer } from './choreographer.js';
import type { GlyphTarget } from './glyph-targets.js';
import type { FireworksHandle, LaunchOptions, LaunchResult } from '$lib/engine/types.js';

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

interface RecordedLaunch {
	at: number;
	opts: LaunchOptions;
}

function createFakeHandle(clock: () => number): { handle: FireworksHandle; launches: RecordedLaunch[] } {
	const launches: RecordedLaunch[] = [];
	const handle: FireworksHandle = {
		launch(opts: LaunchOptions): LaunchResult {
			launches.push({ at: clock(), opts });
			const flightMs = opts.flightMs ?? 600;
			return { flightMs, breakMs: flightMs + 100 };
		},
		setAmbient() {},
		setKeepClear() {},
		setExposure() {},
		renderLevel: 'webgpu-hdr',
		cleanup() {}
	};
	return { handle, launches };
}

function makeTargets(): GlyphTarget[] {
	const keys: GlyphTarget[] = [];
	const hues = [
		{ r: 0.1, g: 0.6, b: 1 },
		{ r: 0.05, g: 0.1, b: 1 },
		{ r: 0.4, g: 0.05, b: 1 },
		{ r: 1, g: 0.05, b: 0.7 }
	];
	for (let i = 0; i < 4; i += 1) {
		const cx = 0.2 + i * 0.15;
		keys.push({
			points: [
				{ x: cx, y: 0.35 },
				{ x: cx + 0.02, y: 0.4 },
				{ x: cx, y: 0.5 }
			],
			centroid: { x: cx, y: 0.4 },
			hue: hues[i]
		});
	}
	return keys;
}

/** Drive rAF ticks until `promise` settles; returns the clock time at settle. */
async function driveUntilSettled(
	harness: Harness,
	promise: Promise<void>,
	maxTicks = 1000,
	tickMs = 16
): Promise<number> {
	let settledAt = -1;
	promise.then(() => {
		settledAt = harness.now();
	});
	for (let i = 0; i < maxTicks && settledAt < 0; i += 1) {
		harness.tick(tickMs);
		await Promise.resolve();
	}
	await promise;
	return settledAt;
}

describe('createChoreographer — playIntro', () => {
	it('launches the four glyph shells at 0/180/360/540 within one frame', async () => {
		const harness = createHarness();
		const { handle, launches } = createFakeHandle(harness.now);
		const choreo = createChoreographer(handle, {
			clock: harness.now,
			raf: harness.raf,
			caf: harness.caf
		});

		await driveUntilSettled(harness, choreo.playIntro(makeTargets()));

		const glyphLaunches = launches.filter((l) => l.opts.shell === 'glyph');
		expect(glyphLaunches).toHaveLength(4);
		const expected = [0, 180, 360, 540];
		glyphLaunches.forEach((launch, i) => {
			expect(Math.abs(launch.at - expected[i])).toBeLessThanOrEqual(16);
		});
	});

	it('coordinates release so every glyph unwinds at the same absolute moment', async () => {
		const harness = createHarness();
		const { handle, launches } = createFakeHandle(harness.now);
		const choreo = createChoreographer(handle, {
			clock: harness.now,
			raf: harness.raf,
			caf: harness.caf
		});

		await driveUntilSettled(harness, choreo.playIntro(makeTargets()));

		const glyphLaunches = launches.filter((l) => l.opts.shell === 'glyph');
		for (const launch of glyphLaunches) {
			// launch.at + releaseAtMs should equal the shared absolute release time.
			expect(launch.at + (launch.opts.releaseAtMs ?? 0)).toBeGreaterThanOrEqual(1990);
			expect(launch.at + (launch.opts.releaseAtMs ?? 0)).toBeLessThanOrEqual(2050);
			expect(launch.opts.intensity).toBe('intro');
		}
	});

	it('pops a peony at the "?" dot after the glyphs', async () => {
		const harness = createHarness();
		const { handle, launches } = createFakeHandle(harness.now);
		const choreo = createChoreographer(handle, {
			clock: harness.now,
			raf: harness.raf,
			caf: harness.caf
		});

		await driveUntilSettled(harness, choreo.playIntro(makeTargets()));

		const peonies = launches.filter((l) => l.opts.shell === 'peony');
		expect(peonies).toHaveLength(1);
		expect(peonies[0].at).toBeGreaterThan(540);
		expect(Math.abs(peonies[0].at - 1450)).toBeLessThanOrEqual(16);
	});

	it('resolves at ~2300 ms', async () => {
		const harness = createHarness();
		const { handle } = createFakeHandle(harness.now);
		const choreo = createChoreographer(handle, {
			clock: harness.now,
			raf: harness.raf,
			caf: harness.caf
		});

		const settledAt = await driveUntilSettled(harness, choreo.playIntro(makeTargets()));
		expect(Math.abs(settledAt - 2300)).toBeLessThanOrEqual(40);
	});
});

describe('createChoreographer — stop', () => {
	it('settles the promise and fires no launches after stop', async () => {
		const harness = createHarness();
		const { handle, launches } = createFakeHandle(harness.now);
		const choreo = createChoreographer(handle, {
			clock: harness.now,
			raf: harness.raf,
			caf: harness.caf
		});

		let settled = false;
		const done = choreo.playIntro(makeTargets());
		done.then(() => {
			settled = true;
		});

		// Advance partway (past the first two launches) then stop.
		harness.tick(16);
		harness.tick(200);
		const launchesAtStop = launches.length;
		expect(launchesAtStop).toBeGreaterThan(0);

		choreo.stop();
		await Promise.resolve();
		expect(settled).toBe(true);

		for (let i = 0; i < 200; i += 1) harness.tick(16);
		expect(launches.length).toBe(launchesAtStop);
	});

	it('resolves immediately when playIntro is called after stop', async () => {
		const harness = createHarness();
		const { handle, launches } = createFakeHandle(harness.now);
		const choreo = createChoreographer(handle, {
			clock: harness.now,
			raf: harness.raf,
			caf: harness.caf
		});

		choreo.stop();
		await choreo.playIntro(makeTargets());
		expect(launches).toHaveLength(0);
	});
});
