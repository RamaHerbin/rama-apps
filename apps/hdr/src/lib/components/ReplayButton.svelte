<script lang="ts">
	let {
		onreplay,
		disabled = false
	}: {
		onreplay: () => void;
		disabled?: boolean;
	} = $props();
</script>

<button class="btn" type="button" {disabled} onclick={onreplay}>
	<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
		<path
			d="M10.5 6a4.5 4.5 0 1 1-1.32-3.18"
			stroke="currentColor"
			stroke-width="1.3"
			stroke-linecap="round"
		/>
		<path d="M10.6 1v2.2H8.4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" />
	</svg>
	Light it again
</button>
