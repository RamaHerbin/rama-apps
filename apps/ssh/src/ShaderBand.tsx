import { useEffect, useMemo, useState } from 'react'
import { pickShader, renderShaderFrame } from './shaders'
import { theme } from './theme'

/**
 * Frame cadence, in ms. Slow enough to read as ambient background texture
 * rather than a flashy animation competing with the foreground content.
 */
const FRAME_INTERVAL_MS = 90

/** How far `t` advances per tick; paired with FRAME_INTERVAL_MS to set apparent speed. */
const TIME_STEP = 0.12

export interface ShaderBandProps {
	width: number
	height: number
}

/**
 * Animated ASCII-shader backdrop. Renders as a single multi-line `<text>`
 * block so it composes as one leaf node behind (or beside) foreground UI —
 * callers position it with normal box layout.
 */
export function ShaderBand({ width, height }: ShaderBandProps) {
	// Chosen once per mount, not per render, so the backdrop doesn't jump
	// between shader kinds whenever the parent re-renders with new props.
	const [kind] = useState(() => pickShader(Date.now()))
	const [t, setT] = useState(0)

	useEffect(() => {
		const id = setInterval(() => {
			setT((previous) => previous + TIME_STEP)
		}, FRAME_INTERVAL_MS)
		return () => clearInterval(id)
	}, [])

	// A 0×0 (or negative) allocation means the layout has no room for the
	// band — e.g. a very short terminal — so skip rendering entirely rather
	// than asking renderShaderFrame for a degenerate grid.
	const hasArea = width > 0 && height > 0

	// The `text` intrinsic takes either a `content` string or `children`; a
	// single string joined with newlines is the simplest way to hand it a
	// whole multi-line frame, so we use `content` here.
	const content = useMemo(
		() => (hasArea ? renderShaderFrame(kind, width, height, t).join('\n') : ''),
		[hasArea, kind, width, height, t],
	)

	if (!hasArea) return null

	return <text width={width} height={height} fg={theme.dim} content={content} />
}
