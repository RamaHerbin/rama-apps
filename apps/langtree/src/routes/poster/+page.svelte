<script lang="ts">
	import { buildScene } from '$lib/lang-tree-core';

	// Pure + memoized: safe to run during SSR / prerender.
	const scene = buildScene();

	const labels = scene.labels.map((l) => {
		const dx = l.an === 'middle' ? -50 : l.an === 'end' ? -100 : 0;
		return {
			...l,
			pos: `translate(${l.x}px, ${l.y}px) rotate(${l.deg || 0}deg) translate(${dx}%, -72%)`
		};
	});

	const families = scene.families.map((f) => ({
		name: f.name,
		color: f.color,
		meta: `${f.sTxt} · ${f.count} lang.`
	}));
</script>

<svelte:head>
	<title>The Tree of World Languages — Poster</title>
	<meta
		name="description"
		content="A printable field guide to the families of human speech: one poster mapping around 180 languages across every major family, sized by native speakers."
	/>
</svelte:head>

<div class="page">
	<div class="sheet">
		<a class="interactive-link" href="/">Interactive version →</a>
		<div class="masthead">
			<div class="eyebrow">A field guide to the families of human speech</div>
			<div class="headline">The Tree of World Languages</div>
			<div class="dek">
				Branch thickness reflects native speakers · † marks extinct or revived tongues
			</div>
			<div class="rule"></div>
		</div>
		<div class="canvas">
			<svg width="1700" height="1040" class="tree-svg">
				<g class="tree-g">
					{#each scene.blobs as b}
						<circle cx={b.x} cy={b.y} r={b.r} fill={b.f} opacity={b.o} class="blob" />
					{/each}
					{#each scene.segs as s}
						<path d={s.d} stroke={s.c} stroke-width={s.w} fill="none" stroke-linecap="round" />
					{/each}
				</g>
			</svg>
			<div class="labels">
				{#each labels as l}
					<div
						class="label"
						style="transform:{l.pos};font-size:{l.fs}px;color:{l.fill};font-family:{l.ff};font-weight:{l.fw};font-style:{l.fst};letter-spacing:{l.ls}px;"
					>
						{l.t}
					</div>
				{/each}
			</div>
		</div>
		<div class="footer">
			<div>
				<div class="footer-title">How to read this tree</div>
				<div class="footer-body">
					<div>
						Every limb is a language family; twigs are its living languages. The thicker the branch, the
						more native speakers it carries.
					</div>
					<div>† marks languages that are extinct, liturgical, or revived.</div>
					<div class="italic">
						The shared trunk is artistic licence — these families are not known to be related. Around
						180 of the world's ~7,000 languages are shown; speaker counts are approximate 2020s
						estimates.
					</div>
				</div>
			</div>
			<div class="family-grid">
				{#each families as f}
					<div class="family-row">
						<span class="dot" style="background:{f.color};"></span>
						<span class="fam-name">{f.name}</span>
						<span class="fam-meta">{f.meta}</span>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>

<style>
	.page {
		min-height: 100vh;
		background: #d8cdb2;
		padding: 40px 0;
		overflow-x: auto;
	}
	.sheet {
		width: 1700px;
		background: #e9e1cf;
		position: relative;
		margin: 0 auto;
		box-shadow: 0 20px 60px rgba(30, 42, 53, 0.3);
	}
	.interactive-link {
		position: absolute;
		top: 18px;
		right: 24px;
		font-size: 14px;
		z-index: 2;
	}
	.masthead {
		text-align: center;
		padding: 40px 40px 0;
	}
	.eyebrow {
		font-size: 13px;
		letter-spacing: 5px;
		text-transform: uppercase;
		color: #5d6d7b;
	}
	.headline {
		font-family: 'IM Fell English SC', Georgia, serif;
		font-size: 54px;
		line-height: 1.05;
		margin-top: 6px;
	}
	.dek {
		font-style: italic;
		font-size: 16px;
		color: #42525f;
		margin-top: 6px;
	}
	.rule {
		width: 220px;
		height: 2px;
		background: #243441;
		margin: 16px auto 0;
	}
	.canvas {
		position: relative;
		margin-top: -20px;
	}
	.tree-svg {
		display: block;
	}
	.tree-g {
		transform-origin: 0 0;
		transform: scale(0.5743);
	}
	.blob {
		filter: blur(16px);
	}
	.labels {
		position: absolute;
		left: 0;
		top: 0;
		width: 0;
		height: 0;
		transform-origin: 0 0;
		transform: scale(0.5743);
		pointer-events: none;
	}
	.label {
		position: absolute;
		left: 0;
		top: 0;
		white-space: nowrap;
		line-height: 1;
		transform-origin: 0 0;
		text-shadow:
			0 1px 3px rgba(235, 227, 209, 0.95),
			0 -1px 3px rgba(235, 227, 209, 0.95),
			1px 0 3px rgba(235, 227, 209, 0.95),
			-1px 0 3px rgba(235, 227, 209, 0.95);
	}
	.footer {
		display: grid;
		grid-template-columns: 400px 1fr;
		gap: 36px;
		padding: 26px 48px 40px;
		border-top: 2px solid #243441;
	}
	.footer-title {
		font-family: 'IM Fell English SC', Georgia, serif;
		font-size: 22px;
	}
	.footer-body {
		font-size: 14.5px;
		line-height: 1.55;
		color: #42525f;
		margin-top: 8px;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.italic {
		font-style: italic;
	}
	.family-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 4px 26px;
		align-content: start;
	}
	.family-row {
		display: flex;
		align-items: center;
		gap: 9px;
		padding: 5px 0;
		border-bottom: 1px solid #2434411f;
	}
	.dot {
		width: 11px;
		height: 11px;
		border-radius: 50%;
		flex: 0 0 auto;
	}
	.fam-name {
		flex: 1;
		font-size: 15px;
	}
	.fam-meta {
		font-size: 12.5px;
		color: #5d6d7b;
		white-space: nowrap;
	}
</style>
