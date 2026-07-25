/**
 * Glyph polylines for "HDR?" and the text layout helper. All coordinates are
 * [0,1], top-left origin (y grows downward).
 *
 * The shapes are deliberately blunt — thick single-line strokes, no serifs,
 * wide apertures, one stroke per structural part. The fluid simulation smears
 * dye outward from everything it traces, so anything finer than this stops
 * reading as a letter a few hundred milliseconds after the pen passes.
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

const HALF_PI = Math.PI / 2;

/**
 * Sample an elliptical arc as a polyline. Angles are in the same y-down space
 * as the glyphs, so -PI/2 points up, 0 points right, +PI/2 points down.
 * Both endpoints are included; `samples` is the total point count.
 */
function arc(
	cx: number,
	cy: number,
	rx: number,
	ry: number,
	fromAngle: number,
	toAngle: number,
	samples: number
): Stroke {
	const stroke: Stroke = [];
	const steps = Math.max(1, samples - 1);
	for (let i = 0; i < samples; i += 1) {
		const angle = fromAngle + ((toAngle - fromAngle) * i) / steps;
		// Clamp away the ±1e-16 float dust cos/sin leave at right angles, so
		// glyph-local points honor the documented [0,1] box exactly.
		stroke.push({
			x: clamp01(cx + rx * Math.cos(angle)),
			y: clamp01(cy + ry * Math.sin(angle))
		});
	}
	return stroke;
}

/** Two stems and a crossbar at half height. */
const H: Glyph = {
	width: 0.75,
	strokes: [
		[
			{ x: 0, y: 0 },
			{ x: 0, y: 1 }
		],
		[
			{ x: 0.75, y: 0 },
			{ x: 0.75, y: 1 }
		],
		[
			{ x: 0, y: 0.5 },
			{ x: 0.75, y: 0.5 }
		]
	]
};

/** Stem plus a full-height bowl: a half-ellipse from stem top to stem foot. */
const D: Glyph = {
	width: 0.8,
	strokes: [
		[
			{ x: 0, y: 0 },
			{ x: 0, y: 1 }
		],
		arc(0, 0.5, 0.8, 0.5, -HALF_PI, HALF_PI, 14)
	]
};

/** Stem, a half-height top bowl, then a straight leg out to the baseline. */
const R: Glyph = {
	width: 0.8,
	strokes: [
		[
			{ x: 0, y: 0 },
			{ x: 0, y: 1 }
		],
		arc(0, 0.25, 0.7, 0.25, -HALF_PI, HALF_PI, 12),
		[
			{ x: 0, y: 0.5 },
			{ x: 0.8, y: 1 }
		]
	]
};

/**
 * Hook and dot. The hook is one continuous stroke: three quarters of an
 * ellipse (left -> up -> right -> down, ending at mid height) followed by the
 * short vertical descender. The dot is a stub segment — the page may also fire
 * a burst() at the same spot for extra punch.
 */
const QUESTION: Glyph = {
	width: 0.6,
	strokes: [
		[...arc(0.3, 0.28, 0.28, 0.22, Math.PI, 2.5 * Math.PI, 14), { x: 0.3, y: 0.68 }],
		[
			{ x: 0.28, y: 0.92 },
			{ x: 0.32, y: 0.92 }
		]
	]
};

export const HDR_GLYPHS: Record<'H' | 'D' | 'R' | '?', Glyph> = {
	H,
	D,
	R,
	'?': QUESTION
};

function clamp01(value: number): number {
	if (value < 0) return 0;
	if (value > 1) return 1;
	return value;
}

/**
 * Place a run of glyphs as screen-normalized strokes in [0,1].
 *
 * Glyphs are scaled to `height` (a fraction of viewport height) and advance by
 * `width * height + gap * height`. The run is centered on `opts.center` by its
 * advance metrics, not by its ink bounding box — a glyph with side bearings
 * (the "?") leaves its sliver of whitespace inside the run, exactly like text.
 * Every horizontal extent is divided by `aspect` (canvasW / canvasH) so the
 * letters stay square instead of stretching across a wide viewport.
 *
 * Pure — no DOM. Points are clamped into [0,1]: a run too big for the viewport
 * flattens against the edges rather than driving the pointer off-canvas.
 */
export function layoutText(glyphs: Glyph[], opts: LayoutOptions): Stroke[] {
	if (glyphs.length === 0) return [];

	const { center, height, gap } = opts;
	const aspect = opts.aspect > 0 && Number.isFinite(opts.aspect) ? opts.aspect : 1;
	const advanceOf = (glyph: Glyph) => glyph.width * height + gap * height;

	// Run width in viewport-height units: every advance minus the trailing gap
	// the last glyph does not need.
	let runWidth = -gap * height;
	for (const glyph of glyphs) runWidth += advanceOf(glyph);

	const out: Stroke[] = [];
	// Pen x, in viewport-height units, relative to the run's center.
	let pen = -runWidth / 2;
	for (const glyph of glyphs) {
		for (const stroke of glyph.strokes) {
			out.push(
				stroke.map((point) => ({
					x: clamp01(center.x + (pen + point.x * height) / aspect),
					y: clamp01(center.y + (point.y - 0.5) * height)
				}))
			);
		}
		pen += advanceOf(glyph);
	}
	return out;
}
