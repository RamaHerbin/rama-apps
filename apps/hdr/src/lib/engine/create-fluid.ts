/**
 * STUB — WP1 replaces this file. Facade: try WebGPU (HDR), fall back to
 * WebGL, return null when neither is available (UI shows a static hero and
 * the verdict still renders with renderLevel "none").
 */

import type { FluidHandle, FluidOptions } from './types.js';

export async function createFluid(
	_canvas: HTMLCanvasElement,
	_opts: FluidOptions
): Promise<FluidHandle | null> {
	throw new Error('not implemented (WP1)');
}
