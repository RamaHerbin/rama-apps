<script lang="ts">
	import type { Scene } from '$lib/lang-tree-core';

	interface Props {
		scene: Scene;
		onpick: (id: string) => void;
	}

	let { scene, onpick }: Props = $props();

	let q = $state('');

	interface Result {
		id: string;
		t: string;
		sub: string;
	}

	const results = $derived.by((): Result[] => {
		const query = q.trim().toLowerCase();
		if (query.length < 2) return [];
		return Object.values(scene.reg)
			.filter((n) => n.name.toLowerCase().includes(query))
			.sort(
				(a, b) =>
					(Number(b.kind === 'Language') - Number(a.kind === 'Language')) || b.s - a.s
			)
			.slice(0, 8)
			.map((n) => ({ id: n.id, t: n.name, sub: n.lineage || n.kind }));
	});

	function pick(id: string) {
		onpick(id);
		q = '';
	}
</script>

<div class="box" onwheel={(e) => e.stopPropagation()}>
	<input
		type="text"
		value={q}
		oninput={(e) => (q = e.currentTarget.value)}
		placeholder="Search a language…"
		style="width:100%;box-sizing:border-box;padding:8px 12px;border:1px solid #24344188;border-radius:3px;background:#f2ecdd;font-family:'EB Garamond',Georgia,serif;font-size:15px;color:#243441;"
	/>
	{#if results.length > 0}
		<div class="dropdown">
			{#each results as r (r.id)}
				<div class="row" onclick={() => pick(r.id)}>
					<span style="font-weight:600;">{r.t}</span>
					<span style="font-size:12px;color:#5d6d7b;"> — {r.sub}</span>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.box {
		position: relative;
		/* shrinkable so the header still fits on narrow screens */
		flex: 0 1 320px;
		min-width: 140px;
	}

	.dropdown {
		position: absolute;
		top: 40px;
		left: 0;
		right: 0;
		background: #f2ecdd;
		border: 1px solid #24344155;
		border-radius: 3px;
		box-shadow: 0 8px 24px rgba(30, 42, 53, 0.25);
		overflow: hidden;
		z-index: 9;
	}

	.row {
		padding: 7px 12px;
		cursor: pointer;
		border-bottom: 1px solid #2434411a;
	}

	.row:hover {
		background: #e2d9c2;
	}
</style>
