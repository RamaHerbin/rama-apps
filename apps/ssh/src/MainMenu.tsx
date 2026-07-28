/** @jsxImportSource @opentui/react */
import { useMemo } from 'react'
import { measureText, TextAttributes } from '@opentui/core'
import { portfolio } from './content'
import { theme } from './theme'
import { MENU } from './types'
import type { Layout } from './useLayout'
import { ShaderBand } from './ShaderBand'
import { useSessionCount } from './sessions'

/** Compact 2-row wordmark font; measured below to decide if it fits. */
const NAME_FONT = 'tiny' as const
/** Columns reserved for the menu label so hints line up in a column. */
const LABEL_WIDTH = 9

interface MainMenuProps {
	layout: Layout
	/** Currently highlighted MENU row (owned by App). */
	menuIndex: number
}

/** Strip protocol / mailto / trailing slash to a human-readable handle. */
function shortLink(href: string): string {
	return href
		.replace(/^mailto:/, '')
		.replace(/^https?:\/\//, '')
		.replace(/^www\./, '')
		.replace(/\/$/, '')
}

/** Look a contact link up by label, tolerating case and missing entries. */
function contact(label: string) {
	return portfolio.contact.find((l) => l.label.toLowerCase() === label)
}

/**
 * The landing screen: ASCII wordmark, an animated shader band that soaks up the
 * vertical slack, the navigable menu with a metadata aside, and a footer that
 * reports how many people are exploring right now. Purely presentational —
 * navigation lives in App.
 */
export function MainMenu({ layout, menuIndex }: MainMenuProps) {
	const { contentWidth, contentHeight, isCompact, showShader } = layout
	const sessions = useSessionCount()

	// The wordmark is a fixed string, so measure it once. If it can't fit the
	// content column (narrow terminals), drop to a plain bold line.
	const nameSize = useMemo(() => measureText({ text: portfolio.name, font: NAME_FONT }), [])
	const asciiFits = nameSize.width <= contentWidth
	const headerRows = (asciiFits ? nameSize.height : 1) + 2 // + role + tagline

	// The metadata aside is taller than the 3-row menu, so the menu block is as
	// tall as whichever column wins (only when the aside is actually shown).
	const meta: [string, string][] = [
		['location', portfolio.basedIn.replace(/^based in\s+/i, '')],
		['work', portfolio.company],
		['web', shortLink(contact('linkedin')?.href ?? '')],
		['github', shortLink(contact('github')?.href ?? '')],
	]
	const blockRows = isCompact ? MENU.length : Math.max(MENU.length, meta.length)

	// Shader height = whatever's left after header, menu block, its two margins,
	// and the footer (a spacer row + the footer line). Only shown with the room.
	const bandHeight = contentHeight - headerRows - blockRows - 4
	const bandVisible = showShader && bandHeight >= 4

	return (
		<box
			width="100%"
			height="100%"
			flexDirection="column"
			alignItems="center"
			paddingTop={1}
			paddingBottom={1}
			backgroundColor={theme.bg}
		>
			<box width={contentWidth} flexGrow={1} flexDirection="column">
				{/* Header: wordmark, role, tagline. */}
				<box flexDirection="column">
					{asciiFits ? (
						<ascii-font text={portfolio.name} font={NAME_FONT} color={theme.accent} />
					) : (
						<text fg={theme.accent} attributes={TextAttributes.BOLD}>
							{portfolio.name}
						</text>
					)}
					<text fg={theme.muted}>{portfolio.role}</text>
					<text fg={theme.dim}>{portfolio.tagline}</text>
				</box>

				{/* Decorative band, or a flexible spacer that pins the footer down. */}
				{bandVisible ? (
					<box marginTop={1} marginBottom={1}>
						<ShaderBand width={contentWidth} height={bandHeight} />
					</box>
				) : (
					<box flexGrow={1} />
				)}

				{/* Menu, with the metadata aside on the right when there's room. */}
				<box flexDirection="row" justifyContent="space-between">
					<box flexDirection="column">
						{MENU.map((entry, i) => {
							const selected = i === menuIndex
							return (
								<text key={entry.id} fg={selected ? theme.accent : theme.muted}>
									<span>{selected ? '> ' : '  '}</span>
									<b>{entry.label.padEnd(LABEL_WIDTH)}</b>
									<span fg={theme.dim}>{entry.hint}</span>
								</text>
							)
						})}
					</box>

					{!isCompact && (
						<box flexDirection="column">
							{meta.map(([label, value]) => (
								<text key={label} fg={theme.muted}>
									<span fg={theme.dim}>{label.padEnd(LABEL_WIDTH)}</span>
									{value}
								</text>
							))}
						</box>
					)}
				</box>

				{/* Footer: live presence (only when shared) + the key legend. */}
				<box height={1} />
				<text fg={theme.dim}>
					{sessions > 1 ? (
						<span fg={theme.ok}>{`${sessions} explorers connected  ·  `}</span>
					) : null}
					up/down navigate · enter select · q quit
				</text>
			</box>
		</box>
	)
}
