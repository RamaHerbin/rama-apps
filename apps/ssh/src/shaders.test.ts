import { describe, expect, it } from 'vitest'
import { DENSITY_RAMP, pickShader, renderShaderFrame, SHADER_KINDS, type ShaderKind } from './shaders'

const RAMP_SET = new Set(DENSITY_RAMP)

/** Sizes exercised across every test, including the two the brief calls out. */
const SIZES: Array<{ width: number; height: number }> = [
	{ width: 1, height: 1 },
	{ width: 80, height: 20 },
	{ width: 2, height: 1 },
	{ width: 1, height: 2 },
	{ width: 40, height: 1 },
	{ width: 1, height: 40 },
	{ width: 33, height: 17 },
]

describe('SHADER_KINDS', () => {
	it('lists all three kinds', () => {
		expect(SHADER_KINDS).toEqual(['plasma', 'waves', 'rings'])
	})
})

describe('renderShaderFrame dimensions', () => {
	for (const kind of SHADER_KINDS) {
		for (const { width, height } of SIZES) {
			it(`returns exactly ${height} lines of ${width} chars for ${kind}`, () => {
				const frame = renderShaderFrame(kind, width, height, 0)
				expect(frame).toHaveLength(height)
				for (const line of frame) {
					expect([...line]).toHaveLength(width)
				}
			})
		}
	}

	it('returns an empty array when height is 0', () => {
		for (const kind of SHADER_KINDS) {
			expect(renderShaderFrame(kind, 10, 0, 0)).toEqual([])
		}
	})

	it('returns height empty strings when width is 0', () => {
		for (const kind of SHADER_KINDS) {
			const frame = renderShaderFrame(kind, 0, 4, 0)
			expect(frame).toHaveLength(4)
			for (const line of frame) {
				expect(line).toBe('')
			}
		}
	})
})

describe('renderShaderFrame determinism', () => {
	for (const kind of SHADER_KINDS) {
		it(`is pure for ${kind}: identical args -> identical output`, () => {
			const first = renderShaderFrame(kind, 24, 12, 3.14159)
			const second = renderShaderFrame(kind, 24, 12, 3.14159)
			expect(second).toEqual(first)
		})
	}
})

describe('renderShaderFrame animates over t', () => {
	for (const kind of SHADER_KINDS) {
		it(`differs across t for ${kind}`, () => {
			const frameA = renderShaderFrame(kind, 30, 14, 0)
			const frameB = renderShaderFrame(kind, 30, 14, 5)
			const frameC = renderShaderFrame(kind, 30, 14, 11.7)
			expect(frameB).not.toEqual(frameA)
			expect(frameC).not.toEqual(frameA)
			expect(frameC).not.toEqual(frameB)
		})
	}
})

describe('renderShaderFrame character set', () => {
	for (const kind of SHADER_KINDS) {
		it(`only emits ramp characters for ${kind}`, () => {
			// Sample several t values so we exercise the full range the
			// per-cell intensity functions can produce, not just t = 0.
			for (const t of [0, 1.5, 7, -3.2, 42]) {
				const frame = renderShaderFrame(kind, 40, 18, t)
				for (const line of frame) {
					for (const char of line) {
						expect(RAMP_SET.has(char)).toBe(true)
					}
				}
			}
		})
	}
})

describe('pickShader', () => {
	it('always returns a declared shader kind', () => {
		for (const seed of [0, 1, 2, 3, 4, 5, -7, 1e12, Date.now()]) {
			const kind: ShaderKind = pickShader(seed)
			expect(SHADER_KINDS).toContain(kind)
		}
	})

	it('is deterministic for a given seed', () => {
		expect(pickShader(1234)).toBe(pickShader(1234))
	})

	it('cycles through kinds in step with the seed', () => {
		const results = [0, 1, 2, 3, 4, 5].map((seed) => pickShader(seed))
		expect(results).toEqual([
			SHADER_KINDS[0],
			SHADER_KINDS[1],
			SHADER_KINDS[2],
			SHADER_KINDS[0],
			SHADER_KINDS[1],
			SHADER_KINDS[2],
		])
	})
})
