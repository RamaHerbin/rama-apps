import type { Ref } from 'react'
import { TextAttributes } from '@opentui/core'
import { theme } from '../theme'
import { portfolio } from '../content'
import { ViewShell } from './ViewShell'

interface ContactViewProps {
	scrollRef: Ref<any>
}

/**
 * Strips the scheme off a contact href for display ("mailto:x@y.com" -> "x@y.com",
 * "https://github.com/x" -> "github.com/x") while the underlying <a> keeps the full URL.
 */
function displayHref(href: string): string {
	return href.replace(/^mailto:/, '').replace(/^https?:\/\//, '')
}

/** Where-to-reach-me screen: one label + link row per contact entry, location at the bottom. */
export function ContactView({ scrollRef }: ContactViewProps) {
	return (
		<ViewShell title="Contact" scrollRef={scrollRef}>
			<box flexDirection="column" padding={1} gap={1}>
				{portfolio.contact.map((entry) => (
					<box key={entry.label} flexDirection="row" gap={1}>
						<text fg={theme.fg} attributes={TextAttributes.BOLD}>
							{entry.label}
						</text>
						<text>
							<a href={entry.href} fg={theme.accent}>
								{displayHref(entry.href)}
							</a>
						</text>
					</box>
				))}
				<text fg={theme.dim} marginTop={1}>
					{portfolio.basedIn}
				</text>
			</box>
		</ViewShell>
	)
}
