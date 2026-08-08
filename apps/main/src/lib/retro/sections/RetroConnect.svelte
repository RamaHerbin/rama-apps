<script lang="ts">
	/**
	 * 07 LET'S CONNECT — the three contact keys.
	 *
	 * Mirrors `portfolio/sections/Contact.svelte` — same `home.contact.*` keys,
	 * same link marking. The std section spells out the reason `data-edit` sits on
	 * the <a> rather than on the inner label: click delegation resolves
	 * `[data-edit-href]` first, so a `data-edit` nested inside a link is
	 * unreachable (EDIT-CONTRACT §3). RetroButton forwards both attributes to the
	 * anchor it renders, so the pattern carries over unchanged.
	 *
	 * The glyph before each label is a mono monogram, not an icon font and not
	 * content — aria-hidden, because the label right next to it already says what
	 * the link is.
	 *
	 * `id="retro-connect"` is the target of the header/hero CTA anchor.
	 */
	import { c } from "$lib/content/index.js";
	import { RetroButton, SectionWindow } from "$lib/retro";

	const LINKS = [
		{
			glyph: "✉",
			labelKey: "home.contact.email.label",
			hrefKey: "home.contact.email.href",
			variant: "primary" as const,
			// mailto: — same tab, so no target/rel
			external: false,
		},
		{
			glyph: "in",
			labelKey: "home.contact.linkedin.label",
			hrefKey: "home.contact.linkedin.href",
			variant: "outline" as const,
			external: true,
		},
		{
			glyph: "⌥",
			labelKey: "home.contact.github.label",
			hrefKey: "home.contact.github.href",
			variant: "outline" as const,
			external: true,
		},
	];
</script>

<SectionWindow
	id="retro-connect"
	index="07"
	titleKey="home.contact.title"
	dosKey="retro.window.connect.dos"
	accent="blue"
>
	<!-- the subtitle lives inside the body column here, not in the window's caption
	     row: the mockup spaces it with the keys below it, not with the titlebar -->
	<div class="flex flex-col items-center gap-5 px-6 pt-6 pb-7 text-center">
		<p class="r-mono text-[12px] text-[var(--r-muted)]" data-edit="home.contact.subtitle">
			{c("home.contact.subtitle")}
		</p>

		<div class="flex flex-wrap justify-center gap-[18px]">
			{#each LINKS as link (link.hrefKey)}
				<RetroButton
					href={c(link.hrefKey)}
					external={link.external}
					variant={link.variant}
					data-edit={link.labelKey}
					data-edit-href={link.hrefKey}
				>
					<span class="r-mono font-bold" aria-hidden="true">{link.glyph}</span>
					{c(link.labelKey)}
				</RetroButton>
			{/each}
		</div>

		<p class="r-mono text-[11.5px] text-[var(--r-muted)]" data-edit="home.contact.based-in">
			{c("home.contact.based-in")}
		</p>
	</div>
</SectionWindow>
