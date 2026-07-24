<script lang="ts">
	import { onMount } from 'svelte';
	import type { Scene } from '$lib/lang-tree-core';

	interface Props {
		scene: Scene;
		/** default 0; hides labels kind==='lang' with s < threshold */
		labelThreshold?: number;
		/** default true; hides blobs when false */
		foliage?: boolean;
		/** default 1; blob opacity = min(0.85, b.o * canopyOpacity) */
		canopyOpacity?: number;
		/** label click → id (after stopPropagation); clean stage click (movement < 6px) → null */
		onselect?: (id: string | null) => void;
	}

	let {
		scene,
		labelThreshold = 0,
		foliage = true,
		canopyOpacity = 1,
		onselect
	}: Props = $props();

	// DOM ref to the stage area (bound below).
	let stageEl: HTMLDivElement | undefined;

	// View transform. Plain reactive object per the design's `view` state.
	let view = $state({ k: 0.4, tx: 0, ty: 0, anim: false });
	// drag drives cursor + transition gating, so it must be reactive.
	let drag = $state(false);
	// touched: has the user interacted yet? Plain (non-reactive) — only read by resize.
	let touched = false;
	// Active pointer-drag bookkeeping. Plain, non-reactive.
	let p: { x: number; y: number; tx: number; ty: number; m: number } | null = null;

	// Precompute each label's transform once (independent of threshold/props).
	const labels = $derived(
		scene.labels.map((l) => {
			const dx = l.an === 'middle' ? -50 : l.an === 'end' ? -100 : 0;
			const pos = `translate(${l.x}px, ${l.y}px) rotate(${l.deg || 0}deg) translate(${dx}%, -72%)`;
			return { ...l, pos };
		})
	);

	const visibleLabels = $derived(
		labels.filter((l) => l.kind !== 'lang' || (l.s ?? 0) >= labelThreshold)
	);

	const blobs = $derived(
		foliage
			? scene.blobs.map((b) => ({ ...b, op: Math.min(0.85, b.o * canopyOpacity) }))
			: []
	);

	const viewT = $derived(`translate(${view.tx}px, ${view.ty}px) scale(${view.k})`);
	const viewTr = $derived(
		view.anim && !drag ? 'transform .55s cubic-bezier(.25,.8,.3,1)' : 'none'
	);
	const cursor = $derived(drag ? 'grabbing' : 'grab');

	function box(): { width: number; height: number; left: number; top: number } {
		return stageEl
			? stageEl.getBoundingClientRect()
			: { width: 1200, height: 800, left: 0, top: 0 };
	}

	function setView(v: { k: number; tx: number; ty: number; anim: boolean }) {
		v.k = Math.max(0.1, Math.min(6, v.k));
		view = v;
	}

	/** Fit the whole scene, centred (animated). Resets the touched flag. */
	export function fit() {
		touched = false;
		const b = box();
		const k = Math.min(b.width / scene.W, b.height / scene.H) * 0.99;
		view = {
			k,
			tx: (b.width - scene.W * k) / 2,
			ty: (b.height - scene.H * k) / 2,
			anim: true
		};
	}

	/** Centre a node at (width/2, height*0.45), zooming in to at least 1.2 (animated). */
	export function focus(id: string) {
		const n = scene.reg[id];
		if (!n) return;
		touched = true;
		const b = box();
		const k = Math.max(view.k, 1.2);
		setView({ k, tx: b.width / 2 - n.x * k, ty: b.height * 0.45 - n.y * k, anim: true });
	}

	function wheel(e: WheelEvent) {
		// Keep the page from scrolling/zooming under the stage.
		e.preventDefault();
		touched = true;
		const b = box();
		const v = view;
		const mx = e.clientX - b.left;
		const my = e.clientY - b.top;
		const nk = Math.max(0.1, Math.min(6, v.k * Math.exp(-e.deltaY * 0.0016)));
		const f = nk / v.k;
		setView({ k: nk, tx: mx - (mx - v.tx) * f, ty: my - (my - v.ty) * f, anim: false });
	}

	function pdown(e: PointerEvent) {
		touched = true;
		p = { x: e.clientX, y: e.clientY, tx: view.tx, ty: view.ty, m: 0 };
		try {
			(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		} catch (_) {
			// setPointerCapture can throw for stale pointer ids — safe to ignore.
		}
		drag = true;
	}

	function pmove(e: PointerEvent) {
		if (!p) return;
		const dx = e.clientX - p.x;
		const dy = e.clientY - p.y;
		p.m = Math.max(p.m, Math.abs(dx) + Math.abs(dy));
		setView({ k: view.k, tx: p.tx + dx, ty: p.ty + dy, anim: false });
	}

	function pup() {
		const clean = !!p && p.m < 6;
		p = null;
		drag = false;
		if (clean) onselect?.(null);
	}

	function pcancel() {
		p = null;
		drag = false;
	}

	function zoomBy(f: number) {
		const b = box();
		const v = view;
		const nk = Math.max(0.1, Math.min(6, v.k * f));
		const r = nk / v.k;
		setView({
			k: nk,
			tx: b.width / 2 - (b.width / 2 - v.tx) * r,
			ty: b.height / 2 - (b.height / 2 - v.ty) * r,
			anim: true
		});
	}

	function labelClick(e: MouseEvent, id: string) {
		e.stopPropagation();
		onselect?.(id);
		focus(id);
	}

	onMount(() => {
		fit();
		const onResize = () => {
			if (!touched) fit();
		};
		window.addEventListener('resize', onResize);
		return () => window.removeEventListener('resize', onResize);
	});
</script>

<div
	bind:this={stageEl}
	onwheel={wheel}
	onpointerdown={pdown}
	onpointermove={pmove}
	onpointerup={pup}
	onpointerleave={pcancel}
	style="position:absolute;inset:0;overflow:hidden;touch-action:none;cursor:{cursor};background:radial-gradient(ellipse 90% 80% at 50% 45%, #efe8d8 0%, #e9e1cf 55%, #ddd2b9 100%);"
>
	<svg width="100%" height="100%" style="display:block;position:absolute;inset:0;">
		<g style="transform-origin:0 0;transform:{viewT};transition:{viewTr};">
			{#each blobs as b}
				<circle
					cx={b.x}
					cy={b.y}
					r={b.r}
					fill={b.f}
					opacity={b.op}
					pointer-events="none"
					style="filter:blur(16px);"
				/>
			{/each}
			{#each scene.segs as s}
				<path
					d={s.d}
					stroke={s.c}
					stroke-width={s.w}
					fill="none"
					stroke-linecap="round"
					pointer-events="none"
				/>
			{/each}
		</g>
	</svg>

	<div
		style="position:absolute;left:0;top:0;width:0;height:0;transform-origin:0 0;transform:{viewT};transition:{viewTr};pointer-events:none;"
	>
		{#each visibleLabels as l (l.id)}
			<div
				onclick={(e) => labelClick(e, l.id)}
				style="position:absolute;left:0;top:0;white-space:nowrap;pointer-events:auto;cursor:pointer;line-height:1;transform-origin:0 0;transform:{l.pos};font-size:{l.fs}px;color:{l.fill};font-family:{l.ff};font-weight:{l.fw};font-style:{l.fst};letter-spacing:{l.ls}px;text-shadow:0 1px 3px rgba(235,227,209,.95),0 -1px 3px rgba(235,227,209,.95),1px 0 3px rgba(235,227,209,.95),-1px 0 3px rgba(235,227,209,.95);"
			>
				{l.t}
			</div>
		{/each}
	</div>

	<div
		style="position:absolute;top:14px;right:16px;display:flex;flex-direction:column;gap:6px;z-index:4;"
	>
		<button
			onclick={() => zoomBy(1.5)}
			title="Zoom in"
			style="width:36px;height:36px;border:1px solid #24344188;border-radius:3px;background:#f2ecdd;font-family:'EB Garamond',Georgia,serif;font-size:20px;color:#243441;line-height:1;"
		>+</button>
		<button
			onclick={() => zoomBy(1 / 1.5)}
			title="Zoom out"
			style="width:36px;height:36px;border:1px solid #24344188;border-radius:3px;background:#f2ecdd;font-family:'EB Garamond',Georgia,serif;font-size:20px;color:#243441;line-height:1;"
		>&minus;</button>
		<button
			onclick={fit}
			title="Fit whole tree"
			style="width:36px;height:36px;border:1px solid #24344188;border-radius:3px;background:#f2ecdd;font-family:'EB Garamond',Georgia,serif;font-size:15px;color:#243441;line-height:1;"
		>&#8962;</button>
	</div>
</div>
