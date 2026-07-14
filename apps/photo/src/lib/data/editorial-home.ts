import type { ConstellationEntry } from '$lib/types/index.js';

/**
 * Single source of truth for the desktop home page "constellation" — the
 * asymmetric, overlapping arrangement of portrait photos in the hero stage
 * (src/routes/+page.svelte). Edit this file to reorder, add, or remove
 * photos from the composition; everything downstream (loader + markup)
 * reads from here.
 *
 * `columnStart`/`columnSpan` place each entry on a CONSTELLATION_COLUMNS-track
 * grid that spans the full width of the horizontal strip (see
 * --constellation-strip-width in +page.svelte); `align` + `offset` control
 * vertical placement within the full-height stage. All units are relative
 * (grid tracks, %, vw, clamp()) — never fixed pixel coordinates — so the
 * composition reflows instead of breaking across screen sizes.
 */
export const CONSTELLATION_COLUMNS = 30;

export const editorialHomeConstellation: ConstellationEntry[] = [
	{
		photoId: 'biUneALunnLy', // dscf0385 — 2:3 portrait, opens the sequence
		number: 1,
		columnStart: 1,
		columnSpan: 6,
		align: 'end',
		offset: '0px',
		depth: 2
	},
	{
		photoId: 'bcTuDtpQwHtG', // dscf0404 — 2:3 portrait, pairs with 01
		number: 2,
		columnStart: 5,
		columnSpan: 6,
		align: 'center',
		offset: 'clamp(-4rem, -3vw, -2rem)',
		depth: 3
	},
	{
		photoId: 'ohltO4xWkcOx', // img0318 — 3:4 portrait, mid-sequence ratio break
		number: 3,
		columnStart: 9,
		columnSpan: 6,
		align: 'start',
		offset: 'clamp(1rem, 2vw, 2.5rem)',
		depth: 3
	},
	{
		photoId: '4-sxIeFRhkjP', // dscf0703 — 2:3 portrait, resumes narrow rhythm
		number: 4,
		columnStart: 13,
		columnSpan: 6,
		align: 'center',
		offset: 'clamp(-2rem, -1.5vw, -1rem)',
		depth: 4
	},
	{
		photoId: 'uv5dEsbAsa4h', // dscf0548 — heaviest/most detailed frame, builds toward close
		number: 5,
		columnStart: 17,
		columnSpan: 7,
		align: 'start',
		offset: 'clamp(2rem, 3vw, 3.5rem)',
		depth: 5,
		highlight: true
	},
	{
		photoId: 'MSrpi4qwkWRR', // dscf0501 — 3:2 landscape, closing anchor
		number: 6,
		columnStart: 22,
		columnSpan: 8,
		align: 'end',
		offset: '0px',
		depth: 3
	}
];
