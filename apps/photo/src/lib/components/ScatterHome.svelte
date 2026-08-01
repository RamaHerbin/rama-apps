<script lang="ts">
	/**
	 * ScatterHome — composition root for the scattered photo home.
	 *
	 * Orchestrates the three layers built in `$lib/scatter/*`:
	 *  1. a deterministic scatter layout ({@link computeScatterLayout}),
	 *  2. a pile → disperse intro ({@link runScatterIntro}, WAAPI), and
	 *  3. a film-strip scroll parallax ({@link createScatterScroll}, GSAP),
	 * plus the focus overlay ({@link FocusView}) and chrome (crosshair, name, dots).
	 *
	 * SSR renders a semantic, no-JS fallback grid (`enhanced = false`). After mount
	 * the component upgrades to the interactive scatter and, unless reduced motion
	 * is requested or the intro already played this session, runs the intro.
	 */
	import { onMount } from 'svelte';
	import type { Photo } from '$lib/types/index.js';
	import {
		computeScatterLayout,
		type ScatterField
	} from '$lib/scatter/scatter-layout.js';
	import {
		runScatterIntro,
		prefersReducedMotion,
		introHasPlayed,
		markIntroPlayed,
		type IntroTarget
	} from '$lib/scatter/scatter-intro.js';
	import { createScatterScroll, type ScrollEngine } from '$lib/scatter/scatter-scroll.js';
	import { DEMO_SEED } from '$lib/data/demo-photos.js';
	import { focus } from '$lib/stores/focus.svelte.js';
	import Crosshair from '$lib/components/Crosshair.svelte';
	import ScatterDots from '$lib/components/ScatterDots.svelte';
	import ScatterGallery from '$lib/components/ScatterGallery.svelte';
	import FocusView from '$lib/components/FocusView.svelte';

	interface Props {
		/** Photos to scatter across the field. */
		photos: Photo[];
		/** Name revealed at the centre once the intro completes. */
		name: string;
	}

	let { photos, name }: Props = $props();

	/** Debounce window for viewport recompute on resize, in ms. */
	const RESIZE_DEBOUNCE_MS = 150;
	/** Fractional viewport height the intro pile converges on. */
	const PILE_CENTER_Y_FRAC = 0.48;

	/** Deterministic SSR/first-paint viewport; replaced by real window size on mount. */
	let viewport = $state({ width: 1440, height: 900 });
	/** false = SSR/no-JS fallback grid; true = interactive scatter (post-mount only). */
	let enhanced = $state(false);
	/** Toggles the centre name reveal (drives the `.is-visible` CSS transition). */
	let nameVisible = $state(false);
	/** Whether the intro is currently dispersing (drives the pulsing dots). */
	let introRunning = $state(false);

	/** Recomputed deterministically whenever the viewport changes. */
	let field = $derived<ScatterField>(computeScatterLayout(photos, viewport, DEMO_SEED));

	/** Scroll region whose top→bottom travel maps to parallax progress. */
	let containerEl = $state<HTMLDivElement | null>(null);

	/** Element/item pairs registered by the gallery once mounted in enhanced mode. */
	let targets: IntroTarget[] = [];
	/** Live scroll parallax engine, or null before it is created / after teardown. */
	let engine: ScrollEngine | null = null;
	/** Cancel handle for a running intro, or null when none is active. */
	let cancelIntro: (() => void) | null = null;
	/** Whether the intro should run (decided once, on mount). */
	let shouldIntro = false;
	/** Guards the one-shot startup path triggered by target registration. */
	let started = false;
	/** Pending debounced-resize timer id. */
	let resizeTimer: ReturnType<typeof setTimeout> | undefined;

	/** Sync the layout viewport to the current window dimensions. */
	function updateViewport() {
		viewport = { width: window.innerWidth, height: window.innerHeight };
	}

	/** Start the film-strip scroll parallax over the registered targets. */
	function startScroll() {
		if (containerEl && targets.length > 0) {
			engine = createScatterScroll(containerEl, targets);
		}
	}

	/** Finalise the intro: persist the played flag, reveal the name, hand off to scroll. */
	function onIntroDone() {
		markIntroPlayed();
		introRunning = false;
		nameVisible = true;
		cancelIntro = null;
		startScroll();
	}

	/**
	 * Receive the gallery's element/item pairs (fires once per enhanced mount) and
	 * launch either the intro or, when motion is skipped, the scroll engine directly.
	 */
	function handleRegister(registered: IntroTarget[]) {
		targets = registered;
		if (started) return;
		started = true;

		if (shouldIntro) {
			introRunning = true;
			const pileCenter = {
				x: viewport.width / 2,
				y: viewport.height * PILE_CENTER_Y_FRAC
			};
			cancelIntro = runScatterIntro(targets, pileCenter, onIntroDone);
		} else {
			startScroll();
		}
	}

	/** Open the focus overlay on the activated photo. */
	function handleOpen(photo: Photo, rect: DOMRect) {
		focus.open(photo, photos, rect);
	}

	/** Debounced viewport recompute + scroll re-measure on resize. */
	function handleResize() {
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout(() => {
			updateViewport();
			engine?.refresh();
		}, RESIZE_DEBOUNCE_MS);
	}

	onMount(() => {
		// Snap to the real viewport before upgrading so the first enhanced paint
		// (and the intro measurements) use the correct field geometry.
		updateViewport();
		shouldIntro = !prefersReducedMotion() && !introHasPlayed();
		if (!shouldIntro) nameVisible = true;
		// Flipping `enhanced` remounts the gallery (via {#key}) which then calls
		// registerTargets, driving startup through handleRegister.
		enhanced = true;
	});

	// Teardown: abort any running intro and destroy the scroll engine.
	$effect(() => {
		return () => {
			clearTimeout(resizeTimer);
			cancelIntro?.();
			engine?.destroy();
		};
	});
</script>

<svelte:window onresize={handleResize} />

<Crosshair />

<div class="scatter-name" class:is-visible={nameVisible}>{name}</div>

<div bind:this={containerEl} class="relative w-full">
	{#key enhanced}
		<ScatterGallery {field} {enhanced} onOpen={handleOpen} registerTargets={handleRegister} />
	{/key}
</div>

{#if introRunning}
	<div class="pointer-events-none fixed inset-x-0 bottom-8 z-40 flex justify-center">
		<ScatterDots count={3} pulsing />
	</div>
{/if}

<FocusView />
