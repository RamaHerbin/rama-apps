<script lang="ts">
	import { LineShadowText } from 'fancy-ui';
	import { page } from '$app/state';

	interface Props {
		siteTitle: string;
	}

	let { siteTitle }: Props = $props();

	const links = [
		{ href: '/gallery', label: 'Gallery' },
		{ href: '/collections', label: 'Collections' },
		{ href: '/about', label: 'About' }
	];

	let mobileOpen = $state(false);
</script>

<header class="fixed top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
	<nav class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
		<a href="/" class="text-xl font-bold tracking-tight">
			<LineShadowText text={siteTitle} shadowColor="var(--color-muted-foreground)" as="span" />
		</a>

		<!-- Desktop nav -->
		<ul class="hidden items-center gap-8 sm:flex">
			{#each links as link}
				<li>
					<a
						href={link.href}
						class="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
						class:text-foreground={page.url.pathname.startsWith(link.href)}
					>
						{link.label}
					</a>
				</li>
			{/each}
		</ul>

		<!-- Mobile toggle -->
		<button
			class="sm:hidden p-2 text-muted-foreground"
			onclick={() => (mobileOpen = !mobileOpen)}
			aria-label="Toggle menu"
		>
			<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				{#if mobileOpen}
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				{:else}
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
				{/if}
			</svg>
		</button>
	</nav>

	<!-- Mobile menu -->
	{#if mobileOpen}
		<div class="border-t border-border/40 bg-background/95 backdrop-blur-md sm:hidden">
			<ul class="flex flex-col gap-1 px-4 py-3">
				{#each links as link}
					<li>
						<a
							href={link.href}
							class="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
							class:text-foreground={page.url.pathname.startsWith(link.href)}
							onclick={() => (mobileOpen = false)}
						>
							{link.label}
						</a>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</header>
