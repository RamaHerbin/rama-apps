<script lang="ts">
	import { onMount } from "svelte";
	import { FluidCursor, InteractiveGridPattern, BlurReveal, RainbowButton } from "fancy-ui-svelte";

	let heroSectionRef: HTMLDivElement | undefined = $state();
	let showInteractiveElements = $state(false);

	function scrollToAbout() {
		const el = document.getElementById("trusted");
		el?.scrollIntoView({ behavior: "smooth" });
	}

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

	<!-- Interactive Grid Pattern Background -->
	{#if showInteractiveElements}
		<InteractiveGridPattern
			class="inset-0 h-full [mask-image:radial-gradient(500px_circle_at_center,white,transparent)] opacity-30"
		/>
	{/if}

	<!-- Hero Content -->
	<div class="relative z-10 mx-auto mt-32 max-w-4xl px-6 text-center lg:px-8">
		<h1 class="text-foreground text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
			Rama Herbin
		</h1>

		<BlurReveal delay={0.2} duration={0.75} class="space-y-6">
			<h2 class="text-muted-foreground text-xl font-medium sm:text-2xl lg:text-3xl">
				Front-End & UI Engineer
			</h2>

			<p class="text-muted-foreground text-lg sm:text-xl">
				working at
				<a
					href="https://www.ansys.com"
					target="_blank"
					rel="noopener noreferrer"
					class="text-foreground font-semibold underline-offset-4 hover:underline"
					aria-label="Open Ansys website in a new tab"
				>
					Ansys&reg;
				</a>
				<span class="text-foreground/80"> &mdash; part of </span>
				<span class="text-foreground/90 align-baseline text-[0.9em]">Synopsys Inc.</span>
				<span class="text-foreground/80 text-tiny block italic"
					>A simulation-driven company&trade;</span
				>
			</p>

			<div class="pt-8">
				<RainbowButton
					class="px-8 py-4 text-lg font-medium transition-all hover:scale-105"
					onclick={scrollToAbout}
					aria-label="Scroll to About section"
				>
					Explore
				</RainbowButton>
			</div>
		</BlurReveal>
	</div>

	<!-- Version Badge - Top Left -->
	<div class="absolute top-6 left-6 z-20">
		<span
			class="text-muted-foreground/60 bg-background/80 border-border/20 rounded-md border px-3 py-1.5 font-mono text-xs backdrop-blur-sm"
		>
			v1.0.0-alpha
		</span>
	</div>

	<!-- AI-Powered Badge - Top Right -->
	<div class="absolute top-6 right-6 z-20 flex flex-col items-end gap-2">
		<span
			class="text-muted-foreground/60 bg-background/80 border-border/20 rounded-md border px-3 py-1.5 font-mono text-xs backdrop-blur-sm"
		>
			AI-powered
		</span>
		<span
			class="text-muted-foreground/40 bg-background/60 border-border/10 rounded-sm border px-2 py-1 font-mono text-[10px] backdrop-blur-sm"
		>
			temporary ai generated content
		</span>
	</div>
</div>
