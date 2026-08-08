<script lang="ts">
	/**
	 * 04 THEY WORKED WITH ME — the retro testimonials log.
	 *
	 * Same four people, same content keys as the standard section
	 * (`sections/Testimonials.svelte`), but none of its machinery: no marquee, no
	 * auto-scroll, no `<dialog>`. The mockup shows every card at once and gives the
	 * section a single interaction — click a colleague to HIGHLIGHT them — so the
	 * only state here is which index is picked. Nothing animates, nothing ticks,
	 * and there is no listener to gate on the active skin.
	 *
	 * The card therefore shows the `excerpt` key and stops there. `body.{n}` is the
	 * full five-paragraph recommendation and belongs to the standard skin's dialog;
	 * pouring it into a 1/4-width card would bury the grid.
	 */
	import { c } from "$lib/content/index.js";
	import { resolveAvatar, type Avatar } from "$lib/portfolio/avatar.js";
	import { RetroCard, SectionWindow } from "$lib/retro/index.js";

	const IDS = [1, 2, 3, 4];

	/**
	 * Real photos (consented) live at `static/portfolio/testimonials/<slug>.{webp,jpg}`
	 * — the map is lifted verbatim from the standard section, which is the single
	 * source of truth for who gave us one. Romain has no photo, and in this skin
	 * that fallback is TYPOGRAPHIC: a Silkscreen monogram on the accent square,
	 * not `resolveAvatar`'s round initials SVG (a hashed hsl() circle would be the
	 * one un-retro pixel on the page). Hence `resolveAvatar` is only called for the
	 * ids that actually resolve to a file, and `initials()` is re-derived below —
	 * `avatar.ts` keeps its own copy private, for the SVG it no longer draws here.
	 */
	const PHOTO_SLUGS: Record<number, string> = {
		1: "mathilde-gallouet",
		3: "hichem-rekouane",
		4: "elie-nissen"
	};

	/** Avatar square fills, index-mapped — the strip is a fixed four-colour chord. */
	const AVATAR_BGS = [
		"var(--r-avatar-1)",
		"var(--r-avatar-2)",
		"var(--r-avatar-3)",
		"var(--r-avatar-4)"
	];

	/** The wash a card takes while picked, paired 1:1 with the avatar above it. */
	const ACTIVE_TINTS = [
		"var(--r-tint-blue)",
		"var(--r-tint-rust)",
		"var(--r-tint-green)",
		"var(--r-tint-gold)"
	];

	/** Two-letter monogram: first + last word ("Mathilde Gallouët" → "MG"). */
	function initials(name: string): string {
		const words = name.trim().split(/\s+/).filter(Boolean);
		if (words.length === 0) return "?";
		const first = words[0][0];
		const last = words.length > 1 ? words[words.length - 1][0] : "";
		return (first + last).toUpperCase();
	}

	interface Person {
		id: number;
		name: string;
		monogram: string;
		photo?: Avatar;
		designation: string;
		date: string;
		linkedin: string;
		excerpt: string;
		bg: string;
		tint: string;
	}

	// $derived, not a plain const: every field is a c() read, and c() reads through
	// the edit-mode overlay — a snapshot taken once at init would leave the studio's
	// live edits stranded behind the destructured values.
	const people: Person[] = $derived(
		IDS.map((id, i) => {
			const name = c(`testimonials.${id}.name`);
			const slug = PHOTO_SLUGS[id];
			return {
				id,
				name,
				monogram: initials(name),
				photo: slug ? resolveAvatar(name, slug) : undefined,
				designation: c(`testimonials.${id}.designation`),
				date: c(`testimonials.${id}.date`),
				linkedin: c(`testimonials.${id}.linkedin.href`),
				excerpt: c(`testimonials.${id}.excerpt`),
				bg: AVATAR_BGS[i],
				tint: ACTIVE_TINTS[i]
			};
		})
	);

	/** Index of the highlighted colleague; -1 = none. Pure presentation state. */
	let picked = $state(-1);

	function pick(i: number): void {
		picked = picked === i ? -1 : i;
	}
</script>

<!--
	The avatar face, shared by the 44px strip button and the 30px card badge.
	`inner` is the box size minus the 2px border on each side — it goes on the img's
	width/height attributes so the intrinsic ratio is known before the file lands.
-->
{#snippet face(p: Person, inner: number, pixelated: boolean)}
	{#if p.photo}
		<picture class="r-testi-pic">
			{#if p.photo.webp}
				<source srcset={p.photo.webp} type="image/webp" />
			{/if}
			<img
				src={p.photo.src}
				alt={`Profile picture of ${p.name}`}
				width={inner}
				height={inner}
				loading="lazy"
				class="r-testi-img"
				class:is-pixel={pixelated}
			/>
		</picture>
	{:else}
		{p.monogram}
	{/if}
{/snippet}

<SectionWindow
	id="retro-testimonials"
	index="04"
	titleKey="home.testimonials.title"
	dosKey="retro.window.testimonials.dos"
	accent="blue"
	captionKey="retro.testimonials.subtitle"
>
	<!--
		The strip is the section's KEYBOARD control: real buttons, `aria-pressed`
		carrying the picked state. The cards below repeat the same toggle for the
		mouse (the mockup lets you click either), but they are deliberately left out
		of the tab order — they contain a link and editable text, so making them
		`role="button"` would nest interactives, and the highlight gates nothing:
		every card is fully readable in either state.
	-->
	<div class="flex flex-wrap justify-center gap-[14px] px-5 pt-[18px] pb-[6px]">
		{#each people as p, i (p.id)}
			<button
				type="button"
				onclick={() => pick(i)}
				aria-pressed={picked === i}
				aria-label={`Highlight the testimonial from ${p.name}`}
				class="r-pixel r-border r-shadow-2 r-pressable r-testi-avatar"
				style="background: {p.bg}{picked === i ? '; box-shadow: 0 0 0 var(--r-ink)' : ''}"
			>
				{@render face(p, 40, true)}
			</button>
		{/each}
	</div>

	<div class="grid grid-cols-1 gap-4 px-6 pt-4 pb-[26px] sm:grid-cols-2 lg:grid-cols-4">
		{#each people as p, i (p.id)}
			<!--
				Picked = the tint fill plus a hard 4px ink shadow; at rest the card sits
				on translucent ink (`.r-shadow-soft-3`), which is the retro vocabulary
				for "unselected among peers". Both rungs ride RetroCard's `class`, per
				its ladder contract — later class wins at equal specificity.

				`padding`/`gap` are inline because `.r-card`'s 20px/12px is unlayered CSS
				that no Tailwind utility can outrank (see retro.css CASCADE NOTE), and a
				four-across card is denser than the grammar's default.
			-->
			<RetroCard
				bg={picked === i ? p.tint : "var(--r-paper)"}
				class={picked === i ? "r-shadow-4 cursor-pointer" : "r-shadow-soft-3 cursor-pointer"}
				style="padding: 16px; gap: 10px"
				onclick={() => pick(i)}
			>
				<div class="flex items-center gap-[10px]">
					<span class="r-pixel r-border r-testi-mini" style="background: {p.bg}">
						{@render face(p, 26, false)}
					</span>
					<div class="flex min-w-0 flex-col">
						<!--
							Both attributes on the <a> itself: the studio's click delegation
							resolves the nearest [data-edit-href] first, so a data-edit on a
							descendant would be unreachable (EDIT-CONTRACT §3). The ↗ is a
							decorative sibling — openLinkEditor reads the label via c(), so it
							does not disturb the round-trip. stopPropagation keeps a click on
							the profile link from also toggling the highlight.
						-->
						<a
							href={p.linkedin || undefined}
							target="_blank"
							rel="noopener noreferrer"
							onclick={(e) => e.stopPropagation()}
							class="r-testi-name"
							data-edit={`testimonials.${p.id}.name`}
							data-edit-href={`testimonials.${p.id}.linkedin.href`}>{p.name}<span
								class="r-testi-arrow"
								aria-hidden="true">↗</span
							></a
						>
						<span class="r-mono r-testi-meta">
							<span data-edit={`testimonials.${p.id}.designation`}>{p.designation}</span>
							·
							<span data-edit={`testimonials.${p.id}.date`}>{p.date}</span>
						</span>
					</div>
				</div>
				<p class="r-testi-text" data-edit={`testimonials.${p.id}.excerpt`}>{p.excerpt}</p>
			</RetroCard>
		{/each}
	</div>
</SectionWindow>

<style>
	/* border + resting shadow + press physics come from the recipe layer; this only
	   sizes the square and strips the UA button chrome. */
	.r-testi-avatar {
		display: inline-flex;
		width: 44px;
		height: 44px;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		box-sizing: border-box;
		padding: 0;
		font-size: 12px;
		color: var(--r-ink);
	}

	/* The card's smaller echo of the same square — inert, the whole card is the hit
	   target, so it carries no shadow and no press state. */
	.r-testi-mini {
		display: inline-flex;
		width: 30px;
		height: 30px;
		flex: none;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		box-sizing: border-box;
		font-size: 10px;
		color: var(--r-ink);
	}

	.r-testi-pic {
		display: block;
		width: 100%;
		height: 100%;
	}

	.r-testi-img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	/* Only the 44px strip is pixelated: at that size the photo reads as a sprite,
	   which is the joke. The 30px badge is too small for the artefact to land. */
	.is-pixel {
		image-rendering: pixelated;
	}

	.r-testi-name {
		font-size: 13px;
		font-weight: 700;
		color: var(--r-ink);
		text-decoration: none;
	}

	@media (hover: hover) {
		.r-testi-name:hover {
			color: var(--r-blue);
		}
	}

	.r-testi-arrow {
		margin-left: 3px;
	}

	.r-testi-meta {
		font-size: 10px;
		color: var(--r-muted);
	}

	.r-testi-text {
		margin: 0;
		font-size: 12.5px;
		line-height: 1.55;
		color: var(--r-prose);
	}
</style>
