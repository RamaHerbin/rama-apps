/**
 * Display-capability signals via matchMedia.
 *
 * These describe the SCREEN (and the OS/browser colour pipeline feeding it),
 * never the canvas: what we can actually render is reported separately as a
 * `RenderLevel`. The verdict combines the two.
 */

export interface DisplaySignals {
	/** matchMedia("(dynamic-range: high)") */
	dynamicRangeHigh: boolean;
	/** matchMedia("(color-gamut: p3)") */
	gamutP3: boolean;
}

const QUERY_DYNAMIC_RANGE_HIGH = '(dynamic-range: high)';
const QUERY_COLOR_GAMUT_P3 = '(color-gamut: p3)';

/**
 * Lazy default so importing this module never touches `window` — the app is
 * client-only, but tests (and any stray SSR pass) must be able to load it.
 * `window.matchMedia` is called as a method: passing it unbound throws
 * "Illegal invocation" in Chromium.
 */
function defaultMediaQuery(query: string): MediaQueryList {
	if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
		throw new Error('[hdr] matchMedia is unavailable (no browser window)');
	}
	return window.matchMedia(query);
}

export function readDisplaySignals(
	mq: (q: string) => MediaQueryList = defaultMediaQuery
): DisplaySignals {
	return {
		dynamicRangeHigh: mq(QUERY_DYNAMIC_RANGE_HIGH).matches,
		gamutP3: mq(QUERY_COLOR_GAMUT_P3).matches
	};
}

/** Live updates (e.g. window dragged to another monitor). Returns unsubscribe. */
export function watchDisplaySignals(
	cb: (s: DisplaySignals) => void,
	mq: (q: string) => MediaQueryList = defaultMediaQuery
): () => void {
	const dynamicRange = mq(QUERY_DYNAMIC_RANGE_HIGH);
	const gamut = mq(QUERY_COLOR_GAMUT_P3);

	// Either query can flip on its own (HDR toggled off keeps P3), so both are
	// watched and both re-read the full pair.
	const onChange = () => cb(readDisplaySignals(mq));

	dynamicRange.addEventListener('change', onChange);
	gamut.addEventListener('change', onChange);

	return () => {
		dynamicRange.removeEventListener('change', onChange);
		gamut.removeEventListener('change', onChange);
	};
}
