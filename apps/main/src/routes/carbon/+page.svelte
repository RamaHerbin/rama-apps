<script lang="ts">
	import { BlurReveal } from "fancy-ui-svelte";
	import { c } from "$lib/content/index.js";
</script>

<svelte:head>
	<title>Carbon Footprint - Rama Herbin</title>
	<meta
		name="description"
		content="Learn about the environmental optimization strategies used in this portfolio website."
	/>
</svelte:head>

<div class="min-h-screen bg-black text-white">
	<!-- Navigation back to home -->
	<nav class="border-b border-white/10 px-6 py-4">
		<a href="/" class="inline-flex items-center gap-2 text-white/70 hover:text-white/90 transition">
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
			<span data-edit="carbon.back-link.label">{c("carbon.back-link.label")}</span>
		</a>
	</nav>

	<!-- Main content -->
	<section class="mx-auto max-w-2xl px-6 py-16 text-white/80">
		<BlurReveal delay={0.2} duration={0.75}>
			<h1 class="text-2xl font-semibold tracking-tight text-white" data-edit="carbon.hero.title">
				{c("carbon.hero.title")}
			</h1>
			<p class="mt-4 text-sm leading-7 text-white/60" data-edit="carbon.hero.description">
				{c("carbon.hero.description")}
			</p>
		</BlurReveal>

		<BlurReveal delay={0.4} duration={0.75}>
			<div class="mt-8 space-y-6">
				<h2 class="text-lg font-medium text-white/90" data-edit="carbon.strategies.title">
					{c("carbon.strategies.title")}
				</h2>
				<ul class="list-disc space-y-2 pl-6 text-sm text-white/60">
					<li data-edit="carbon.strategy.1">{c("carbon.strategy.1")}</li>
					<li data-edit="carbon.strategy.2">{c("carbon.strategy.2")}</li>
					<li data-edit="carbon.strategy.3">{c("carbon.strategy.3")}</li>
					<li data-edit="carbon.strategy.4">{c("carbon.strategy.4")}</li>
					<li data-edit="carbon.strategy.5">{c("carbon.strategy.5")}</li>
				</ul>
			</div>
		</BlurReveal>

		<BlurReveal delay={0.6} duration={0.75}>
			<div class="mt-8 space-y-4">
				<h2 class="text-lg font-medium text-white/90" data-edit="carbon.metrics.title">
					{c("carbon.metrics.title")}
				</h2>
				<div class="grid gap-4 sm:grid-cols-2">
					<div class="rounded-lg border border-white/10 bg-white/5 p-4">
						<div class="text-sm text-white/50" data-edit="carbon.metric.bundle-size.label">
							{c("carbon.metric.bundle-size.label")}
						</div>
						<div class="text-lg font-medium text-white" data-edit="carbon.metric.bundle-size.value">
							{c("carbon.metric.bundle-size.value")}
						</div>
					</div>
					<div class="rounded-lg border border-white/10 bg-white/5 p-4">
						<div class="text-sm text-white/50" data-edit="carbon.metric.first-paint.label">
							{c("carbon.metric.first-paint.label")}
						</div>
						<div class="text-lg font-medium text-white" data-edit="carbon.metric.first-paint.value">
							{c("carbon.metric.first-paint.value")}
						</div>
					</div>
					<div class="rounded-lg border border-white/10 bg-white/5 p-4">
						<div class="text-sm text-white/50" data-edit="carbon.metric.lighthouse-score.label">
							{c("carbon.metric.lighthouse-score.label")}
						</div>
						<div
							class="text-lg font-medium text-white"
							data-edit="carbon.metric.lighthouse-score.value"
						>
							{c("carbon.metric.lighthouse-score.value")}
						</div>
					</div>
					<div class="rounded-lg border border-white/10 bg-white/5 p-4">
						<div class="text-sm text-white/50" data-edit="carbon.metric.co2-per-visit.label">
							{c("carbon.metric.co2-per-visit.label")}
						</div>
						<div
							class="text-lg font-medium text-white"
							data-edit="carbon.metric.co2-per-visit.value"
						>
							{c("carbon.metric.co2-per-visit.value")}
						</div>
					</div>
				</div>
			</div>
		</BlurReveal>
	</section>
</div>
