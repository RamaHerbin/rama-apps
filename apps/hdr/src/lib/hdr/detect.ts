/**
 * STUB — WP3 replaces this file. Display-capability signals via matchMedia.
 */

export interface DisplaySignals {
	/** matchMedia("(dynamic-range: high)") */
	dynamicRangeHigh: boolean;
	/** matchMedia("(color-gamut: p3)") */
	gamutP3: boolean;
}

export function readDisplaySignals(
	_mq: (q: string) => MediaQueryList = typeof window !== 'undefined'
		? window.matchMedia.bind(window)
		: (() => {
				throw new Error('no matchMedia');
			})()
): DisplaySignals {
	throw new Error('not implemented (WP3)');
}

/** Live updates (e.g. window dragged to another monitor). Returns unsubscribe. */
export function watchDisplaySignals(_cb: (s: DisplaySignals) => void): () => void {
	throw new Error('not implemented (WP3)');
}
