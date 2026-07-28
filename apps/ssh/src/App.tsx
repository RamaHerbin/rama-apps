/** @jsxImportSource @opentui/react */
import { useRef, useState } from 'react'
import { useKeyboard, useRenderer } from '@opentui/react'
import type { ScrollBoxRenderable } from '@opentui/core'
import { useLayout } from './useLayout'
import { MENU, type View } from './types'
import { theme } from './theme'
import { MainMenu } from './MainMenu'
import { TooSmall } from './TooSmall'
import { AboutView, ProjectsView, ContactView } from './views'

/** The sub-views, keyed by the {@link View} they belong to. */
const VIEWS = {
	about: AboutView,
	projects: ProjectsView,
	contact: ContactView,
} as const

/**
 * Root of the SSH TUI. Owns *all* navigation state (which screen is showing and,
 * on the landing menu, which entry is highlighted) and the single global
 * keyboard handler that drives it. Every other component is presentational.
 */
export function App() {
	const layout = useLayout()
	const { termWidth, termHeight, contentHeight, tooSmall } = layout

	const [view, setView] = useState<View>('main')
	const [menuIndex, setMenuIndex] = useState(0)

	// One ref, reused by whichever sub-view is mounted (only ever one at a time).
	// Sub-views attach it to their <scrollbox> so we can drive scrolling from the
	// central key handler rather than relying on per-view focus.
	const scrollRef = useRef<ScrollBoxRenderable | null>(null)

	// Quitting means tearing down *this* renderer. In an SSH session that closes
	// the channel for this client alone; a shared server must never process.exit.
	// The dev harness is responsible for exiting its own process on teardown.
	const renderer = useRenderer()
	const exited = useRef(false)
	const exit = () => {
		if (exited.current) return
		exited.current = true
		try {
			renderer.destroy()
		} catch {
			// Renderer already torn down (e.g. client vanished mid-keystroke).
		}
	}

	useKeyboard((key) => {
		// Ctrl+C always quits, on any screen.
		if (key.ctrl && key.name === 'c') {
			exit()
			return
		}

		if (view === 'main') {
			switch (key.name) {
				case 'up':
				case 'k':
					setMenuIndex((i) => (i - 1 + MENU.length) % MENU.length)
					break
				case 'down':
				case 'j':
					setMenuIndex((i) => (i + 1) % MENU.length)
					break
				case 'return':
				case 'enter':
					setView(MENU[menuIndex].id)
					break
				case 'q':
					exit()
					break
			}
			return
		}

		// Sub-view: scroll the active view, or step back to the menu.
		switch (key.name) {
			case 'escape':
			case 'backspace':
			case 'q':
				setView('main')
				break
			case 'up':
			case 'k':
				scrollRef.current?.scrollBy({ x: 0, y: -1 })
				break
			case 'down':
			case 'j':
				scrollRef.current?.scrollBy({ x: 0, y: 1 })
				break
			case 'pageup': {
				const page = Math.max(1, (scrollRef.current?.viewport.height ?? contentHeight) - 1)
				scrollRef.current?.scrollBy({ x: 0, y: -page })
				break
			}
			case 'pagedown': {
				const page = Math.max(1, (scrollRef.current?.viewport.height ?? contentHeight) - 1)
				scrollRef.current?.scrollBy({ x: 0, y: page })
				break
			}
		}
	})

	const ActiveView = view === 'main' ? null : VIEWS[view]

	// Key the tree on terminal size so a resize remounts the subtree cleanly
	// (fresh scrollbox, re-measured layout) while App-owned state survives.
	return (
		<box
			key={`${termWidth}x${termHeight}`}
			width="100%"
			height="100%"
			backgroundColor={theme.bg}
		>
			{tooSmall ? (
				<TooSmall />
			) : ActiveView ? (
				<ActiveView scrollRef={scrollRef} />
			) : (
				<MainMenu layout={layout} menuIndex={menuIndex} />
			)}
		</box>
	)
}
