# apps/main — rama.app

Rama Herbin's personal portfolio / landing page. Ported from [`portfolio-2k25`](https://github.com/RamaHerbin/portfolio-2k25) (Nuxt / Vue) to SvelteKit.

**Live:** [rama.app](https://rama.app)

> Part of the [rama-apps](../../README.md) monorepo — run `pnpm install` from the repo root first.

## Stack

- SvelteKit (Svelte 5) on Cloudflare Workers (`@sveltejs/adapter-cloudflare`)
- Tailwind CSS v4
- [`fancy-ui-svelte`](https://fancy-ui.rama.app) `^0.7.0` — UI / animation components
- shadcn-style theme (oklch CSS variables), dark by default — toggle in `$lib/stores/theme.svelte.ts`

## Routes

All routes are prerendered (`src/routes/+layout.ts` sets `prerender = true`).

| Route | Page |
|-------|------|
| `/` | Single-page portfolio (Hero, Trusted, About, Projects, Testimonials, Passions, Creative, Contact, Footer) |
| `/projects/fleur-de-papier` | Project case study |
| `/projects/personal` | Personal projects |
| `/carbon` | Carbon footprint page |
| `/photo` | Full-screen image-trail experience |

## Structure

```
src/
├── lib/
│   ├── portfolio/
│   │   ├── sections/        # Hero, About, Projects, Testimonials, …
│   │   ├── NavAnchor.svelte # glass nav + dark-mode toggle
│   │   ├── ReviewCard.svelte, CarbonNeutralBadge.svelte, ContactForm.svelte
│   │   └── index.ts
│   ├── stores/theme.svelte.ts
│   └── utils.ts
└── routes/                  # pages above + layout.css
static/portfolio/            # portfolio images & logos
```

## Commands

```bash
pnpm --filter main dev       # dev server
pnpm --filter main build     # production build
pnpm --filter main check     # typecheck

# or from apps/main:
pnpm dev
```

(Or from the repo root: `pnpm dev:main`, `pnpm build:main`, `pnpm check:main`.)

## Environment

No environment variables required.
