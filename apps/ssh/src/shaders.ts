/**
 * Deterministic "ASCII shader" engine. Every frame is a pure function of
 * (kind, width, height, t) — there is no internal clock and no randomness —
 * so the same call always produces the same grid of characters. Animation
 * comes entirely from the caller advancing `t` between calls.
 */

/** The three background textures the terminal portfolio can drift through. */
export type ShaderKind = 'plasma' | 'waves' | 'rings'

export const SHADER_KINDS: ShaderKind[] = ['plasma', 'waves', 'rings']

/**
 * Density ramp, sparse → dense, designed for this project rather than reused
 * from a familiar ASCII-art gradient. The first eight steps walk the raised
 * dots of Braille cells one at a time (⠁ has 1 dot set, ⣿ has all 8), which
 * gives finer low-end gradation than a plain ".:-=" ramp; the last four steps
 * hand off to the Unicode shade/block glyphs for the high end. Every entry is
 * a single Unicode scalar that terminals render in exactly one cell.
 */
export const DENSITY_RAMP: readonly string[] = [
	' ', // 0 dots — empty
	'⠁', // 1 dot
	'⠃', // 2 dots
	'⠇', // 3 dots
	'⡇', // 4 dots
	'⣇', // 5 dots
	'⣧', // 6 dots
	'⣷', // 7 dots
	'⣿', // 8 dots — solid braille cell
	'░', // light shade
	'▒', // medium shade
	'▓', // dark shade
	'█', // solid block
]

/** Clamp to [0, 1] and map onto a slot in `DENSITY_RAMP`. */
function rampChar(intensity: number): string {
	const clamped = intensity < 0 ? 0 : intensity > 1 ? 1 : intensity
	// `intensity === 1` would floor to an index one past the end without this.
	const index = Math.min(DENSITY_RAMP.length - 1, Math.floor(clamped * DENSITY_RAMP.length))
	return DENSITY_RAMP[index]!
}

/**
 * Plasma: four traveling wave fields (two axis-aligned, one diagonal, one
 * radial) summed together. No single wave dominates, which is what reads as
 * "plasma" interference rather than plain ripples.
 */
function plasmaIntensity(x: number, y: number, t: number): number {
	const a = Math.sin(x * 0.15 + t * 1.3)
	const b = Math.sin(y * 0.11 - t * 0.9)
	const c = Math.sin(x * 0.08 + y * 0.08 + t * 1.7)
	const d = Math.cos(Math.sqrt(x * x * 0.01 + y * y * 0.04) - t * 1.1)
	// Each term is in [-1, 1], so the sum is in [-4, 4].
	return (a + b + c + d + 4) / 8
}

interface Point {
	x: number
	y: number
}

/**
 * Three ripple sources drifting on independent Lissajous-style orbits around
 * the frame center. Phases are offset (2.1, 4.2 rad) so the sources never
 * move in lockstep.
 */
function waveSources(width: number, height: number, t: number): [Point, Point, Point] {
	const cx = width / 2
	const cy = height / 2
	return [
		{ x: cx + Math.cos(t * 0.6) * width * 0.35, y: cy + Math.sin(t * 0.5) * height * 0.35 },
		{ x: cx + Math.cos(t * 0.4 + 2.1) * width * 0.3, y: cy + Math.sin(t * 0.35 + 2.1) * height * 0.3 },
		{ x: cx + Math.cos(t * 0.25 + 4.2) * width * 0.25, y: cy + Math.sin(t * 0.45 + 4.2) * height * 0.25 },
	]
}

/**
 * Waves: ripples radiating from the three moving sources above, each fading
 * with distance so nearby sources read as brighter than far ones.
 */
function wavesIntensity(x: number, y: number, t: number, sources: readonly Point[]): number {
	let sum = 0
	for (const source of sources) {
		const dx = x - source.x
		// Terminal cells are roughly twice as tall as they are wide; scaling dy
		// keeps the ripples visually circular instead of squashed ellipses.
		const dy = (y - source.y) * 2
		const dist = Math.sqrt(dx * dx + dy * dy)
		sum += Math.sin(dist * 0.6 - t * 2.4) / (1 + dist * 0.12)
	}
	// Each term is bounded by 1 in magnitude, so the sum of three sits in [-3, 3].
	return (sum + 3) / 6
}

/** Rings: concentric bands expanding outward from a slowly drifting center. */
function ringsIntensity(x: number, y: number, t: number, width: number, height: number): number {
	const cx = width / 2 + Math.sin(t * 0.17) * width * 0.25
	const cy = height / 2 + Math.cos(t * 0.13) * height * 0.25
	const dx = x - cx
	const dy = (y - cy) * 2
	const dist = Math.sqrt(dx * dx + dy * dy)
	// Subtracting t*speed from the phase is what makes the bands crawl
	// outward over time instead of sitting static.
	const v = Math.sin(dist * 0.9 - t * 2.2)
	return (v + 1) / 2
}

/**
 * Render one frame of `kind` as `height` strings of exactly `width`
 * characters each. Pure and deterministic: identical arguments always
 * produce an identical grid.
 */
export function renderShaderFrame(kind: ShaderKind, width: number, height: number, t: number): string[] {
	if (height <= 0) return []
	if (width <= 0) return Array.from({ length: height }, () => '')

	const sources = kind === 'waves' ? waveSources(width, height, t) : null

	const lines: string[] = []
	for (let y = 0; y < height; y++) {
		let line = ''
		for (let x = 0; x < width; x++) {
			let intensity: number
			switch (kind) {
				case 'plasma':
					intensity = plasmaIntensity(x, y, t)
					break
				case 'waves':
					intensity = wavesIntensity(x, y, t, sources!)
					break
				case 'rings':
					intensity = ringsIntensity(x, y, t, width, height)
					break
			}
			line += rampChar(intensity)
		}
		lines.push(line)
	}
	return lines
}

/** Deterministically choose a shader kind from a numeric seed (e.g. `Date.now()`). */
export function pickShader(seed: number): ShaderKind {
	const normalized = Math.abs(Math.floor(seed))
	return SHADER_KINDS[normalized % SHADER_KINDS.length]!
}
