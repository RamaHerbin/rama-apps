<script lang="ts">
	import { TextGenerateEffect, BlurReveal, LineShadowText, LiquidGlass } from 'fancy-ui';
	import SEOHead from '$lib/components/SEOHead.svelte';

	let { data } = $props();
</script>

<SEOHead
	title="About — {data.site.title}"
	description={data.site.about.bio}
	url="{data.site.url}/about"
/>

<section class="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
	<BlurReveal>
		<h1 class="text-5xl font-bold tracking-tight">
			<LineShadowText text="About" shadowColor="var(--color-muted-foreground)" as="span" />
		</h1>
	</BlurReveal>

	<div class="mt-16 space-y-12">
		<!-- Avatar with LiquidGlass effect -->
		{#if data.site.about.avatar}
			<BlurReveal>
				<div class="mx-auto w-48 h-48">
					<LiquidGlass radius={96} frost={0.3} blur={2} class="rounded-full">
						<img src={data.site.about.avatar} alt={data.site.author} class="h-48 w-48 rounded-full object-cover" />
					</LiquidGlass>
				</div>
			</BlurReveal>
		{/if}

		<!-- Bio -->
		<BlurReveal>
			<div class="text-lg leading-relaxed text-muted-foreground">
				<TextGenerateEffect words={data.site.about.bio} duration={0.6} stagger={0.05} />
			</div>
		</BlurReveal>

		<!-- Socials -->
		{#if data.site.socials.length > 0}
			<BlurReveal>
				<h2 class="mb-4 text-sm font-medium uppercase tracking-widest text-muted-foreground">Find me on</h2>
				<div class="flex flex-wrap gap-3">
					{#each data.site.socials as social}
						<a
							href={social.url}
							target="_blank"
							rel="noopener noreferrer"
							class="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:border-foreground hover:text-foreground"
						>
							{social.label}
						</a>
					{/each}
				</div>
			</BlurReveal>
		{/if}
	</div>
</section>
