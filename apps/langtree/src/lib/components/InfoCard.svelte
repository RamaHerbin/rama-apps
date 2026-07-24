<script lang="ts">
	import { fmt, type RegNode } from '$lib/lang-tree-core';

	interface Props {
		node: RegNode;
		onclose: () => void;
	}

	let { node, onclose }: Props = $props();

	let kind = $derived(
		node.kind === 'Language'
			? node.ext
				? 'Extinct / revived language'
				: 'Language'
			: node.kind === 'Family'
				? 'Language family'
				: 'Branch'
	);
	let speakers = $derived(
		node.ext ? 'No native speakers today' : fmt(node.s) + ' native speakers'
	);
	let meta = $derived(node.count > 1 ? node.count + ' languages shown' : '');
</script>

<div
	onwheel={(e) => e.stopPropagation()}
	onpointerdown={(e) => e.stopPropagation()}
	style="position:absolute;right:16px;bottom:16px;width:302px;background:rgba(242,236,221,.97);border:1px solid #24344166;border-radius:4px;box-shadow:0 12px 34px rgba(30,42,53,.28);z-index:4;overflow:hidden;"
>
	<div style="height:6px;background:{node.color};"></div>
	<div style="padding:12px 16px 14px;">
		<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
			<div style="font-family:'IM Fell English SC',Georgia,serif;font-size:24px;line-height:1.05;">
				{node.name}
			</div>
			<button
				onclick={onclose}
				style="border:none;background:none;font-size:19px;color:#5d6d7b;padding:2px;cursor:pointer;line-height:1;"
				>×</button
			>
		</div>
		<div
			style="font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#5d6d7b;margin-top:2px;"
		>
			{kind}
		</div>
		{#if node.lineage}
			<div style="font-size:13px;color:#42525f;margin-top:6px;">{node.lineage}</div>
		{/if}
		<div style="margin-top:10px;font-size:17px;font-weight:600;">{speakers}</div>
		{#if meta}
			<div style="font-size:13.5px;color:#42525f;margin-top:2px;">{meta}</div>
		{/if}
		{#if node.region}
			<div style="margin-top:6px;font-size:14.5px;">{node.region}</div>
		{/if}
		{#if node.note}
			<div
				style="margin-top:8px;font-style:italic;font-size:13.5px;color:#42525f;border-top:1px solid #2434412a;padding-top:8px;"
			>
				{node.note}
			</div>
		{/if}
	</div>
</div>
