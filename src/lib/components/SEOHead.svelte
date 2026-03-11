<script lang="ts">
	interface Props {
		title: string;
		description: string;
		url: string;
		image?: string;
		type?: string;
		author?: string;
		publishedAt?: string;
		jsonLd?: Record<string, unknown>;
	}

	let {
		title,
		description,
		url,
		image,
		type = 'website',
		author,
		publishedAt,
		jsonLd
	}: Props = $props();

	let jsonLdScript = $derived(jsonLd ? JSON.stringify(jsonLd) : null);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={url} />

	<!-- Open Graph -->
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={url} />
	<meta property="og:type" content={type} />
	{#if image}
		<meta property="og:image" content={image} />
	{/if}

	<!-- Twitter -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	{#if image}
		<meta name="twitter:image" content={image} />
	{/if}

	{#if author}
		<meta name="author" content={author} />
	{/if}

	{#if publishedAt}
		<meta property="article:published_time" content={publishedAt} />
	{/if}

	{#if jsonLdScript}
		{@html `<script type="application/ld+json">${jsonLdScript}</script>`}
	{/if}
</svelte:head>
