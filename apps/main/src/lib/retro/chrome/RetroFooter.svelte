<script lang="ts">
	/**
	 * Retro-OS footer — identical on every page, plus one pixel glyph on home.
	 *
	 * Reuses the standard tree's own keys (`shared.footer.*`, `shared.carbon.*`), so
	 * the two designs can never disagree about the copyright line or where "Made
	 * with FancyUI" points; only the typography is re-cut. The year stays computed
	 * in the component exactly as `sections/Footer.svelte` does it — EDIT-CONTRACT
	 * §7 makes the text content and the year code.
	 */
	import { c } from "$lib/content/index.js";
	import { cn } from "$lib/utils.js";
	import PixelGlyph from "../atoms/PixelGlyph.svelte";
	import LocalTimeClock from "./LocalTimeClock.svelte";

	interface Props {
		/** "home" tops the column with the 2x2 pixel glyph; case pages omit it */
		variant?: "home" | "case";
	}

	let { variant = "case" }: Props = $props();

	const year = new Date().getFullYear();
</script>

<footer
	class={cn(
		"flex w-full flex-col items-center pt-2.5 text-[var(--r-ink)]",
		variant === "home" ? "gap-[14px]" : "gap-3"
	)}
>
	{#if variant === "home"}
		<!-- The glyph's own ink plate comes from PixelGlyph; the border and the soft
		     offset belong to the plate's frame, so they live on the wrapper. -->
		<span class="r-border r-shadow-soft-3-weak inline-flex">
			<PixelGlyph cell={14} gap={3} pad={4} />
		</span>
	{/if}

	<div class="r-dashed-top w-full opacity-40"></div>

	<p class="r-mono text-[12px]">
		© {year}
		<span data-edit="shared.footer.copyright">{c("shared.footer.copyright")}</span>
	</p>

	<div
		class="r-mono flex flex-wrap items-center justify-center gap-x-2.5 gap-y-2 text-[11.5px] text-[var(--r-muted)]"
	>
		<!-- box-content: the mockup's 9px square is the FILL, with the 2px rule drawn
		     outside it (13px overall). Tailwind's preflight border-box would eat it. -->
		<span
			class="r-border box-content inline-block h-[9px] w-[9px] bg-[var(--r-green)]"
			aria-hidden="true"
		></span>
		<span data-edit="shared.carbon.label">{c("shared.carbon.label")}</span>
		<span data-edit="shared.carbon.status">{c("shared.carbon.status")}</span>

		<span aria-hidden="true">|</span>

		<LocalTimeClock labelKey="retro.footer.local-time" />

		<span aria-hidden="true">|</span>

		<span data-edit="shared.footer.made-with.text">{c("shared.footer.made-with.text")}</span>
		<!-- Label and URL are edited together in the link popover, so BOTH data-edit
		     and data-edit-href sit on the <a> itself (EDIT-CONTRACT §3): a data-edit
		     nested under a data-edit-href ancestor is unreachable. -->
		<a
			class="r-pixel r-border r-made-with bg-[var(--r-paper)] px-[7px] py-[2px] text-[10px] text-[var(--r-ink)]"
			href={c("shared.footer.made-with.href")}
			data-edit="shared.footer.made-with.highlight"
			data-edit-href="shared.footer.made-with.href"
			target="_blank"
			rel="noopener noreferrer">{c("shared.footer.made-with.highlight")}</a
		>
	</div>
</footer>

<style>
	@media (hover: hover) {
		.r-made-with:hover {
			background: var(--r-btn);
		}
	}
</style>
