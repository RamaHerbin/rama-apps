/**
 * STUB — WP2 replaces this file. Glyph polylines for "HDR?" and the text
 * layout helper. All coordinates are [0,1], top-left origin.
 */

export interface PathPoint {
	x: number;
	y: number;
}

/** A polyline drawn pen-down; the pen lifts between strokes. */
export type Stroke = PathPoint[];

export interface Glyph {
	strokes: Stroke[];
	/** Glyph advance width as a fraction of glyph height. */
	width: number;
}

export interface LayoutOptions {
	center: PathPoint;
	/** Text height as a fraction of viewport height. */
	height: number;
	/** Gap between glyphs as a fraction of glyph height. */
	gap: number;
	/** canvasWidth / canvasHeight — keeps glyphs square on screen. */
	aspect: number;
}

export const HDR_GLYPHS: Record<'H' | 'D' | 'R' | '?', Glyph> = {
	H: { strokes: [], width: 0.8 },
	D: { strokes: [], width: 0.8 },
	R: { strokes: [], width: 0.8 },
	'?': { strokes: [], width: 0.6 }
};

export function layoutText(_glyphs: Glyph[], _opts: LayoutOptions): Stroke[] {
	throw new Error('not implemented (WP2)');
}
