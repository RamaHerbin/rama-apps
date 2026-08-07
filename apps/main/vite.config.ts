import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type Plugin } from 'vite';
import { SITE_PATHS } from './src/lib/seo/routes.js';
import { SKINS, SKIN_NAMES, SKIN_STORAGE_KEY, type SkinName } from './src/lib/skins/registry.js';

const ROUTES_DIR = fileURLToPath(new URL('./src/routes', import.meta.url));
const SKINS_CSS = fileURLToPath(new URL('./src/routes/skins.css', import.meta.url));
const APP_HTML = fileURLToPath(new URL('./src/app.html', import.meta.url));

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

/** Every skin that actually paints something. `standard` is the *absence* of a skin. */
type SkinnedName = Exclude<SkinName, 'standard'>;

/**
 * The engine's own token modules — the upstream truth for `--skin-page-bg`.
 *
 * Import `<skin>/tokens.js`, never `<skin>/index.js`: index.js does
 * `import "./brutal.css"`, and a bare Node import of a stylesheet throws
 * ERR_UNKNOWN_FILE_EXTENSION. tokens.js is a lone object literal with no imports
 * of its own, so it loads in the plain Node process that evaluates this config.
 *
 * The specifiers are literal rather than built from `${name}`, so esbuild — which
 * bundles this file before Node sees it — can resolve them statically, and so the
 * package's `exports` allow-list has a concrete path to match.
 *
 * Adding a fourth skin to SKIN_NAMES makes the lookup in the guard below fail to
 * typecheck until it is added here too, so the guard can never silently skip one.
 */
const ENGINE_TOKENS: Record<SkinnedName, () => Promise<Record<string, string>>> = {
	brutal: async () =>
		(await import('fancy-ui-svelte/cameleon/skins/brutal/tokens.js')).brutalTokens,
	'retro-os': async () =>
		(await import('fancy-ui-svelte/cameleon/skins/retro-os/tokens.js')).retroOsTokens
};

/**
 * Compare hexes by value, not by spelling. CSS hex is case-insensitive and the
 * copies disagree by convention: the engine and the two hand-copies transcribed
 * from it are uppercase, while skins.css is lowercased by the formatter.
 */
function hex(value: string): string {
	return value.trim().toLowerCase();
}

/**
 * Drop C-style block comments before scanning. Both files deliberately *document*
 * hexes they do not declare — retro-os's unported `--skin-desk` (#E5DCC2) in
 * skins.css, the `#ffffff` / `#0a0a0a` light/dark pair in app.html — and a scan
 * over raw text would read that prose as code. Line comments are left alone on
 * purpose: stripping them would eat the `//` of every `https://` font URL.
 */
function stripBlockComments(source: string): string {
	return source.replace(/\/\*[\s\S]*?\*\//g, '');
}

/**
 * Every `--skin-page-bg` declared under `html[data-skin="<skin>"]` in skins.css.
 *
 * Returns a list rather than a value so the caller can reject "declared twice"
 * and "not declared at all" separately. `[^{}]*` deliberately refuses to match
 * across a nested block: if someone wraps these tokens in an `@media`, the count
 * comes back 0 and the guard fails loudly instead of quietly reading the wrong
 * rule. Failing closed is the only safe direction for a guard.
 */
function pageBackgroundsInSkinsCss(css: string, skin: SkinnedName): string[] {
	const found: string[] = [];
	const blocks = new RegExp(`html\\[data-skin="${skin}"\\][^{}]*\\{([^{}]*)\\}`, 'g');
	for (const [, body] of css.matchAll(blocks)) {
		for (const [, value] of body.matchAll(/--skin-page-bg\s*:\s*([^;]+);/g)) found.push(hex(value));
	}
	return found;
}

/** The `themeColor` / `fontHref` literals app.html carries for one skin, if that entry parses at all. */
function skinEntryInAppHtml(
	html: string,
	skin: SkinnedName
): { themeColor?: string; fontHref?: string } | null {
	const entry = new RegExp(`(?:'${skin}'|"${skin}"|${skin})\\s*:\\s*\\{([^{}]*)\\}`).exec(html);
	if (!entry) return null;
	return {
		themeColor: /themeColor\s*:\s*'([^']*)'/.exec(entry[1])?.[1],
		fontHref: /fontHref\s*:\s*'([^']*)'/.exec(entry[1])?.[1]
	};
}

/**
 * Keep the four copies of the skin contract in agreement.
 *
 * `src/lib/skins/registry.ts` is the source of truth, but only one of its four
 * consumers can import it. The other three hold hand-written copies because they
 * physically cannot do otherwise:
 *
 *   - `src/routes/skins.css` — CSS cannot import TypeScript, and nothing writes
 *     the engine's tokens at runtime (FancyProvider is never mounted), so the
 *     token block is transcribed by hand.
 *   - `src/app.html` — an .html file cannot import anything, and the skin has to
 *     resolve before first paint on a fully prerendered site, so the storage key,
 *     the name allow-list, the theme-color hexes and the font URLs are inlined in
 *     the anti-FOUC IIFE.
 *   - the engine's own `dist/cameleon/skins/<skin>/tokens.js` — upstream, in
 *     another repository, and the reason any of these hexes have the values they
 *     have.
 *
 * Nothing else turns a mismatch red: drift typechecks, prerenders and deploys
 * clean, and `svelte.config.js` sets `prerender.handleHttpError: 'warn'`, so this
 * build never fails on its own. The single runtime symptom is a mobile chrome bar
 * painted in the wrong color for the life of the page — invisible in review,
 * invisible in CI, invisible on every desktop.
 *
 * Sibling of seoRouteTableGuard above, and for the same reason: this runs in
 * `vite build`, so drift fails the Vercel deploy and not just a local `pnpm check`.
 */
function skinContractGuard(): Plugin {
	return {
		name: 'skin-contract-guard',
		apply: 'build',
		async buildStart() {
			const css = stripBlockComments(readFileSync(SKINS_CSS, 'utf8'));
			const html = stripBlockComments(readFileSync(APP_HTML, 'utf8'));
			const problems: string[] = [];

			// app.html re-reads the storage key by hand; the store imports it. A rename
			// on one side alone silently orphans every visitor's saved choice.
			const storageKeys = [...html.matchAll(/localStorage\.getItem\(\s*'([^']*)'\s*\)/g)].map(
				([, key]) => key
			);
			if (!storageKeys.includes(SKIN_STORAGE_KEY)) {
				problems.push(
					`  src/app.html reads localStorage keys [${storageKeys.map((k) => `"${k}"`).join(', ')}]`,
					`    but registry.ts SKIN_STORAGE_KEY is "${SKIN_STORAGE_KEY}"`
				);
			}

			// "standard" is the absence of a skin, so it owns no theme-color: the
			// light/dark theme keeps #ffffff/#0a0a0a. app.html has no branch that could
			// honour a hex here, so one appearing would be dead on arrival.
			if (SKINS.standard.themeColor !== null) {
				problems.push(
					`  registry.ts SKINS.standard.themeColor is "${SKINS.standard.themeColor}", expected null`,
					'    (standard is the absence of a skin; theme.svelte.ts owns theme-color there)'
				);
			}

			for (const name of SKIN_NAMES) {
				if (name === 'standard') continue;

				const expected = SKINS[name].themeColor;
				if (expected === null) {
					problems.push(`  registry.ts SKINS["${name}"].themeColor is null, expected a hex`);
					continue;
				}

				// 1. registry <- engine. The upstream value these were transcribed from.
				const engine = (await ENGINE_TOKENS[name]())['--skin-page-bg'];
				if (hex(engine) !== hex(expected)) {
					problems.push(
						`  fancy-ui dist/cameleon/skins/${name}/tokens.js --skin-page-bg is "${engine}"`,
						`    but registry.ts SKINS["${name}"].themeColor is "${expected}"`
					);
				}

				// 2. skins.css. What the page is actually painted in.
				const declared = pageBackgroundsInSkinsCss(css, name);
				if (declared.length !== 1 || declared[0] !== hex(expected)) {
					problems.push(
						`  src/routes/skins.css html[data-skin="${name}"] declares --skin-page-bg ` +
							(declared.length === 0
								? 'nowhere'
								: `as ${declared.map((v) => `"${v}"`).join(' and ')}`),
						`    but registry.ts SKINS["${name}"].themeColor is "${expected}"`
					);
				}

				// 3. app.html. What the mobile chrome bar is actually painted in.
				const entry = skinEntryInAppHtml(html, name);
				if (!entry) {
					problems.push(
						`  src/app.html has no "${name}" entry in the anti-FOUC IIFE's SKINS object`,
						'    (or it was restructured past what this guard can parse — update both)'
					);
				} else {
					if (entry.themeColor === undefined || hex(entry.themeColor) !== hex(expected)) {
						problems.push(
							`  src/app.html SKINS["${name}"].themeColor is ${entry.themeColor === undefined ? 'missing' : `"${entry.themeColor}"`}`,
							`    but registry.ts SKINS["${name}"].themeColor is "${expected}"`
						);
					}
					if (entry.fontHref !== SKINS[name].fontHref) {
						problems.push(
							`  src/app.html SKINS["${name}"].fontHref is ${entry.fontHref === undefined ? 'missing' : `"${entry.fontHref}"`}`,
							`    but registry.ts SKINS["${name}"].fontHref is "${SKINS[name].fontHref}"`
						);
					}
				}

				// 4. The name itself. app.html compares with === against a literal rather
				// than looking the name up on its SKINS object, so a rename has to land in
				// two places there, and only one of them is checked above.
				if (!new RegExp(`===\\s*'${name}'`).test(html)) {
					problems.push(
						`  src/app.html never compares the stored skin against '${name}'`,
						`    but registry.ts SKIN_NAMES contains "${name}"`
					);
				}
			}

			if (problems.length === 0) return;

			throw new Error(
				['The skin contract has drifted from src/lib/skins/registry.ts:']
					.concat(problems, [
						'',
						'These values are duplicated on purpose — CSS cannot import TypeScript and',
						'app.html cannot import anything — so every change has to land in all of',
						'src/lib/skins/registry.ts, src/routes/skins.css and src/app.html at once.',
						'This guard is the only thing that turns a mismatch red; left alone it ships',
						'as a mobile chrome bar in the wrong color, and nothing else ever complains.'
					])
					.join('\n')
			);
		}
	};
}

export default defineConfig({
	plugins: [seoRouteTableGuard(), skinContractGuard(), tailwindcss(), sveltekit()],
	server: {
		// Fixed port so the studio editor iframe can rely on a stable portfolio URL.
		port: 5180,
		strictPort: true,
		fs: {
			allow: ['.']
		}
	}
});
