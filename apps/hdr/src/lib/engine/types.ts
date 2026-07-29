/**
 * The app-side fluid contract. The simulation itself is provided by
 * `fancy-ui-svelte`'s `FluidCursor` (HDR mode); `FluidStage` adapts its handle
 * to this shape, and the autopilot + verdict code against these types.
 */

/** Normalized RGB, 0..1 per channel (values may exceed 1 for HDR over-white). */
export interface ColorRGB {
	r: number;
	g: number;
	b: number;
}

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
