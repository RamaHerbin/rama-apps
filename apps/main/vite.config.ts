import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type Plugin } from 'vite';
import { SITE_PATHS } from './src/lib/seo/routes.js';

const ROUTES_DIR = fileURLToPath(new URL('./src/routes', import.meta.url));

/**
 * Walk src/routes and return the pathname of every statically-addressable page.
 *
 * Route groups `(name)` contribute no URL segment. Parameterised segments
 * (`[slug]`, `[...rest]`) cannot be enumerated without loading each route's
 * `entries()`, so they are skipped rather than guessed — the guard below only
 * claims to cover static routes, which is all this site has.
 */
function discoverStaticRoutes(dir = ROUTES_DIR, prefix = ''): string[] {
	const found: string[] = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		if (entry.isDirectory()) {
			if (entry.name.includes('[')) continue;
			const segment = entry.name.startsWith('(') ? '' : `/${entry.name}`;
			found.push(...discoverStaticRoutes(join(dir, entry.name), prefix + segment));
		} else if (entry.name.startsWith('+page') && entry.name.endsWith('.svelte')) {
			found.push(prefix === '' ? '/' : prefix);
		}
	}
	return found;
}

/**
 * Keep src/lib/seo/routes.ts honest against the filesystem.
 *
 * `SITE_PATHS` <-> `PAGES` is already enforced by the type system, but nothing
 * tied either of them to the routes that actually exist. Adding
 * `src/routes/foo/+page.svelte` without touching the table type-checks clean,
 * prerenders clean, and ships with the *home page's* title, description and
 * og:url while being absent from the sitemap — the only signal a `console.warn`
 * buried in a green build log. `svelte.config.js` sets
 * `prerender.handleHttpError: 'warn'`, so SEO regressions never fail on their own.
 *
 * This runs in `vite build`, which means it fails the Vercel deploy and not just
 * a local `pnpm check`.
 */
function seoRouteTableGuard(): Plugin {
	return {
		name: 'seo-route-table-guard',
		apply: 'build',
		buildStart() {
			const onDisk = discoverStaticRoutes();
			const declared: string[] = [...SITE_PATHS];
			const undeclared = onDisk.filter((p) => !declared.includes(p));
			const phantom = declared.filter((p) => !onDisk.includes(p));

			if (undeclared.length === 0 && phantom.length === 0) return;

			throw new Error(
				['src/lib/seo/routes.ts is out of sync with src/routes/:']
					.concat(
						undeclared.map((p) => `  + "${p}" has a +page.svelte but no SITE_PATHS entry`),
						phantom.map((p) => `  - "${p}" is in SITE_PATHS but has no +page.svelte`),
						['', 'Add or remove the path in SITE_PATHS; PAGES will then fail to typecheck', 'until its metadata follows.']
					)
					.join('\n')
			);
		}
	};
}

export default defineConfig({
	plugins: [seoRouteTableGuard(), tailwindcss(), sveltekit()],
	server: {
		// Fixed port so the studio editor iframe can rely on a stable portfolio URL.
		port: 5180,
		strictPort: true,
		fs: {
			allow: ['.']
		}
	}
});
