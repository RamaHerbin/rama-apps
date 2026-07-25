<script lang="ts">
	import type { Verdict } from '$lib/hdr/verdict.js';

	let { verdict }: { verdict: Verdict } = $props();
</script>

<section class="card">
	<span class="tick tick-tl"></span>
	<span class="tick tick-tr"></span>
	<span class="tick tick-bl"></span>
	<span class="tick tick-br"></span>

	<h2 class="headline" class:headline-yes={verdict.yes}>{verdict.title}</h2>
	<p class="verdict-body">{verdict.body}</p>
	<p class="readout">{verdict.detail}</p>
</section>
