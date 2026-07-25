/**
 * STUB — WP1 replaces this file with the WebGL engine lifted out of
 * fancy-ui's FluidCursor.svelte startWebGl() closure. The Y flip
 * (texcoordY = 1 - y) lives HERE and only here; the FluidHandle contract
 * is top-left origin.
 */

import type { FluidHandle, FluidOptions } from './types.js';

export function startWebGlFluid(
	_canvas: HTMLCanvasElement,
	_opts: FluidOptions & { hdr: boolean }
): FluidHandle | null {
	throw new Error('not implemented (WP1)');
}
