<script lang="ts">
	import type { Snippet } from 'svelte';
	import { GlowBorder } from 'fancy-ui-svelte';

	let {
		verdictCase,
		children
	}: {
		verdictCase: string;
		children: Snippet;
	} = $props();

	/* Per-verdict border glow, layered on top of the CSS accent tokens set via
	   `.bigcard[data-verdict]` (--accent-underline / --accent-glow-soft) in
	   app.css — those two are the source of truth for hue, this just picks a
	   matching gradient for the animated ring. */
	const ACCENT: Record<string, string[]> = {
		'true-hdr': ['#42cfff', '#a142ff', '#ff2fd6'],
		'browser-clamped': ['rgba(66, 207, 255, 0.5)', 'rgba(255, 255, 255, 0.25)'],
		'screen-sdr': ['rgba(161, 66, 255, 0.45)', 'rgba(255, 255, 255, 0.25)'],
		'no-hdr': ['rgba(255, 255, 255, 0.3)']
	};

	const colors = $derived(ACCENT[verdictCase] ?? ACCENT['no-hdr']);
</script>

<section class="bigcard" data-verdict={verdictCase}>
	<GlowBorder borderRadius={28} borderWidth={1.5} duration={14} color={colors} />
	<div class="bigcard-content">
		{@render children()}
	</div>
</section>
