<script lang="ts">
	import { onMount } from "svelte";
	import { FluidCursor, InteractiveGridPattern, BlurReveal, RainbowButton } from "fancy-ui-svelte";
	import { c } from "$lib/content/index.js";

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
	<!-- Fluid Cursor - contained to this section only, never full-screen/global -->
	<FluidCursor contained simResolution={128} class="absolute inset-0 -z-10" />

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
