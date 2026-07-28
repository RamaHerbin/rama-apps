import type { ReactNode, Ref } from 'react'
import { TextAttributes } from '@opentui/core'
import { theme } from '../theme'
import { useLayout } from '../useLayout'

interface ViewShellProps {
	title: string
	/** Forwarded straight to the underlying scrollbox so the parent (App) can drive scrolling. */
	scrollRef: Ref<any>
	children: ReactNode
}

/**
 * Chrome shared by every content view: a title + navigation hint header,
 * a hairline rule sized to the content column, then a scrollable body.
 * Views only need to supply their own content — the shell handles framing.
 */
export function ViewShell({ title, scrollRef, children }: ViewShellProps) {
	const { contentWidth } = useLayout()
	// Guard against a negative repeat count on pathologically narrow terminals
	// (String.prototype.repeat throws on negative input).
	const rule = '─'.repeat(Math.max(0, contentWidth - 1))

	return (
		<box flexDirection="column" flexGrow={1}>
			<box flexDirection="row" justifyContent="space-between">
				<text fg={theme.fg} attributes={TextAttributes.BOLD}>
					{title}
				</text>
				<text fg={theme.dim}>← back (esc) · ↑↓ scroll</text>
			</box>
			<text fg={theme.dim}>{rule}</text>
			<scrollbox flexGrow={1} ref={scrollRef}>
				{children}
			</scrollbox>
		</box>
	)
}
