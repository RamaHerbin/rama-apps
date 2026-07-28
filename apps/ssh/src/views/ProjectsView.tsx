import type { Ref } from 'react'
import { TextAttributes } from '@opentui/core'
import { theme } from '../theme'
import { portfolio } from '../content'
import { ViewShell } from './ViewShell'

interface ProjectsViewProps {
	scrollRef: Ref<any>
}

/** Selected-work screen: one eyebrow + title + description + tag line per project. */
export function ProjectsView({ scrollRef }: ProjectsViewProps) {
	const projects = portfolio.projects
	return (
		<ViewShell title="Projects" scrollRef={scrollRef}>
			<box flexDirection="column" padding={1}>
				{projects.map((project, index) => (
					<box
						key={project.index || index}
						flexDirection="column"
						// Blank line between entries, but not trailing after the last one.
						marginBottom={index < projects.length - 1 ? 1 : 0}
					>
						<text wrapMode="word">
							<span fg={theme.accent}>{`( ${project.index} )`}</span>
							<span>{'  '}</span>
							<span attributes={TextAttributes.BOLD}>{project.title}</span>
						</text>
						<text fg={theme.muted} wrapMode="word">
							{project.description}
						</text>
						<text fg={theme.dim}>{project.tags.join(' · ')}</text>
					</box>
				))}
			</box>
		</ViewShell>
	)
}
