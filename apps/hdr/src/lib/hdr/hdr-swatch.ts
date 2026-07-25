/// <reference types="@webgpu/types" />
/**
 * STUB — WP3 replaces this file. Tiny WebGPU canvas that clears to a
 * brighter-than-white color (clearValue r=g=b=boost with extended tone
 * mapping) — the visual proof next to a CSS #fff swatch.
 */

export async function startHdrSwatch(
	_canvas: HTMLCanvasElement,
	_boost = 4
): Promise<(() => void) | null> {
	throw new Error('not implemented (WP3)');
}
