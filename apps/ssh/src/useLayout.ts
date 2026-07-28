import { useTerminalDimensions } from '@opentui/react'
import { spacing } from './theme'

/** Derived, responsive measurements shared by every view. */
export interface Layout {
	/** Raw terminal width in cells. */
	termWidth: number
	/** Raw terminal height in cells. */
	termHeight: number
	/** Content column width: the terminal width minus a 1-cell gutter each side, clamped. */
	contentWidth: number
	/** Content height: the terminal height minus a 1-row gutter top and bottom. */
	contentHeight: number
	/** Narrow terminals collapse multi-column layouts into a single stack. */
	isCompact: boolean
	/** Enough vertical room to afford the decorative background shader. */
	showShader: boolean
	/** Below this the UI can't render usefully; show a "resize" notice instead. */
	tooSmall: boolean
}

/**
 * Central responsive hook. Subscribes to terminal size via
 * `useTerminalDimensions()` and returns the measurements/breakpoints the rest
 * of the app renders against, so breakpoint logic lives in exactly one place.
 */
export function useLayout(): Layout {
	const { width, height } = useTerminalDimensions()

	return {
		termWidth: width,
		termHeight: height,
		contentWidth: Math.min(spacing.maxContentWidth, width - 2),
		contentHeight: height - 2,
		isCompact: width < 60,
		showShader: height >= 22,
		tooSmall: width < 40 || height < 20,
	}
}
