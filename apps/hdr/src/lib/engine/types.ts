/**
 * The app-side fireworks contract. The engine itself is provided by
 * `fancy-ui-svelte`'s `FireworksHdr` (WebGPU HDR); `FireworksStage` adapts its
 * handle to the app, and the choreographer + verdict code against these types.
 */

/** Normalized RGB, 0..1 per channel (values may exceed 1 for HDR over-white). */
export interface ColorRGB {
	r: number;
	g: number;
	b: number;
}

/**
 * How the fireworks are actually being rendered, surfaced as data so the
 * verdict can reason about it:
 * - "webgpu-hdr": WebGPU with extended tone mapping active — true HDR output.
 * - "webgpu-sdr": WebGPU float16 + P3, but the browser clamped tone mapping.
 * - "webgl-p3":   WebGL fallback with a display-p3 drawing buffer.
 * - "webgl-sdr":  WebGL fallback, plain sRGB.
 * - "none":       no GPU rendering available at all.
 *
 * Structurally identical to the engine's `FireworksRenderLevel`, so a handle's
 * `renderLevel` flows straight into `computeVerdict`.
 */
export type RenderLevel = 'webgpu-hdr' | 'webgpu-sdr' | 'webgl-p3' | 'webgl-sdr' | 'none';

/**
 * The imperative fireworks handle, launch options, and launch result come
 * straight from the engine package — re-exported here so app modules depend on
 * a single app-facing surface (`$lib/engine/types`) rather than reaching into
 * `fancy-ui-svelte` directly.
 */
export type { FireworksHandle, LaunchOptions, LaunchResult } from 'fancy-ui-svelte';
