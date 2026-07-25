/// <reference types="@webgpu/types" />
/**
 * STUB — WP1 replaces this file with the ported fancy-ui WebGPU engine
 * exposing a FluidHandle (autopilot pointer + renderLevel as data).
 */

import type { FluidHandle, FluidOptions } from './types.js';

export async function startWebGpuFluid(
	_canvas: HTMLCanvasElement,
	_opts: FluidOptions
): Promise<FluidHandle | null> {
	throw new Error('not implemented (WP1)');
}
