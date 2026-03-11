<script lang="ts">
	import { TextGenerateEffect, BlurReveal, LineShadowText } from 'fancy-ui';
	import SEOHead from '$lib/components/SEOHead.svelte';

	let { data } = $props();
</script>

<SEOHead
	title="About — {data.site.title}"
	description={data.site.about.bio}
	url="{data.site.url}/about"
/>

<section class="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
	<BlurReveal>
		<h1 class="text-4xl font-bold">
			<LineShadowText text="About" shadowColor="var(--color-muted-foreground)" as="span" />
		</h1>
	</BlurReveal>

	<div class="mt-12 space-y-8">
		<!-- Avatar -->
		{#if data.site.about.avatar}
			<BlurReveal>
				<div class="mx-auto h-40 w-40 overflow-hidden rounded-full border-2 border-border">
					<img src={data.site.about.avatar} alt={data.site.author} class="h-full w-full object-cover" />
				</div>
			</BlurReveal>
		{/if}

		<!-- Bio -->
		<BlurReveal>
			<div class="prose prose-neutral max-w-none dark:prose-invert">
				<TextGenerateEffect words={data.site.about.bio} duration={0.6} stagger={0.05} />
			</div>
		</BlurReveal>

		<!-- Socials -->
		{#if data.site.socials.length > 0}
			<BlurReveal>
				<div class="flex flex-wrap gap-4">
					{#each data.site.socials as social}
						<a
							href={social.url}
							target="_blank"
							rel="noopener noreferrer"
							class="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
						>
							{social.label}
						</a>
					{/each}
				</div>
			</BlurReveal>
		{/if}
	</div>
</section>
