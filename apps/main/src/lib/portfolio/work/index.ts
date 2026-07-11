// Portfolio "work" redesign primitives (FROZEN CONTRACT).
export { default as SectionLabel } from "./SectionLabel.svelte";
export { default as MetaStrip } from "./MetaStrip.svelte";
export { default as Tag } from "./Tag.svelte";
export { default as MediaFrame } from "./MediaFrame.svelte";
export { default as VideoPlayer } from "./VideoPlayer.svelte";
export { default as VideoLightbox } from "./VideoLightbox.svelte";
export { default as ContextBar } from "./ContextBar.svelte";
export { default as PrevNext } from "./PrevNext.svelte";
export { default as FilmGrain } from "./FilmGrain.svelte";

export { claimPlayback } from "./VideoPlayer.svelte";

export {
	productions,
	fdpHeroMeta,
	bnfMeta,
	approach,
	agencyStack
} from "./productions.js";
export type {
	Production,
	ProductionIndex,
	ProductionLayout,
	ProductionVideo,
	MetaItem,
	ApproachItem
} from "./productions.js";
