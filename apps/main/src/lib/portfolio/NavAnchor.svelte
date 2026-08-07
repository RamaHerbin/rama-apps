<script lang="ts">
	import { onMount } from "svelte";
	import { LiquidGlass } from "fancy-ui-svelte";
	import { createThemeState, toggleTheme } from "$lib/stores/theme.svelte.js";
	import { createSkinState, cycleSkin } from "$lib/stores/skin.svelte.js";
	import { SKINS, SKIN_NAMES } from "$lib/skins/registry.js";
	import type { SkinName } from "$lib/skins/registry.js";
	import { c } from "$lib/content/index.js";

	const themeState = createThemeState();
	const skinState = createSkinState();

	// Delay the LiquidGlass effect so the nav renders immediately on first paint
	let showBackgroundEffects = $state(false);

	function scrollToTop() {
		window.scrollTo({ top: 0, behavior: "smooth" });
	}

	/**
	 * Visitor-facing name of one skin.
	 *
	 * Content-first, per EDIT-CONTRACT: every user-visible string goes through
	 * `c()`. The key is derived from the skin name rather than switched on, so the
	 * registry stays the only place that enumerates skins.
	 *
	 * `c()` warns and returns the key itself when a key is missing (see
	 * content/store.svelte.ts), which would put the raw string
	 * "shared.nav.skin.<name>" into an aria-label — a failure only a screen-reader
	 * user would ever hit, and therefore one nobody would notice. So a miss falls
	 * back to `SKINS[name].label`, which is typed `Record<SkinName, SkinDef>` and
	 * cannot be absent. Adding a fourth skin without its content key is then merely
	 * a console warning, not a broken label.
	 */
	function skinName(name: SkinName): string {
		const key = `shared.nav.skin.${name}`;
		const value = c(key);
		return value === key ? SKINS[name].label : value;
	}

	/**
	 * The switcher's entire affordance, for anyone who cannot see the swatch: which
	 * skin is on now, and which one a press will bring. Reads e.g.
	 * "Skin: Standard. Switch to Brutal."
	 *
	 * The next skin is computed from SKIN_NAMES, the same array `cycleSkin()` walks,
	 * so the label can never promise a different skin than the one the click applies.
	 *
	 * Unlike the swatch below, this cannot be correct before hydration: it is an
	 * attribute, and only CSS runs pre-hydration. A skinned visitor's prerendered
	 * HTML therefore says "Skin: Standard" until the store adopts `data-skin` off
	 * <html>. Assistive tech re-reads the accessible name when the button is reached,
	 * which is long after hydration, so the stale window is not observable in practice.
	 */
	const skinAriaLabel = $derived.by(() => {
		const current = skinState.skin;
		const next = SKIN_NAMES[(SKIN_NAMES.indexOf(current) + 1) % SKIN_NAMES.length];
		return `${c("shared.nav.skin.label")}: ${skinName(current)}. ${c("shared.nav.skin.switch-to")} ${skinName(next)}.`;
	});

	onMount(() => {
		const timeout = setTimeout(() => {
			showBackgroundEffects = true;
		}, 200);

		return () => clearTimeout(timeout);
	});
</script>

{#snippet nav(title: string)}
	<nav
		class="relative flex min-h-12 w-full items-center justify-between px-4 py-2 sm:px-6 md:px-8 lg:px-12"
		aria-label="Main navigation"
	>
		<!-- Brand / Logo -->
		<button
			onclick={scrollToTop}
			class="text-foreground focus:ring-primary/50 relative flex min-h-[44px] min-w-[44px] translate-y-[5px] items-center justify-center rounded-lg p-3 font-semibold transition-transform duration-300 select-none hover:scale-110 focus:ring-2 focus:outline-none"
			style="font-size: 40px; line-height: 1; top: 2px;"
			aria-label="Rama Herbin - Scroll to top"
		>
			&reg;
		</button>

		<!-- Portfolio Title.

		     Taken OUT OF FLOW so it stays centred on the nav itself rather than on
		     whatever is left between the controls: the right-hand group is two 44px
		     buttons (92px) against the brand's single one, and an in-flow `flex-1`
		     middle would sit half a button left of centre.

		     The symmetric px-* is what keeps an absolutely-positioned element from
		     colliding with the controls it floats over. Each value is
		     `nav padding + 92px` (the right group: 44 + gap-1 + 44), which places
		     this box's edges exactly at the inner edges of both control groups at
		     every breakpoint — 6.75rem/16px, 7.25rem/24px, 7.75rem/32px, 8.75rem/48px.
		     Percentages resolve against the nav's padding box, so the guarantee is
		     width-independent: at a 320px viewport the positioner is 95vw = 304px and
		     the title gets 304 − 2×108 = 88px, ellipsised by `truncate` (which also
		     zeroes the flex item's automatic minimum size, so it can actually shrink).
		     Narrower than today, and deliberately so — 88px is the widest a *centred*
		     title can be there without touching a button.

		     pointer-events: the wrapper spans the whole nav and paints above both
		     buttons, so it must not intercept their clicks; the title itself restores
		     them, because edit mode needs to click through to `data-edit`. -->
		<div
			class="pointer-events-none absolute inset-0 flex items-center justify-center px-[6.75rem] sm:px-[7.25rem] md:px-[7.75rem] lg:px-[8.75rem]"
		>
			<span
				class="text-muted-foreground pointer-events-auto truncate text-sm font-medium tracking-wide"
				data-edit="shared.nav.title"
			>
				{title}
			</span>
		</div>

		<!-- Controls, grouped so the absolutely-centred title above has one known
		     width to clear instead of two independent ones. -->
		<div class="flex items-center gap-1">
			<!-- Skin Switcher.

			     A cycle button, not a dropdown, and that is structural rather than a
			     taste call: this whole `nav` snippet is rendered twice — plain, then
			     again inside <LiquidGlass> once the 200ms timeout below flips
			     `showBackgroundEffects`. The snippet is REMOUNTED, so any state living
			     inside it (an open menu, a focus trap, a generated id) would be
			     destroyed mid-interaction. A stateless button survives the swap, and
			     duplicates no DOM id along the way.

			     The swatch is selected by CSS off `html[data-skin]`, NOT by the store's
			     rune, because the rune cannot be right yet. The site is fully
			     prerendered, so the shipped HTML always encodes "standard"; the
			     anti-FOUC IIFE in app.html has meanwhile set `data-skin` on <html>
			     before first paint. Driving the icon from the rune would show a skinned
			     visitor the standard swatch until hydration — the exact flash the IIFE
			     exists to prevent. Driving it from the attribute is correct at the first
			     frame and needs no JS at all.

			     Standard is the DEFAULT rather than `html:not([data-skin])`, so an
			     unrecognised `data-skin` (stale deploy, devtools) still shows an icon:
			     no skin CSS matches such a value either, so the page really does look
			     standard until the store clears the attribute on hydration.

			     A fourth skin needs its two classes added here — the only place in this
			     component that enumerates skins, since an icon cannot be derived. -->
			<button
				onclick={cycleSkin}
				class="bg-muted/50 hover:bg-muted focus:ring-primary/50 flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-lg p-3 transition-colors duration-200 focus:ring-2 focus:outline-none"
				aria-label={skinAriaLabel}
			>
				<!-- Standard: a soft rounded tile in currentColor — the only swatch that
				     follows the light/dark theme, because "standard" *is* the theme. -->
				<svg
					class="[html[data-skin=brutal]_&]:hidden [html[data-skin=retro-os]_&]:hidden block h-5 w-5"
					viewBox="0 0 20 20"
					aria-hidden="true"
				>
					<rect x="3.25" y="3.25" width="13.5" height="13.5" rx="4" fill="currentColor" opacity="0.2" />
					<rect
						x="3.25"
						y="3.25"
						width="13.5"
						height="13.5"
						rx="4"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
					/>
				</svg>

				<!-- Brutal: flat yellow (--skin-yellow #F5B40C) behind a hard, un-blurred
				     ink offset (--skin-ink #141414). Fixed hexes, not currentColor: this
				     is a swatch OF a palette, so it must not adopt the page's. -->
				<svg class="[html[data-skin=brutal]_&]:block hidden h-5 w-5" viewBox="0 0 20 20" aria-hidden="true">
					<rect x="6" y="6" width="12" height="12" fill="#141414" />
					<rect x="2.75" y="2.75" width="12" height="12" fill="#F5B40C" stroke="#141414" stroke-width="1.5" />
				</svg>

				<!-- Retro OS: a 2x2 pixel grid, chunky and gutter-separated, in the skin's
				     blue (#3F62A7) and ink (#191308). -->
				<svg class="[html[data-skin=retro-os]_&]:block hidden h-5 w-5" viewBox="0 0 20 20" aria-hidden="true">
					<rect x="3" y="3" width="6.5" height="6.5" fill="#3F62A7" />
					<rect x="10.5" y="3" width="6.5" height="6.5" fill="#191308" />
					<rect x="3" y="10.5" width="6.5" height="6.5" fill="#191308" />
					<rect x="10.5" y="10.5" width="6.5" height="6.5" fill="#3F62A7" />
				</svg>
			</button>

			<!--
				Dark Mode Toggle.

				Disabled while a skin is active, and that is not a styling choice. Brutal and
				Retro OS are both `colorScheme: "light"` and hardcode a full light palette, and
				`dark:` utilities are structurally neutralised inside a skinned document (see the
				@custom-variant in layout.css). Measured on the built preview under
				data-skin="retro-os": clicking this changed a paint property on 0 of 1220
				elements — while still rewriting localStorage. So a visitor who fiddled with it
				under a skin got a theme they never knowingly chose, the moment they went back to
				standard. A control that silently mutates hidden state is worse than one that
				says it does not apply here.
			-->
			<button
				onclick={toggleTheme}
				disabled={skinState.isSkinned}
				class="bg-muted/50 hover:bg-muted focus:ring-primary/50 flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-lg p-3 transition-colors duration-200 focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-muted/50"
				aria-label={skinState.isSkinned
					? `Light and dark are unavailable while the ${SKINS[skinState.skin].label} skin is active`
					: themeState.isDark
						? "Switch to light mode"
						: "Switch to dark mode"}
			>
				{#if themeState.isDark}
					<!-- Sun icon -->
					<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
						<path
							d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z"
						/>
					</svg>
				{:else}
					<!-- Moon icon -->
					<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
						<path
							fill-rule="evenodd"
							d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z"
							clip-rule="evenodd"
						/>
					</svg>
				{/if}
			</button>
		</div>
	</nav>
{/snippet}

<!-- Fixed, horizontally-centered positioner. Both nav variants just fill it,
     so LiquidGlass's own `position: relative` can't knock it off-center. -->
<div
	class="fixed top-8 left-1/2 z-[999999] w-[500px] max-w-[95vw] -translate-x-1/2 rounded-lg"
>
	<!-- Static navigation for immediate render -->
	{#if !showBackgroundEffects}
		<div class="bg-background/80 border-border/20 w-full rounded-lg border backdrop-blur-sm">
			{@render nav(c("shared.nav.title"))}
		</div>
	{/if}

	<!-- LiquidGlass Navigation - Lazy loaded for better performance -->
	{#if showBackgroundEffects}
		<LiquidGlass containerClass="w-full">
			{@render nav(c("shared.nav.title"))}
		</LiquidGlass>
	{/if}
</div>
