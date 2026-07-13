<script lang="ts">
	import "./layout.css";
	import { onMount, type Component } from "svelte";
	import { dev } from "$app/environment";
	import { injectAnalytics } from "@vercel/analytics/sveltekit";

	let { children } = $props();

	injectAnalytics({ mode: dev ? "development" : "production" });

	// Edit mode is opt-in via ?edit=1&studioOrigin=…, resolved client-side only.
	// The overlay + runtime are dynamically imported (including the param parser)
	// so the normal site and the prerendered build carry zero editor code.
	//
	// Dev-only: `import.meta.env.DEV` is a build-time constant, so in a
	// production build (`vite build`, which is what ships to rama.app) this
	// whole branch — including the dynamic imports — is dead code that the
	// bundler strips. Without this gate, anyone could drive the *deployed*
	// site into edit mode with `?edit=1&studioOrigin=<attacker origin>` and
	// have committed edits posted straight to that origin. The studio only
	// ever points at the local dev server anyway (see EDIT-CONTRACT.md §9).
	let EditOverlay = $state<Component<{ studioOrigin: string }> | null>(null);
	let studioOrigin = $state<string | null>(null);

	const EDIT_SESSION_STORAGE_KEY = "portfolio-edit-studio-origin";

	onMount(async () => {
		if (!import.meta.env.DEV) return;

		const { parseEditParams } = await import("$lib/content/edit-mode.js");
		let params = parseEditParams(new URL(window.location.href));

		if (!params) {
			// SvelteKit client-side navigation to an internal link (e.g. clicking
			// into a project page from the home page) doesn't carry the query
			// string, since the target <a href> never had it. The root layout
			// (and this session) survives that navigation fine, but a *reload* of
			// the resulting sub-page URL re-runs this onMount with no params and
			// would otherwise strand the user with edit mode dead until they
			// navigate back to the home URL by hand. Fall back to the last
			// activated studioOrigin for this tab session.
			const stored = sessionStorage.getItem(EDIT_SESSION_STORAGE_KEY);
			if (stored) {
				try {
					const u = new URL(stored);
					if (u.protocol === "http:" || u.protocol === "https:") {
						params = { studioOrigin: u.origin };
					}
				} catch {
					/* corrupt/stale storage entry — ignore */
				}
			}
		}

		if (!params) return;
		sessionStorage.setItem(EDIT_SESSION_STORAGE_KEY, params.studioOrigin);
		studioOrigin = params.studioOrigin;
		const module = await import("$lib/content/EditOverlay.svelte");
		EditOverlay = module.default;
	});
</script>

{@render children()}

{#if EditOverlay && studioOrigin}
	{@const Overlay = EditOverlay}
	<Overlay {studioOrigin} />
{/if}
