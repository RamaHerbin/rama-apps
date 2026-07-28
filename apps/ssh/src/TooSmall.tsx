/** @jsxImportSource @opentui/react */
import { TextAttributes } from '@opentui/core'
import { theme } from './theme'

/**
 * Shown when the terminal is below the usable minimum. Kept intentionally tiny
 * so it renders even in the cramped viewport it is warning about.
 */
export function TooSmall() {
	return (
		<box
			width="100%"
			height="100%"
			flexDirection="column"
			justifyContent="center"
			alignItems="center"
			backgroundColor={theme.bg}
		>
			<text fg={theme.error} attributes={TextAttributes.BOLD}>
				terminal too small
			</text>
			<text fg={theme.dim}>resize to at least 40x20</text>
		</box>
	)
}
