<script lang="ts">
	let {
		live = false,
		yes = false
	}: {
		live?: boolean;
		yes?: boolean;
	} = $props();
</script>

<span class="badge-ring" data-live={live} data-yes={yes}>
	<span class="dot" data-live={live} data-yes={yes}></span>
</span>
