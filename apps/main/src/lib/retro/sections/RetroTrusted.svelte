<script lang="ts">
	/**
	 * 01 THEY TRUSTED ME — the logo row, set as type.
	 *
	 * The std section (`portfolio/sections/Trusted.svelte`) marquees seven SVG
	 * wordmarks through `AnimatedLogoCloud`. This skin has no SVGs and no marquee:
	 * the mockup sets each name as a TEXT wordmark, hand-cut to echo the brand's
	 * own lettering, and lays them out as one static wrapping row. That is the
	 * whole section — a printed client list on a bordered slab.
	 *
	 * The names are the same seven, in the same order, hardcoded exactly as the std
	 * section hardcodes them: they are marks belonging to their owners, not
	 * editable copy, so neither tree gives them a content key (CONTRACTS §3 —
	 * wordmarks are props, not content).
	 */
	import { SectionWindow } from "$lib/retro";

	/**
	 * Per-logo typography, from SPEC-HOME's table (which reads it off the mockup).
	 *
	 * Every field is a deliberate imitation, not decoration: Ansys is the biggest
	 * and heaviest because its wordmark is; Nvidia and Synopsys are letterspaced
	 * caps; Fleur de Papier is the one serif italic in the design because the
	 * studio's own mark is. Two of the mockup's seven (SOLIDWORKS, MATLAB) are not
	 * clients of this site — the std list replaces them with Gobelins and Claude
	 * for Open Source, styled to the spec's fallback (Archivo 16-17/700).
	 *
	 * `transform` exists because a wordmark's case belongs to the mark, not to the
	 * name we store: "Nvidia" is how the std array labels the asset, NVIDIA is how
	 * the company writes it.
	 */
	interface Wordmark {
		name: string;
		/** px */
		size: number;
		weight: 400 | 700 | 900;
		/** letter-spacing in px; 0 = normal */
		tracking?: number;
		italic?: boolean;
		/** the one non-Archivo mark; resolves to --r-font-wordmark-serif */
		serif?: boolean;
		transform?: "uppercase" | "lowercase";
	}

	const WORDMARKS: Wordmark[] = [
		{ name: "Angular", size: 18, weight: 700 },
		{ name: "Gobelins Paris", size: 17, weight: 700, tracking: 0.5 },
		{ name: "Nvidia", size: 17, weight: 900, tracking: 1.5, transform: "uppercase" },
		{ name: "Synopsys Inc", size: 17, weight: 900, tracking: 1, transform: "uppercase" },
		{
			name: "Fleur de Papier",
			size: 17,
			weight: 400,
			italic: true,
			serif: true,
			transform: "lowercase",
		},
		{ name: "Ansys", size: 21, weight: 900, tracking: -0.5 },
		{ name: "Claude for Open Source", size: 16, weight: 700 },
	];
</script>

<SectionWindow
	id="retro-trusted"
	index="01"
	titleKey="home.trusted.title"
	dosKey="retro.window.trusted.dos"
	accent="blue"
>
	<!-- space-around, not a grid: the marks are different widths by design and a
	     column grid would make the short ones look padded. Wrapping rows stay
	     optically even because each row re-distributes its own slack. -->
	<div
		class="r-trusted-row flex flex-wrap items-center justify-around gap-x-9 gap-y-5 px-7 py-[26px]"
	>
		{#each WORDMARKS as mark (mark.name)}
			<span
				class="text-[var(--r-ink)] opacity-85"
				style="font-size: {mark.size}px; font-weight: {mark.weight}; letter-spacing: {mark.tracking ??
					0}px;{mark.italic ? ' font-style: italic;' : ''}{mark.serif
					? ' font-family: var(--r-font-wordmark-serif);'
					: ''}{mark.transform ? ` text-transform: ${mark.transform};` : ''}">{mark.name}</span
			>
		{/each}
	</div>
</SectionWindow>

<style>
	/*
		The skin's third face, and the only place it appears: one wordmark is a
		serif italic in the mockup (Georgia). It is declared as a scoped --r-* token
		rather than an inline font-family so the retro tree keeps its rule that
		every font comes from a variable — and scoped to this row because it is a
		brand imitation, not a typeface the design system offers.
	*/
	.r-trusted-row {
		--r-font-wordmark-serif: Georgia, "Times New Roman", serif;
	}
</style>
