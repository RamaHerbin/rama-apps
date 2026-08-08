<script lang="ts">
	import { onMount } from "svelte";
	import { FluidCursor, InteractiveGridPattern, BlurReveal, RainbowButton } from "fancy-ui-svelte";
	import { c } from "$lib/content/index.js";
	import { createSkinState } from "$lib/stores/skin.svelte.js";
	import type { SkinName } from "$lib/skins/registry.js";

	const skinState = createSkinState();

	/**
	 * Per-skin fluid treatment for the hero.
	 *
	 * Both skins swap the smooth HDR fluid for the engine's ordered-dither
	 * display pass, which snaps the dye to a chunky pixel grid and quantizes each
	 * channel against a 4x4 Bayer matrix. Cells that quantize to black stay fully
	 * transparent, so it composites over the cream page without a dark box.
	 *
	 * Colours are each skin's own accents rather than the default neon: the
	 * palettes are light and warm, and the stock cyan/magenta reads as a foreign
	 * object on them.
	 *
	 * Note `dither` forces the WebGL renderer and makes `hdr` a no-op, so the HDR
	 * props are deliberately NOT passed under a skin instead of being left dead.
	 */
	interface DitherConfig {
		/** Size of one dithered cell in CSS pixels. */
		ditherPixelSize: number;
		/** Colour levels per channel; lower quantizes harder. */
		ditherLevels: number;
		fluidColors: string[];
	}

	/**
	 * Both skins put the fluid on a light page (#f4eee0 / #f1e9d4), which is the
	 * opposite of what the effect is tuned for — the engine's own example runs it
	 * on black. Two knobs compensate, and both are needed:
	 *
	 * - `colorIntensity` well above the 0.15 default, because the dither drops any
	 *   cell that quantizes to black; at the default the dye barely crosses the
	 *   first quantization step and the trail reads as scattered specks.
	 * - `densityDissipation` below the 3.5 default so the trail survives long
	 *   enough to be read as a trail. On a dark page the dots carry themselves;
	 *   on cream they need the persistence.
	 */
	const DITHER_INTENSITY = 0.6;
	const DITHER_DISSIPATION = 3;

	const DITHER: Record<Exclude<SkinName, "standard">, DitherConfig> = {
		// Bolder, flatter quantization to match the poster-like flat fills.
		brutal: {
			ditherPixelSize: 3,
			ditherLevels: 3,
			fluidColors: ["#e5372b", "#1b6ef3", "#f5b40c", "#12a147"],
		},
		// Chunkier cells: this skin is a pixel OS, so the grid should read as one.
		"retro-os": {
			ditherPixelSize: 4,
			ditherLevels: 4,
			fluidColors: ["#a0442f", "#3f62a7", "#b8912b", "#3a6b42"],
		},
	};

	const dither = $derived<DitherConfig | null>(
		skinState.skin === "standard" ? null : DITHER[skinState.skin]
	);

	let heroSectionRef: HTMLDivElement | undefined = $state();
	let showInteractiveElements = $state(false);

	onMount(() => {
		if ("requestIdleCallback" in window) {
			requestIdleCallback(
				() => {
					showInteractiveElements = true;
				},
				{ timeout: 200 }
			);
		} else {
			setTimeout(() => {
				showInteractiveElements = true;
			}, 100);
		}
	});
</script>

<div
	bind:this={heroSectionRef}
	class="relative flex min-h-[90vh] items-center justify-center overflow-hidden"
>
	<!--
		Fluid Cursor - contained to this section only, never full-screen/global.

		Standard skin, HDR path: WebGPU rgba16float + display-p3 with extended tone
		mapping, so the splats glow past SDR white on an HDR display in a WebGPU
		browser; gracefully falls back to the WebGL cursor everywhere else.

		Brutal / Retro OS: the ordered-dither bitmap pass instead (see DITHER above).

		The `{#key}` is load-bearing, not cosmetic. The engine reads its simulation
		and dither props ONCE, at mount, so a runtime skin switch would otherwise
		leave the previous treatment on screen until a full reload. Keying on the
		skin name tears the canvas down and rebuilds it. It keys on the NAME rather
		than the config object so that a re-render never remounts by identity.
	-->
	{#key skinState.skin}
		{#if dither}
			<FluidCursor
				contained
				simResolution={128}
				dither
				ditherPixelSize={dither.ditherPixelSize}
				ditherLevels={dither.ditherLevels}
				fluidColors={dither.fluidColors}
				colorIntensity={DITHER_INTENSITY}
				densityDissipation={DITHER_DISSIPATION}
				class="absolute inset-0 -z-10"
			/>
		{:else}
			<FluidCursor
				contained
				simResolution={128}
				hdr
				hdrBoost={2}
				class="absolute inset-0 -z-10"
			/>
		{/if}
	{/key}

	<!--
		Interactive Grid Pattern Background.
		InteractiveGridPattern draws fixed 40px squares from its top-left corner,
		but its SVG box stretches to the full section, so on wide screens the
		squares only cover the left portion and the spotlight looks "cut off" on
		the right. Instead, pin the grid to a fixed square box centred on the hero
		copy (not the section centre — the content sits 4rem lower because of
		`mt-32`), and mask a 500px-radius spotlight at that box's centre. The
		1000px spotlight then always lands fully on the grid: symmetric and
		viewport-independent. Box is 26×40px = 1040px, a touch larger than the
		spotlight so its edges stay masked.
	-->
	{#if showInteractiveElements}
		<div
			class="absolute top-[calc(50%+4rem)] left-1/2 h-[1040px] w-[1040px] -translate-x-1/2 -translate-y-1/2 [mask-image:radial-gradient(circle_500px_at_center,white,transparent)] opacity-30"
		>
			<InteractiveGridPattern squares={[26, 26]} class="h-full w-full" />
		</div>
	{/if}

	<!-- Hero Content -->
	<div class="relative z-10 mx-auto mt-32 max-w-4xl px-6 text-center lg:px-8">
		<h1
			class="text-foreground text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl"
			data-edit="home.hero.title"
		>
			{c("home.hero.title")}
		</h1>

		<BlurReveal delay={0.2} duration={0.75} class="space-y-6">
			<h2
				class="text-muted-foreground text-xl font-medium sm:text-2xl lg:text-3xl"
				data-edit="home.hero.role"
			>
				{c("home.hero.role")}
			</h2>

			<p class="text-muted-foreground text-lg sm:text-xl">
				<span data-edit="home.hero.working-at">{c("home.hero.working-at")}</span>
				<a
					href={c("home.hero.ansys.href")}
					data-edit="home.hero.ansys.label"
					data-edit-href="home.hero.ansys.href"
					target="_blank"
					rel="noopener noreferrer"
					class="text-foreground font-semibold underline-offset-4 hover:underline"
					aria-label="Open Ansys website in a new tab">{c("home.hero.ansys.label")}</a
				>
				<span class="text-foreground/80" data-edit="home.hero.company-part"
					>{c("home.hero.company-part")}</span
				>
				<span
					class="text-foreground/90 align-baseline text-[0.9em]"
					data-edit="home.hero.parent-company">{c("home.hero.parent-company")}</span
				>
				<span class="text-foreground/80 text-tiny block italic" data-edit="home.hero.tagline"
					>{c("home.hero.tagline")}</span
				>
			</p>

			<div class="pt-8">
				<RainbowButton
					href="#projects"
					class="px-8 py-4 text-lg font-medium transition-all hover:scale-105"
				>
					<span data-edit="home.hero.cta">{c("home.hero.cta")}</span>
				</RainbowButton>
			</div>
		</BlurReveal>
	</div>

	<!-- Version Badge - Top Left -->
	<div class="absolute top-6 left-6 z-20">
		<span
			class="text-muted-foreground/60 bg-background/80 border-border/20 rounded-md border px-3 py-1.5 font-mono text-xs backdrop-blur-sm"
			data-edit="home.hero.badge.version"
		>
			{c("home.hero.badge.version")}
		</span>
	</div>
</div>
