/**
 * Facade over the two fluid engines: try WebGPU (the only path that can
 * produce true HDR output), fall back to WebGL, return `null` when neither is
 * available (the UI then shows a static hero and the verdict still renders
 * with renderLevel "none").
 *
 * The returned handle is engine-agnostic: coordinates are always top-left
 * origin in [0,1] and `renderLevel` reports what actually happened.
 */

import { startWebGpuFluid } from './webgpu-engine.js';
import { startWebGlFluid } from './webgl-engine.js';
import type { FluidHandle, FluidOptions } from './types.js';

export async function createFluid(
	canvas: HTMLCanvasElement,
	opts: FluidOptions
): Promise<FluidHandle | null> {
	if (typeof navigator !== 'undefined' && 'gpu' in navigator) {
		try {
			const handle = await startWebGpuFluid(canvas, opts);
			if (handle) return handle;
		} catch (error) {
			// Unexpected failure while wiring the WebGPU path: fall through to
			// WebGL instead of leaving a permanently blank canvas.
			if (import.meta.env.DEV) {
				console.warn('[fluid] WebGPU setup failed, falling back to WebGL:', error);
			}
		}
	}

	// `hdr: true` asks the WebGL path for a display-p3 drawing buffer; it
	// reports back through renderLevel whether the browser accepted it.
	try {
		return startWebGlFluid(canvas, { ...opts, hdr: true });
	} catch (error) {
		if (import.meta.env.DEV) {
			console.warn('[fluid] WebGL setup failed, no fluid available:', error);
		}
		return null;
	}
}
