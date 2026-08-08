<script lang="ts">
	/**
	 * "Local Time: HH:MM" — the footer's one live element.
	 *
	 * fr-FR 24h, refreshed every 30s. The interval lives INSIDE an `$effect` that
	 * reads `skinState.skin` first, so it only ever runs while the retro tree is the
	 * visible one: the dual-tree toggle keeps both trees in the DOM and hides one in
	 * CSS, which means an ungated timer here would tick forever behind the standard
	 * and brutal skins for nothing. Reading the rune inside the effect also makes the
	 * gate reactive — switching away tears the interval down through the returned
	 * cleanup, switching back re-creates it.
	 *
	 * The initial value is the placeholder rather than a real time: `$effect` never
	 * runs during prerender, so the built HTML would otherwise ship the BUILD
	 * machine's clock and every visitor would see it flash to their own on hydration.
	 */
	import { createSkinState } from "$lib/stores/skin.svelte.js";
	import { c } from "$lib/content/index.js";

	interface Props {
		/** content key for the label, e.g. "retro.footer.local-time" ("Local Time:") */
		labelKey: string;
	}

	let { labelKey }: Props = $props();

	const skinState = createSkinState();

	/** Rendered on the server and until the first tick. */
	const PLACEHOLDER = "--:--";

	let time = $state(PLACEHOLDER);

	$effect(() => {
		if (skinState.skin !== "retro-os") return;

		const tick = () => {
			time = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
		};

		tick();
		const id = window.setInterval(tick, 30_000);
		return () => window.clearInterval(id);
	});
</script>

<span class="inline-flex items-center gap-1.5">
	<span data-edit={labelKey}>{c(labelKey)}</span>
	<span class="tabular-nums">{time}</span>
</span>
