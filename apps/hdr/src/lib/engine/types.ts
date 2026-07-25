/**
 * FROZEN CONTRACT — every work package codes against these types.
 * Do not modify without coordinating all consumers (engines, autopilot,
 * verdict, UI).
 */

import type { ColorRGB } from './fluid-shared.js';

/**
 * How the fluid is actually being rendered, surfaced as data so the verdict
 * can reason about it:
 * - "webgpu-hdr": WebGPU with extended tone mapping active — true HDR output.
 * - "webgpu-sdr": WebGPU float16 + P3, but the browser clamped tone mapping.
 * - "webgl-p3":   WebGL fallback with a display-p3 drawing buffer.
 * - "webgl-sdr":  WebGL fallback, plain sRGB.
 * - "none":       no GPU rendering available at all.
 */
export type RenderLevel = 'webgpu-hdr' | 'webgpu-sdr' | 'webgl-p3' | 'webgl-sdr' | 'none';

export interface FluidHandle {
	/**
	 * Drive the synthetic pointer like a mouse. x,y in [0,1] with the ORIGIN
	 * AT THE TOP-LEFT (CSS convention). Velocity is derived from consecutive
	 * calls, so smooth paths produce the real cursor feel. Any engine-specific
	 * Y flip is internal to the engine.
	 */
	moveTo(x: number, y: number, color?: ColorRGB): void;
	/** Lift the pen: the next moveTo repositions without producing a splat. */
	penUp(): void;
	/** One-off impulse (click-like burst). Same coord convention; dx/dy in engine velocity units. */
	burst(x: number, y: number, dx: number, dy: number, color: ColorRGB): void;
	readonly renderLevel: RenderLevel;
	cleanup(): void;
}

/** Options shared by both engines (mirrors fancy-ui's WebGpuFluidOptions). */
export interface FluidOptions {
	simResolution: number;
	dyeResolution: number;
	densityDissipation: number;
	velocityDissipation: number;
	pressure: number;
	pressureIterations: number;
	curl: number;
	splatRadius: number;
	splatForce: number;
	shading: boolean;
	colorUpdateSpeed: number;
	/** HDR exposure boost, clamped [1,4] by the WebGPU engine; ignored by WebGL. */
	exposure: number;
	/** true = canvas is positioned inside a container (rect-mapped pointers); false = full viewport. */
	contained: boolean;
	/** Attach real mouse/touch listeners. Autopilot works regardless. */
	interactive: boolean;
	pauseWhenHidden: boolean;
	generateColor: () => ColorRGB;
}

/** App-wide default simulation config (from fancy-ui FluidCursor defaults). */
export const DEFAULT_FLUID_OPTIONS: Omit<FluidOptions, 'generateColor'> = {
	simResolution: 128,
	dyeResolution: 1440,
	densityDissipation: 3.5,
	velocityDissipation: 2,
	pressure: 0.1,
	pressureIterations: 20,
	curl: 3,
	splatRadius: 0.2,
	splatForce: 6000,
	shading: true,
	colorUpdateSpeed: 10,
	exposure: 3.5,
	contained: false,
	interactive: true,
	pauseWhenHidden: true
};
