<script lang="ts">
	/**
	 * 02 ABOUT — the retro port of `$lib/portfolio/sections/About.svelte`.
	 *
	 * Two columns: the same three paragraphs the standard section renders, and
	 * the same portrait, re-housed in a grammar-C application window titled
	 * `photo.jpg`. The section takes no props — like every retro section it reads
	 * its own content.
	 *
	 * The first paragraph is SPLIT ACROSS SIX KEYS, exactly as the standard
	 * section splits it, because it contains the Ansys link: EDIT-CONTRACT §1
	 * requires a paragraph with an inline link to become several string keys
	 * around that link. The whitespace between the spans is load-bearing —
	 * `home.about.creative-foundation` starts with its own ", ", so it follows
	 * `parent-company` with NO separating whitespace, and the full stop after
	 * `gobelins` is literal punctuation, not content. Both details are copied
	 * from the standard section rather than re-derived.
	 */
	import { c } from "$lib/content/index.js";
	import { AppWindow, SectionWindow } from "$lib/retro";
</script>

<SectionWindow
	id="retro-about"
	index="02"
	titleKey="home.about.title"
	dosKey="retro.window.about.dos"
	accent="rust"
>
	<!-- 1fr + a fixed 340px plate on desktop; one column below lg, where a 340px
	     track would either squeeze the prose or overflow the window. -->
	<div class="grid items-start gap-9 p-7 lg:[grid-template-columns:1fr_340px]">
		<div class="flex flex-col gap-[18px] text-[14.5px] leading-[1.65] text-[var(--r-ink)]">
			<p>
				<span data-edit="home.about.intro">{c("home.about.intro")}</span>
				<a
					href={c("home.hero.ansys.href")}
					data-edit="home.hero.ansys.label"
					data-edit-href="home.hero.ansys.href"
					target="_blank"
					rel="noopener noreferrer"
					class="font-bold text-[var(--r-ink)] underline decoration-2 underline-offset-2"
					aria-label="Open Ansys website in a new tab"
				>
					{c("home.hero.ansys.label")}
				</a>
				<span data-edit="home.about.company-part">{c("home.about.company-part")}</span>
				<span data-edit="home.about.parent-company">{c("home.about.parent-company")}</span><span
					data-edit="home.about.creative-foundation">{c("home.about.creative-foundation")}</span
				>
				<span class="font-bold" data-edit="home.about.gobelins">{c("home.about.gobelins")}</span>.
			</p>

			<p data-edit="home.about.paragraph-2">{c("home.about.paragraph-2")}</p>

			<p data-edit="home.about.paragraph-3">{c("home.about.paragraph-3")}</p>
		</div>

		<!--
			Same asset and same alt as the standard About: it is the same portrait,
			so it owes the same description. `r-shadow-4` rather than the mockup's
			`filter: drop-shadow(4px 4px 0)` wrapper — the window is a plain
			rectangle, so a box-shadow paints the identical silhouette without a
			second element and without putting the subtree in a filter containing
			block.
		-->
		<AppWindow filenameKey="retro.about.window.filename" class="r-shadow-4">
			<img
				src="/portfolio/IMG_0318.jpg"
				alt="Rama Herbin in Chicago"
				class="block h-[300px] w-full object-cover"
				loading="lazy"
			/>
		</AppWindow>
	</div>
</SectionWindow>
