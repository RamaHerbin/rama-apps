<script lang="ts">
	import { c } from "$lib/content/index.js";

	interface NavLink {
		href: string;
		/** content key for the label text */
		labelKey: string;
	}

	interface Props {
		/** left link (with a ← arrow). null hides it. */
		prev?: NavLink | null;
		/** content key for the center status label, e.g. "fdp.context-bar.center" */
		centerKey: string;
		/** right link (with a → arrow). null hides it. */
		next?: NavLink | null;
	}

	let { prev = null, centerKey, next = null }: Props = $props();
</script>

<!-- Hidden below sm: the pill is unreadable on narrow mobile. -->
<div
	class="border-border/50 bg-background/85 fixed bottom-5 left-1/2 z-[900] hidden -translate-x-1/2 items-stretch overflow-hidden rounded-full border font-mono text-[11px] tracking-[0.08em] backdrop-blur-md sm:flex"
>
	{#if prev}
		<a
			href={prev.href}
			class="text-muted-foreground hover:text-foreground hover:bg-foreground/6 flex items-center gap-2 px-5 py-3 transition-colors"
		>
			<span aria-hidden="true">←</span>
			<span data-edit={prev.labelKey}>{c(prev.labelKey)}</span>
		</a>
	{/if}
	<span
		class="border-border/50 text-foreground/85 flex items-center border-x px-5 py-3"
	>
		<span class="text-accent-work mr-2" aria-hidden="true">●</span>
		<span data-edit={centerKey}>{c(centerKey)}</span>
	</span>
	{#if next}
		<a
			href={next.href}
			class="text-muted-foreground hover:text-foreground hover:bg-foreground/6 flex items-center gap-2 px-5 py-3 transition-colors"
		>
			<span data-edit={next.labelKey}>{c(next.labelKey)}</span>
			<span aria-hidden="true">→</span>
		</a>
	{/if}
</div>
