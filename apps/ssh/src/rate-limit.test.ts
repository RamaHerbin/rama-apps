import { describe, expect, it, vi } from 'vitest'
import {
	checkRateLimit,
	rateLimit,
	sweepRateLimit,
	type RateLimitEntry,
} from './rate-limit'

const opts = { max: 3, windowMs: 1000 }

describe('checkRateLimit', () => {
	it('allows requests up to the limit', () => {
		const map = new Map<string, RateLimitEntry>()
		expect(checkRateLimit(map, '1.1.1.1', 0, opts)).toBe(true)
		expect(checkRateLimit(map, '1.1.1.1', 10, opts)).toBe(true)
		expect(checkRateLimit(map, '1.1.1.1', 20, opts)).toBe(true)
		expect(map.get('1.1.1.1')?.count).toBe(3)
	})

	it('denies once the limit is exceeded within the window', () => {
		const map = new Map<string, RateLimitEntry>()
		for (let i = 0; i < opts.max; i++) {
			expect(checkRateLimit(map, '1.1.1.1', i, opts)).toBe(true)
		}
		expect(checkRateLimit(map, '1.1.1.1', opts.max, opts)).toBe(false)
		expect(checkRateLimit(map, '1.1.1.1', opts.max + 1, opts)).toBe(false)
	})

	it('tracks IPs independently', () => {
		const map = new Map<string, RateLimitEntry>()
		for (let i = 0; i < opts.max; i++) checkRateLimit(map, 'a', i, opts)
		expect(checkRateLimit(map, 'a', 100, opts)).toBe(false)
		expect(checkRateLimit(map, 'b', 100, opts)).toBe(true)
	})

	it('resets the count after the window elapses', () => {
		const map = new Map<string, RateLimitEntry>()
		for (let i = 0; i < opts.max; i++) checkRateLimit(map, 'ip', 0, opts)
		expect(checkRateLimit(map, 'ip', 0, opts)).toBe(false) // over limit, same window
		// At/after resetAt (0 + windowMs) a fresh window starts at count 1.
		expect(checkRateLimit(map, 'ip', opts.windowMs, opts)).toBe(true)
		expect(map.get('ip')?.count).toBe(1)
	})
})

describe('sweepRateLimit', () => {
	it('evicts entries whose window has elapsed and keeps live ones', () => {
		const map = new Map<string, RateLimitEntry>()
		checkRateLimit(map, 'stale', 0, opts) // resetAt = 1000
		checkRateLimit(map, 'fresh', 900, opts) // resetAt = 1900
		sweepRateLimit(map, 1500)
		expect(map.has('stale')).toBe(false)
		expect(map.has('fresh')).toBe(true)
	})

	it('bounds the map under a port scan (many one-off IPs)', () => {
		const map = new Map<string, RateLimitEntry>()
		for (let i = 0; i < 1000; i++) checkRateLimit(map, `10.0.0.${i}`, 0, opts)
		expect(map.size).toBe(1000)
		sweepRateLimit(map, opts.windowMs) // now >= every resetAt
		expect(map.size).toBe(0)
	})
})

describe('rateLimit middleware', () => {
	// Minimal stand-in for the fields the middleware touches. `deny` throws, as
	// the real implementation does, to unwind the chain.
	const makeSession = (address: string) => ({
		remoteAddress: { address },
		deny: vi.fn((reason?: string): never => {
			throw new Error(reason)
		}),
	})

	it('passes sessions under the limit and denies the one that exceeds it', async () => {
		const mw = rateLimit({ max: 2, windowMs: 60_000 })
		const next = vi.fn(async () => ({}) as never)

		const first = makeSession('9.9.9.9')
		const second = makeSession('9.9.9.9')
		await mw(first as never, next)
		await mw(second as never, next)
		expect(first.deny).not.toHaveBeenCalled()
		expect(second.deny).not.toHaveBeenCalled()
		expect(next).toHaveBeenCalledTimes(2)

		const third = makeSession('9.9.9.9')
		expect(() => mw(third as never, next)).toThrow('rate limited')
		expect(third.deny).toHaveBeenCalledWith('rate limited')
		expect(next).toHaveBeenCalledTimes(2) // denied session never reaches next()
	})

	it('limits per IP, not globally', async () => {
		const mw = rateLimit({ max: 1, windowMs: 60_000 })
		const next = vi.fn(async () => ({}) as never)

		await mw(makeSession('1.2.3.4') as never, next) // first from A: ok
		await mw(makeSession('5.6.7.8') as never, next) // first from B: ok
		expect(next).toHaveBeenCalledTimes(2)

		const overA = makeSession('1.2.3.4')
		expect(() => mw(overA as never, next)).toThrow('rate limited')
	})
})
