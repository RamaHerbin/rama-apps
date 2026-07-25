<script lang="ts">
	import type { Scene } from '$lib/lang-tree-core';

	interface Props {
		scene: Scene;
		onpick: (id: string) => void;
	}

	let { scene, onpick }: Props = $props();

	let open = $state(true);
</script>

<div
	onwheel={(e) => e.stopPropagation()}
	onpointerdown={(e) => e.stopPropagation()}
	style="position:absolute;left:16px;bottom:16px;width:284px;background:rgba(242,236,221,.95);border:1px solid #24344166;border-radius:4px;box-shadow:0 10px 30px rgba(30,42,53,.2);z-index:4;overflow:hidden;"
>
	<div
		onclick={() => (open = !open)}
		style="display:flex;justify-content:space-between;align-items:center;padding:9px 14px;cursor:pointer;border-bottom:1px solid #2434412a;font-family:'IM Fell English SC',Georgia,serif;font-size:17px;"
	>
		<span>Legend & families</span>
		<span
			style="font-size:13px;color:#5d6d7b;font-family:'EB Garamond',Georgia,serif;font-style:italic;"
			>{open ? 'hide' : 'show'}</span
		>
	</div>

	{#if open}
		<div style="max-height:44vh;overflow:auto;padding:10px 14px 12px;">
			<div style="font-size:13.5px;line-height:1.45;color:#42525f;display:flex;flex-direction:column;gap:4px;">
				<div>Branch thickness ∝ native speakers.</div>
				<div>Scroll to zoom, drag to pan, click any name for details.</div>
				<div>† — extinct or revived language.</div>
				<div style="font-style:italic;">
					The shared trunk is artistic licence: these families are not known to be related.
				</div>
			</div>
			<div style="margin-top:10px;display:flex;flex-direction:column;">
				{#each scene.families as f (f.id)}
					<div
						class="family-row"
						onclick={() => onpick(f.id)}
						style="display:flex;align-items:center;gap:8px;padding:4px 2px;cursor:pointer;border-top:1px solid #2434411f;"
					>
						<span
							style="width:10px;height:10px;border-radius:50%;background:{f.color};flex:0 0 auto;"
						></span>
						<span style="flex:1;font-size:14.5px;">{f.name}</span>
						<span style="font-size:12px;color:#5d6d7b;white-space:nowrap;">{f.sTxt} · {f.count}</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.family-row:hover {
		background: #e6dcc4;
	}
</style>
