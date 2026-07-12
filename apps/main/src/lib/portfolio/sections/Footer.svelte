<script lang="ts">
	import CarbonNeutralBadge from "$lib/portfolio/CarbonNeutralBadge.svelte";
	import { c } from "$lib/content/index.js";
</script>

<footer
	class="border-border/40 text-muted-foreground bg-background w-full border-t py-8 text-center text-sm"
>
	<div class="space-y-3">
		<p class="text-muted-foreground/80">
			&copy; {new Date().getFullYear()}
			<span data-edit="shared.footer.copyright">{c("shared.footer.copyright")}</span>
		</p>
		<CarbonNeutralBadge />
	</div>
</footer>

<a
	href={c("shared.footer.made-with.href")}
	data-edit-href="shared.footer.made-with.href"
	target="_blank"
	rel="noopener noreferrer"
	class="border-border/40 bg-background/80 text-muted-foreground/70 hover:text-foreground hover:border-border fixed bottom-4 left-4 z-50 rounded-lg border px-3 py-1.5 text-xs backdrop-blur-sm transition-colors"
>
	<span data-edit="shared.footer.made-with.text">{c("shared.footer.made-with.text")}</span>
	<span class="text-accent-foreground font-medium" data-edit="shared.footer.made-with.highlight"
		>{c("shared.footer.made-with.highlight")}</span
	>
</a>
