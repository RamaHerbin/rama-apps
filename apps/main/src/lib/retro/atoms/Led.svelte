<script lang="ts">
	interface Props {
		/** lamp colour — green reads "online", rust reads "offline" */
		color?: string;
	}

	let { color = "var(--r-green)" }: Props = $props();
</script>

<!--
	The status lamp next to "STATUS: ONLINE". Purely decorative: the state it
	reports is already in the adjacent text, so announcing a second, wordless
	copy of it would only add noise.

	The blink is `.r-blink` (retro.css) rather than an inline `animation:` so that
	the prefers-reduced-motion rule can switch it off — an inline animation could
	only be cancelled with !important.
-->
<span
	aria-hidden="true"
	class="r-border r-blink inline-block h-[12px] w-[12px] flex-none"
	style="background: {color};"
></span>
