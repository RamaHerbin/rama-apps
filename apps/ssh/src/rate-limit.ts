// Per-IP connection rate limiting for the SSH front door.
//
// A public :22 gets scanned constantly, so this middleware caps how many
// sessions a single source IP may open within a rolling window and denies the
// rest. The counting logic is a fixed-window counter kept in a plain Map; the
// pure `checkRateLimit`/`sweepRateLimit` helpers hold all the logic so the
// behaviour is unit-testable without a live SSH session.

import type { Middleware } from '@opentui/ssh'

export interface RateLimitOptions {
	/** Max sessions one IP may open within a single window. */
	max: number
	/** Window length in milliseconds. */
	windowMs: number
}

export interface RateLimitEntry {
	/** Sessions seen from this IP in the current window. */
	count: number
	/** Epoch-ms at which this IP's window rolls over and the count resets. */
	resetAt: number
}

/**
 * Record one attempt from `ip` at `now` and report whether it is within `max`
 * for the current window. Mutates `map` in place. A brand-new IP, or one whose
 * window has already elapsed, starts a fresh window at count 1.
 *
 * Pure aside from the `map` mutation, and time is injected via `now`, so a test
 * can drive the whole window lifecycle deterministically.
 */
export function checkRateLimit(
	map: Map<string, RateLimitEntry>,
	ip: string,
	now: number,
	opts: RateLimitOptions,
): boolean {
	const entry = map.get(ip)
	if (!entry || now >= entry.resetAt) {
		map.set(ip, { count: 1, resetAt: now + opts.windowMs })
		return true
	}
	entry.count++
	return entry.count <= opts.max
}

/**
 * Drop every entry whose window has already elapsed at `now`. Without this a
 * port scan — a fresh source IP on every probe — would grow the map forever;
 * the periodic sweep keeps it bounded to the set of currently-active IPs.
 */
export function sweepRateLimit(map: Map<string, RateLimitEntry>, now: number): void {
	for (const [ip, entry] of map) {
		if (now >= entry.resetAt) map.delete(ip)
	}
}

/**
 * Build a rate-limiting middleware. Keys on `session.remoteAddress.address`,
 * denies with `'rate limited'` once an IP exceeds `max` per `windowMs`, and
 * runs a background sweep so memory can't leak under a scan.
 */
export function rateLimit(opts: RateLimitOptions): Middleware {
	const map = new Map<string, RateLimitEntry>()

	// Evict expired windows on a cadence so a scanned public port never grows
	// the map without bound. `unref()` so this timer alone never keeps the
	// process alive. Floor the cadence so a tiny `windowMs` can't spin a hot loop.
	const sweepMs = Math.max(opts.windowMs, 1000)
	const timer = setInterval(() => sweepRateLimit(map, Date.now()), sweepMs)
	timer.unref()

	return (session, next) => {
		const ip = session.remoteAddress.address
		if (!checkRateLimit(map, ip, Date.now(), opts)) {
			// `deny` throws to unwind the chain before the renderer is created.
			session.deny('rate limited')
		}
		return next()
	}
}
