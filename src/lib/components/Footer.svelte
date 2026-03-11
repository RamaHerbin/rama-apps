<script lang="ts">
	import type { SocialLink } from '$lib/types/index.js';

	interface Props {
		author: string;
		socials: SocialLink[];
	}

	let { author, socials }: Props = $props();
</script>

<footer class="border-t border-border/40 bg-background">
	<div class="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
		<p class="text-sm text-muted-foreground">
			&copy; {new Date().getFullYear()} {author}. All rights reserved.
		</p>
		<div class="flex items-center gap-4">
			{#each socials as social}
				<a
					href={social.url}
					target="_blank"
					rel="noopener noreferrer"
					class="text-sm text-muted-foreground transition-colors hover:text-foreground"
				>
					{social.label}
				</a>
			{/each}
		</div>
	</div>
</footer>
