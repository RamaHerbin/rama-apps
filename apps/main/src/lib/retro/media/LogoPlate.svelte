<script lang="ts">
	import { cn } from "$lib/utils.js";

	interface Props {
		src: string;
		alt: string;
		class?: string;
	}

	let { src, alt, class: className }: Props = $props();
</script>

<!--
	Ink plate for a client wordmark (FdP hero). Soft 3px shadow rather than the
	hard ink one — the plate is already ink, so a solid ink shadow would read as a
	smear instead of an offset.

	FILTER POLICY — read before "fixing" the img rule below.
	The artwork in FleurdePapier.svg is a single path with fill="white". The
	standard page has to invert it (`grayscale(1) invert(1)`) because it paints the
	wordmark on a LIGHT surface; see the comment in
	src/routes/projects/fleur-de-papier/+page.svelte. Here the surface is
	--r-ink, i.e. the dark case, so the white artwork is already correct and MUST
	NOT be inverted — inverting would render black-on-near-black. `grayscale(1)`
	is kept so any coloured variant of the asset still lands as neutral white on
	the ink plate; that is a no-op on the current pure-white path.
-->
<div class={cn("r-logoplate r-shadow-soft-3", className)}>
	<img {src} {alt} loading="lazy" class="r-logoplate-img" />
</div>

<style>
	.r-logoplate {
		display: flex;
		height: 120px;
		align-items: center;
		justify-content: center;
		box-sizing: border-box;
		padding: 24px;
		background: var(--r-ink);
		/* shadow comes from the .r-shadow-soft-3 recipe (retro.css) — a soft ink,
		   not the hard one, because the plate itself is ink */
	}

	.r-logoplate-img {
		max-height: 100%;
		max-width: 100%;
		object-fit: contain;
		/* white artwork on an ink plate — grayscale only, NEVER invert. See above. */
		filter: grayscale(1);
	}
</style>
