<script lang="ts">
	import Stage from '$lib/components/Stage.svelte';
	import SearchBox from '$lib/components/SearchBox.svelte';
	import LegendPanel from '$lib/components/LegendPanel.svelte';
	import InfoCard from '$lib/components/InfoCard.svelte';
	import { buildScene } from '$lib/lang-tree-core';

	// Pure + memoized: safe to run during SSR / prerender.
	const scene = buildScene();

	let stage = $state<ReturnType<typeof Stage>>();
	let selId = $state<string | null>(null);
	const selNode = $derived(selId ? scene.reg[selId] : null);

	function handleSelect(id: string | null) {
		selId = id;
		if (id) stage?.focus(id);
	}
</script>

<svelte:head>
	<title>The Tree of World Languages</title>
	<meta
		name="description"
		content="An illustrated tree of the world's language families, with branch thickness reflecting native speakers. Search, zoom and explore around 180 languages across every major family."
	/>
</svelte:head>

<div class="app">
	<header class="topbar">
		<div class="titles">
			<div class="title">The Tree of World Languages</div>
			<div class="subtitle">
				Branch thickness reflects native speakers · one trunk, many unrelated families
			</div>
		</div>
		<SearchBox {scene} onpick={handleSelect} />
		<a class="poster-link" href="/poster">Poster version →</a>
	</header>
	<div class="stage-area">
		<Stage bind:this={stage} {scene} onselect={handleSelect} />
		<LegendPanel {scene} onpick={handleSelect} />
		{#if selNode}
			<InfoCard node={selNode} onclose={() => (selId = null)} />
		{/if}
	</div>
</div>

<style>
	.app {
		position: fixed;
		inset: 0;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}
	.topbar {
		display: flex;
		align-items: center;
		gap: 18px;
		padding: 10px 20px;
		border-bottom: 2px solid #243441;
		background: #e9e1cf;
		position: relative;
		z-index: 5;
	}
	.titles {
		flex: 1 1 auto;
		min-width: 0;
	}
	.title {
		font-family: 'IM Fell English SC', Georgia, serif;
		font-size: 24px;
		line-height: 1.1;
	}
	.subtitle {
		font-style: italic;
		font-size: 13px;
		color: #5d6d7b;
	}
	.poster-link {
		font-size: 14px;
		flex: 0 0 auto;
		white-space: nowrap;
	}
	.stage-area {
		position: relative;
		flex: 1;
		overflow: hidden;
	}

	@media (max-width: 720px) {
		.topbar {
			flex-wrap: wrap;
			gap: 8px 12px;
			padding: 10px 14px;
		}
		/* titles take the first row; search + poster link share the second */
		.titles {
			flex: 1 1 100%;
		}
		.title {
			font-size: 20px;
		}
	}
</style>
