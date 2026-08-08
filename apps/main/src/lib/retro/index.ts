/**
 * Retro-OS — public surface of the skin's component tree.
 *
 *   import { SectionWindow, RetroButton, type Accent } from "$lib/retro";
 *
 * Two jobs, and they are the reason this file exists rather than everyone
 * importing components by path:
 *
 *  1. It imports `./retro.css` — the `.r-*` recipe layer — exactly once. Any
 *     consumer that renders a retro component has, by construction, already
 *     pulled the recipes in; nobody has to remember the stylesheet. It is
 *     deliberately NOT reachable from `layout.css`, so a visitor who never
 *     touches the retro tree never downloads it.
 *  2. It names the accent vocabulary (below), which is the one piece of shared
 *     state between otherwise independent components.
 *
 * SCOPE — what is deliberately absent
 * `sections/`, `pages/`, and the two page-specific case components
 * (`case/ProductionRow`, `case/ProjectCard`) are NOT re-exported. They have
 * exactly one consumer each and are imported by path from it. A barrel that
 * re-exports leaves as well as building blocks turns every page into a
 * dependency of every other page — importing one section would drag the whole
 * skin into the chunk.
 *
 * CYCLE NOTE for component authors
 * A component under `retro/` may import `Accent`/`accentVar` from here even
 * though this file re-exports that component: ES modules resolve the cycle
 * because nothing below is read at module-evaluation time — `accentVar()` is
 * called during render, long after every module has finished evaluating. Prefer
 * `import type { Accent }` where only the type is needed; a type-only import is
 * erased entirely and cannot form a cycle at all.
 */

import "./retro.css";

// =============================================================================
// Accent vocabulary
// =============================================================================

/**
 * The four accents, and the whole colour decision surface of the skin.
 *
 * Components take an `Accent` rather than a CSS colour so the choice stays
 * nameable ("this section is the blue one") and so a section, its titlebar dot,
 * its cards' hover shadows and their tag fills cannot drift apart.
 */
export type Accent = "blue" | "rust" | "gold" | "green";

/** Accent → the saturated ink used for dots, chips and hover shadows. */
export const ACCENT_VAR: Record<Accent, string> = {
	blue: "var(--r-blue)",
	rust: "var(--r-rust)",
	gold: "var(--r-gold)",
	green: "var(--r-green)",
};

/**
 * Accent → its pale wash, used for fills large enough that the saturated value
 * would take over the page (card tints, tag pills, titlebar backgrounds).
 * Paired 1:1 with ACCENT_VAR on purpose: a tint that does not belong to the
 * section's accent is the single most visible way this design goes wrong.
 */
export const ACCENT_TINT: Record<Accent, string> = {
	blue: "var(--r-tint-blue)",
	rust: "var(--r-tint-rust)",
	gold: "var(--r-tint-gold)",
	green: "var(--r-tint-green)",
};

/** `accentVar("rust")` → `"var(--r-rust)"`. */
export function accentVar(accent: Accent): string {
	return ACCENT_VAR[accent];
}

/** `accentTint("rust")` → `"var(--r-tint-rust)"`. */
export function accentTint(accent: Accent): string {
	return ACCENT_TINT[accent];
}

// =============================================================================
// atoms/ — the smallest painted things
// =============================================================================

export { default as RetroButton } from "./atoms/RetroButton.svelte";
export { default as Chip } from "./atoms/Chip.svelte";
export { default as NumChip } from "./atoms/NumChip.svelte";
export { default as RetroTag } from "./atoms/RetroTag.svelte";
export { default as StatusPill } from "./atoms/StatusPill.svelte";
export { default as PixelGlyph } from "./atoms/PixelGlyph.svelte";
export { default as Led } from "./atoms/Led.svelte";
export { default as Swatches } from "./atoms/Swatches.svelte";
export { default as IconTile } from "./atoms/IconTile.svelte";
export { default as InlineIndexLabel } from "./atoms/InlineIndexLabel.svelte";

// =============================================================================
// windows/ — the four container grammars (A: section, B: notched, C: app, D: card)
// =============================================================================

export { default as SectionWindow } from "./windows/SectionWindow.svelte";
export { default as NotchedFrame } from "./windows/NotchedFrame.svelte";
export { default as AppWindow } from "./windows/AppWindow.svelte";
export { default as RetroCard } from "./windows/RetroCard.svelte";

// =============================================================================
// media/ — video, figures, logos
// =============================================================================

export { default as PlayBadge } from "./media/PlayBadge.svelte";
export { default as VideoFrame } from "./media/VideoFrame.svelte";
export { default as EmptyMediaFrame } from "./media/EmptyMediaFrame.svelte";
export { default as FigurePlate } from "./media/FigurePlate.svelte";
export { default as LogoPlate } from "./media/LogoPlate.svelte";

// =============================================================================
// chrome/ — persistent page furniture
// =============================================================================

export { default as HeaderBar } from "./chrome/HeaderBar.svelte";
export { default as CaseHeaderBar } from "./chrome/CaseHeaderBar.svelte";
export { default as SkinSwitch } from "./chrome/SkinSwitch.svelte";
export { default as LocalTimeClock } from "./chrome/LocalTimeClock.svelte";
export { default as RetroFooter } from "./chrome/RetroFooter.svelte";

// =============================================================================
// case/ — shared case-study building blocks
//
// ProductionRow and ProjectCard are absent on purpose (see SCOPE above): each
// belongs to a single page and is imported from it by path.
// =============================================================================

export { default as HeroTitleBar } from "./case/HeroTitleBar.svelte";
export { default as RetroMetaStrip } from "./case/RetroMetaStrip.svelte";
export { default as LabeledTagRow } from "./case/LabeledTagRow.svelte";
export { default as NumberedCard } from "./case/NumberedCard.svelte";
export { default as DefinitionRow } from "./case/DefinitionRow.svelte";
export { default as PrevNextNav } from "./case/PrevNextNav.svelte";
