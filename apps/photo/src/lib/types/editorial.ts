/**
 * Layout hints for one photo inside the home page "constellation" — the
 * asymmetric, overlapping collage of portrait photos used on the desktop
 * editorial home stage (see src/lib/data/editorial-home.ts).
 *
 * All placement is expressed in relative units (grid columns out of
 * CONSTELLATION_COLUMNS, vertical alignment keywords, clamp()/vw/rem
 * nudges) so the composition reflows across viewport sizes instead of
 * relying on fixed pixel coordinates.
 */
export interface ConstellationEntry {
	/** Photo.id from data/photos.json — resolved to a full Photo at load time. */
	photoId: string;
	/** Contact-sheet index (1-based). Rendered zero-padded, e.g. "01 —". */
	number: number;
	/** 1-based start line on the CONSTELLATION_COLUMNS-track grid. */
	columnStart: number;
	/** How many column tracks the photo spans (controls its relative width). */
	columnSpan: number;
	/** Vertical anchor within the full-height stage row. */
	align: 'start' | 'center' | 'end';
	/**
	 * Fine vertical nudge layered on top of `align`, as a CSS length
	 * (clamp()/vw/rem — never a bare px value) applied via translateY.
	 * Negative values rise, positive values settle.
	 */
	offset: string;
	/** Stacking order for collage overlap; higher renders in front. */
	depth: number;
	/** Marks the "hero" frame of the constellation — rendered slightly larger. */
	highlight?: boolean;
}

/** A resolved constellation entry with its Photo joined in by the loader. */
export interface ResolvedConstellationEntry extends ConstellationEntry {
	photo: import('./photo.js').Photo;
}
