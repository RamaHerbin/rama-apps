/** Top-level screens. `main` is the landing menu; the rest are content views. */
export type View = 'main' | 'about' | 'projects' | 'contact'

export interface MenuEntry {
	/** The view this entry navigates to (never the landing screen itself). */
	id: Exclude<View, 'main'>
	label: string
	/** Short one-line description shown beside the label. */
	hint: string
}

/** Landing-screen menu, in display order. */
export const MENU: MenuEntry[] = [
	{ id: 'about', label: 'About', hint: 'who i am & what i do' },
	{ id: 'projects', label: 'Projects', hint: 'selected work' },
	{ id: 'contact', label: 'Contact', hint: 'links & where to reach me' },
]
