/**
 * Terminal color tokens, translated from the rama.app dark theme
 * (apps/main/src/routes/layout.css). The web theme is authored in oklch; a
 * terminal only speaks hex/truecolor, so these are the *spirit* of the source
 * tokens rather than a mathematical oklch→sRGB conversion.
 *
 * Source mapping (dark theme):
 *   --background       oklch(0.145 0 0)  → bg
 *   --foreground       oklch(0.985 0 0)  → fg
 *   --muted-foreground oklch(0.708 0 0)  → muted
 *   --border           oklch(0.269 0 0)  → border
 *   --accent-work      #e3d9bf           → accent (the cream from the mockups)
 */
export const theme = {
	/** Page background — near-black. */
	bg: '#0a0a0a',
	/** Primary text — near-white, slightly warm off the pure white for comfort. */
	fg: '#f5f5f5',
	/** Secondary text (labels, captions). */
	muted: '#a3a3a3',
	/** Tertiary text (hints, disabled, decorative rules). */
	dim: '#666666',
	/** Brand accent — the cream used across the portfolio's "work" redesign. */
	accent: '#e3d9bf',
	/** Hairline borders and separators. */
	border: '#333333',
	/** Success / affirmative state. */
	ok: '#7ee787',
	/** Error / destructive state. */
	error: '#ff7b72',
} as const

export type ThemeColor = keyof typeof theme

/**
 * Shared layout constants. Kept next to the theme so every view agrees on the
 * measure of the content column and the internal padding rhythm.
 */
export const spacing = {
	/** Max readable line length; content is clamped to this many columns. */
	maxContentWidth: 80,
	/** Default inner padding (in cells) for framed content. */
	pad: 1,
	/** Default gap between stacked blocks. */
	gap: 1,
} as const
