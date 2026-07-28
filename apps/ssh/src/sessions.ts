// In-process live-session counter.
//
// One SSH server process owns a single count of concurrent sessions. The SSH
// handler bumps it on connect and the disposer drops it on disconnect; the TUI
// reads it reactively via `useSessionCount` to show "N people here right now".
// Deliberately module-global (not a context) so the transport layer can touch
// it without threading a store through the React tree.

import { useSyncExternalStore } from 'react'

let count = 0
const listeners = new Set<() => void>()

function emit(): void {
	// Snapshot changed — nudge every React subscriber to re-read.
	for (const listener of listeners) listener()
}

/**
 * Register one live session and return its disposer.
 *
 * The disposer is idempotent: calling it twice decrements exactly once. That
 * matters because a session can be torn down from more than one path (an
 * `onClose` callback and an explicit cleanup), and a double decrement would
 * drift the count below the true number of connections.
 */
export function addSession(): () => void {
	count++
	emit()

	let disposed = false
	return () => {
		if (disposed) return
		disposed = true
		count--
		emit()
	}
}

/**
 * Subscribe to count changes. Returns an unsubscribe. Shaped as the first
 * argument to React's `useSyncExternalStore`.
 */
export function subscribeSessions(cb: () => void): () => void {
	listeners.add(cb)
	return () => {
		listeners.delete(cb)
	}
}

/** Current live session count. Stable getter for `useSyncExternalStore`. */
export function getSessionCount(): number {
	return count
}

/** React hook: the live count of concurrent SSH sessions, re-rendering on change. */
export function useSessionCount(): number {
	// Same getter for client and server snapshots — there is no SSR pass in a
	// terminal, and returning a consistent value avoids a hydration mismatch.
	return useSyncExternalStore(subscribeSessions, getSessionCount, getSessionCount)
}
