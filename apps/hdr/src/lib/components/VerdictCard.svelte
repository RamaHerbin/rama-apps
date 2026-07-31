<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Verdict } from '$lib/hdr/verdict.js';
	import { splitTitle } from '$lib/hdr/title.js';
	import EyebrowBadge from './EyebrowBadge.svelte';

	let {
		verdict,
		statusLabel,
		live = false,
		swatches,
		actions
	}: {
		verdict: Verdict;
		statusLabel: string;
		live?: boolean;
		swatches?: Snippet;
		actions?: Snippet;
	} = $props();

	const lines = $derived(splitTitle(verdict.title));

	// verdict.detail is "key: value · key: value · ...". Split into segments so
	// each value can be tinted on its own; a segment without a "key: " prefix
	// (shouldn't happen with real verdicts, but keeps this defensive) renders
	// as a plain label.
	type Segment = { key: string; value: string };
	const segments: Segment[] = $derived(
		verdict.detail.split(' · ').map((seg) => {
			const m = /^([^:]+):\s*(.+)$/.exec(seg);
			return m ? { key: m[1], value: m[2] } : { key: '', value: seg };
		})
	);

	// Values that mean "no" no matter which key they answer under — rendered
	// muted instead of the key's accent color.
	const NEGATIVE = new Set(['none', 'standard', 'srgb', 'webgl-sdr', 'webgl-p3', 'webgpu-sdr']);

	function valClass(key: string, value: string): string {
		if (NEGATIVE.has(value)) return 'muted';
		if (key === 'render') return 'violet';
		if (key === 'dynamic-range') return 'cyan';
		if (key === 'color-gamut') return 'magenta';
		return 'muted';
	}
</script>

<div class="card-eyebrow-row">
	<p class="eyebrow"><EyebrowBadge {live} yes={verdict.yes === true} /> HDR display test</p>
	<p class="eyebrow">{statusLabel}</p>
</div>

{#key verdict.case}
	<h2 class="headline" class:headline-yes={verdict.yes}>
		{#each lines as line}
			<span class="headline-line">{line}</span>
		{/each}
	</h2>
	<div class="underline-bar" aria-hidden="true"></div>
{/key}

<!-- Swatches live outside the {#key} below: the WebGPU swatch canvas must not
     re-initialize when the verdict changes (e.g. a monitor drag mid-session). -->
<div class="card-columns grid grid-cols-1 gap-8 sm:grid-cols-[1.15fr_0.85fr] sm:gap-12 items-start">
	{#key verdict.case}
		<p class="body-copy">{verdict.body}</p>
	{/key}
	{#if swatches}
		{@render swatches()}
	{/if}
</div>

<hr class="divider" />

{#key verdict.case}
	<p class="readout">
		{#each segments as seg, i}
			{#if i > 0}<span class="readout-sep"> · </span>{/if}
			{#if seg.key}<span class="readout-key">{seg.key}:</span> <span
					class="readout-val"
					data-tint={valClass(seg.key, seg.value)}>{seg.value}</span
				>{:else}<span class="readout-key">{seg.value}</span>{/if}
		{/each}
	</p>
{/key}

{#if actions}
	<div class="card-actions flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between">
		{@render actions()}
	</div>
{/if}
