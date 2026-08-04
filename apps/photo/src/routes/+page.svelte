<script lang="ts">
	import SEOHead from '$lib/components/SEOHead.svelte';
	import ScatterHome from '$lib/components/ScatterHome.svelte';

	let { data } = $props();
</script>

<SEOHead
	title="{data.site.title} — Photography Portfolio"
	description={data.site.description}
	url={data.site.url}
/>

<ScatterHome photos={data.photos} name="RAMA HERBIN" />
