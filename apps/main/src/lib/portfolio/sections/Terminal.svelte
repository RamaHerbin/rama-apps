<script lang="ts">
	import { onDestroy } from "svelte";
	import { c } from "$lib/content/index.js";

	let copied = $state(false);
	let copyTimeout: ReturnType<typeof setTimeout> | undefined;

	async function copyCommand() {
		try {
			await navigator.clipboard.writeText(c("home.terminal.command"));
		} catch {
			// Clipboard permission denied / API unavailable (e.g. insecure context) —
			// the command is already fully visible in the pill for a manual copy.
			return;
		}

		copied = true;
		clearTimeout(copyTimeout);
		copyTimeout = setTimeout(() => {
			copied = false;
		}, 2000);
	}

	onDestroy(() => clearTimeout(copyTimeout));
</script>

<!--
	A quiet coda under Contact, not another hero section: modest vertical
	padding (py-12) versus the py-20 rhythm of the sections above.
-->
<section class="px-6 py-12">
	<div class="mx-auto flex max-w-4xl flex-col items-center gap-4 text-center">
		<span
			class="text-accent-work font-mono text-xs tracking-wide uppercase"
			data-edit="home.terminal.title"
		>
			{c("home.terminal.title")}
		</span>

		<button
			type="button"
			onclick={copyCommand}
			class="group border-border bg-background/80 hover:border-accent-work/50 focus-visible:ring-ring inline-flex items-center gap-3 rounded-full border px-5 py-2.5 font-mono text-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
			aria-label={copied ? c("home.terminal.copied") : `Copy command: ${c("home.terminal.command")}`}
		>
			<span class="text-muted-foreground/50 tracking-[0.2em]" aria-hidden="true">●●●</span>
			<span class="text-accent-work" aria-hidden="true">❯</span>
			<span class="text-foreground" data-edit="home.terminal.command">
				{c("home.terminal.command")}
			</span>
			<span
				class="text-muted-foreground group-hover:text-foreground ml-1 flex items-center gap-1.5 transition-colors"
			>
				{#if copied}
					<svg
						class="text-accent-work h-4 w-4 shrink-0"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<path d="M20 6 9 17l-5-5" />
					</svg>
					<span class="text-accent-work text-xs" data-edit="home.terminal.copied">
						{c("home.terminal.copied")}
					</span>
				{:else}
					<svg
						class="h-4 w-4 shrink-0"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<rect width="13" height="13" x="9" y="9" rx="2" ry="2" />
						<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
					</svg>
				{/if}
			</span>
		</button>

		<p class="text-muted-foreground max-w-md text-sm" data-edit="home.terminal.hint">
			{c("home.terminal.hint")}
		</p>
	</div>
</section>
