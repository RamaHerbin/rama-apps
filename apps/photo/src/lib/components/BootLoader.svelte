<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { getImageUrl } from '$lib/config/r2.js';
	import {
		ANIM_END_MS,
		COUNTER_HOLD_MS,
		DURATION_MS,
		EASE_EXPO_INOUT,
		EASE_STACK,
		EXIT,
		IMAGE_TIMEOUT_MS,
		LAYER_COUNT,
		PATCH_SAFETY_MARGIN,
		SAFETY_FALLBACK_MS,
		STAGGER_MS,
		STORAGE_KEY,
		WIDTH_TARGETS,
		computePatchScale,
		resolveBootImages
	} from '$lib/boot-loader.js';

	interface Props {
		images: string[];
		active?: boolean;
	}

	let { images, active = $bindable(false) }: Props = $props();

	type Phase = 'idle' | 'skipped' | 'preloading' | 'animating' | 'exiting' | 'done';

	let phase = $state<Phase>('idle');
	let pct = $state(0);
	let resolvedImages = $state<string[]>([]);

	let rootEl: HTMLDivElement | undefined = $state();
	let stackEl: HTMLDivElement | undefined = $state();
	let patchEl: HTMLDivElement | undefined = $state();
	let layerEls: HTMLDivElement[] = [];

	let rafId: number | undefined;
	let safetyTimer: ReturnType<typeof setTimeout> | undefined;
	let exitTimers: ReturnType<typeof setTimeout>[] = [];
	let activeAnimations: Animation[] = [];
	let exited = false;
	let destroyed = false;

	function markSessionPlayed() {
		try {
			sessionStorage.setItem(STORAGE_KEY, '1');
		} catch {
			// Storage disabled (private mode, etc.) — fail-open, loader just replays next time.
		}
	}

	function clearBootPending() {
		document.documentElement.classList.remove('boot-pending');
	}

	function cancelAnimations() {
		for (const anim of activeAnimations) {
			try {
				anim.cancel();
			} catch {
				// Already finished/canceled — nothing to do.
			}
		}
		activeAnimations = [];
	}

	function clearTimers() {
		if (rafId !== undefined) {
			cancelAnimationFrame(rafId);
			rafId = undefined;
		}
		if (safetyTimer !== undefined) {
			clearTimeout(safetyTimer);
			safetyTimer = undefined;
		}
		for (const timer of exitTimers) clearTimeout(timer);
		exitTimers = [];
	}

	function skip() {
		markSessionPlayed();
		phase = 'skipped';
		active = false;
	}

	function finishBoot() {
		if (destroyed) return;
		phase = 'done';
		active = false;
		markSessionPlayed();
		window.dispatchEvent(new CustomEvent('bootloader:done'));
	}

	function triggerExit() {
		if (exited) return;
		exited = true;

		if (rafId !== undefined) {
			cancelAnimationFrame(rafId);
			rafId = undefined;
		}
		if (safetyTimer !== undefined) {
			clearTimeout(safetyTimer);
			safetyTimer = undefined;
		}

		pct = 100;
		phase = 'exiting';
		runExit();
	}

	function runExit() {
		if (!stackEl || !patchEl || !rootEl) {
			finishBoot();
			return;
		}

		// Measure once at the start of the exit — a mid-exit resize is an
		// accepted degradation (see plan).
		const rect = stackEl.getBoundingClientRect();
		const scale = computePatchScale(rect, window.innerWidth, window.innerHeight, PATCH_SAFETY_MARGIN);

		const blurFadeTimer = setTimeout(() => {
			if (!stackEl || !patchEl || !rootEl) return;

			// Snap the patch onto the stack's exact box — no transition.
			patchEl.style.top = `${rect.top}px`;
			patchEl.style.left = `${rect.left}px`;
			patchEl.style.width = `${rect.width}px`;
			patchEl.style.height = `${rect.height}px`;
			patchEl.style.visibility = 'visible';
			patchEl.style.opacity = '1';
			rootEl.style.background = 'transparent';

			const blurFade = stackEl.animate(
				[
					{ filter: 'blur(0px)', opacity: 1 },
					{ filter: 'blur(8px)', opacity: 0 }
				],
				{ duration: EXIT.blurFadeDuration, easing: 'ease', fill: 'forwards' }
			);
			activeAnimations.push(blurFade);
		}, EXIT.blurFadeDelay);
		exitTimers.push(blurFadeTimer);

		const patchScaleTimer = setTimeout(() => {
			if (!patchEl) return;

			const patchScale = patchEl.animate(
				[{ transform: 'scale(1)' }, { transform: `scale(${scale})` }],
				{ duration: EXIT.patchScaleDuration, easing: EASE_EXPO_INOUT, fill: 'forwards' }
			);
			activeAnimations.push(patchScale);
		}, EXIT.patchScaleDelay);
		exitTimers.push(patchScaleTimer);

		const finalFadeTimer = setTimeout(() => {
			if (!rootEl) {
				finishBoot();
				return;
			}

			const finalFade = rootEl.animate([{ opacity: 1 }, { opacity: 0 }], {
				duration: EXIT.finalFadeDuration,
				easing: 'ease-out',
				fill: 'forwards'
			});
			activeAnimations.push(finalFade);

			finalFade.finished
				.then(() => finishBoot())
				.catch(() => {
					// Canceled during teardown (unmount) — no finishBoot needed.
				});
		}, EXIT.finalFadeDelay);
		exitTimers.push(finalFadeTimer);
	}

	function runAnimation() {
		const start = performance.now();

		const anims = layerEls.map((el, i) =>
			el.animate([{ width: '0%' }, { width: `${WIDTH_TARGETS[i]}%` }], {
				duration: DURATION_MS,
				delay: i * STAGGER_MS,
				easing: EASE_STACK,
				fill: 'forwards'
			})
		);
		activeAnimations.push(...anims);

		function tickCounter() {
			const elapsed = performance.now() - start;
			pct = Math.min(100, Math.round((elapsed / ANIM_END_MS) * 100));
			if (pct < 100) {
				rafId = requestAnimationFrame(tickCounter);
			}
		}
		rafId = requestAnimationFrame(tickCounter);

		safetyTimer = setTimeout(triggerExit, SAFETY_FALLBACK_MS);

		Promise.all(anims.map((anim) => anim.finished))
			.then(() => {
				const holdTimer = setTimeout(triggerExit, COUNTER_HOLD_MS);
				exitTimers.push(holdTimer);
			})
			.catch(() => {
				// One or more animations were canceled (e.g. teardown) — ignore.
			});
	}

	async function boot() {
		// Whatever we decide below, the CSS curtain from app.html must lift.
		clearBootPending();

		let reducedMotion = false;
		try {
			reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		} catch {
			reducedMotion = false;
		}

		let alreadyPlayed = false;
		try {
			alreadyPlayed = sessionStorage.getItem(STORAGE_KEY) === '1';
		} catch {
			alreadyPlayed = false;
		}

		if (alreadyPlayed || reducedMotion || images.length === 0) {
			skip();
			return;
		}

		active = true;
		phase = 'preloading';

		const urls = images.map((src) => getImageUrl(src));
		const resolved = await resolveBootImages(urls, IMAGE_TIMEOUT_MS);
		if (destroyed) return;

		resolvedImages = resolved;
		phase = 'animating';
		runAnimation();
	}

	onMount(() => {
		boot();

		return () => {
			destroyed = true;
			clearTimers();
			cancelAnimations();
			clearBootPending();
		};
	});
</script>

{#if browser && phase !== 'skipped' && phase !== 'done'}
	<div bind:this={rootEl} class="boot-loader" aria-hidden="true">
		<div bind:this={stackEl} class="boot-loader__stack">
			{#each Array(LAYER_COUNT) as _, i}
				<div
					bind:this={layerEls[i]}
					class="boot-loader__layer"
					class:boot-loader__layer--accent={i === LAYER_COUNT - 1}
					style:z-index={i + 1}
				>
					{#if i < LAYER_COUNT - 1 && resolvedImages[i]}
						<img src={resolvedImages[i]} alt="" decoding="async" class="boot-loader__image" />
					{/if}
				</div>
			{/each}
			<span class="boot-loader__counter">[{pct}]</span>
		</div>
		<div bind:this={patchEl} class="boot-loader__patch"></div>
	</div>
{/if}

<style>
	.boot-loader {
		position: fixed;
		inset: 0;
		z-index: 9999;
		display: grid;
		place-content: center;
		background: var(--color-background);
	}

	.boot-loader__stack {
		position: relative;
		width: min(40vw, 420px);
		aspect-ratio: 3 / 4;
	}

	.boot-loader__layer {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 0%;
		aspect-ratio: 3 / 4;
		overflow: hidden;
		transform: translate(-50%, -50%);
		border: 1px solid color-mix(in srgb, var(--color-foreground) 8%, transparent);
		background: var(--color-background);
	}

	.boot-loader__layer--accent {
		background: var(--boot-accent, var(--color-primary));
		border-color: transparent;
	}

	.boot-loader__image {
		position: absolute;
		inset: -1px;
		width: calc(100% + 2px);
		height: calc(100% + 2px);
		object-fit: cover;
	}

	.boot-loader__counter {
		position: absolute;
		bottom: 100%;
		left: calc(100% + 12px);
		font-size: 14px;
		line-height: 1;
		letter-spacing: 0.02em;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
		color: var(--boot-accent, var(--color-primary));
	}

	.boot-loader__patch {
		position: fixed;
		top: 0;
		left: 0;
		width: 0;
		height: 0;
		visibility: hidden;
		opacity: 0;
		transform-origin: center;
		background: var(--color-background);
		pointer-events: none;
	}

	@media (max-width: 768px) {
		.boot-loader__stack {
			width: min(59vw, 240px);
		}

		.boot-loader__counter {
			font-size: 12px;
		}
	}
</style>
