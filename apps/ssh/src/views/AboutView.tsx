import type { Ref } from 'react'
import { theme } from '../theme'
import { portfolio } from '../content'
import { ViewShell } from './ViewShell'

interface AboutViewProps {
	scrollRef: Ref<any>
}

/** The "who I am" screen: bio paragraphs followed by a compact facts block. */
export function AboutView({ scrollRef }: AboutViewProps) {
	return (
		<ViewShell title="About" scrollRef={scrollRef}>
			<box flexDirection="column" padding={1} gap={1}>
				{portfolio.about.map((paragraph, index) => (
					<text key={index} fg={theme.fg} wrapMode="word">
						{paragraph}
					</text>
				))}
				<box flexDirection="column" marginTop={1}>
					<text fg={theme.muted}>{portfolio.role}</text>
					<text fg={theme.muted}>
						{portfolio.workingAt} {portfolio.company}
					</text>
					<text fg={theme.muted}>{portfolio.basedIn}</text>
				</box>
			</box>
		</ViewShell>
	)
}
