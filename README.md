# rama-apps

Monorepo for [Rama Herbin](https://github.com/RamaHerbin)'s personal websites.

**Live:** [rama.app](https://rama.app) — portfolio · [photo.rama.app](https://photo.rama.app) — photography

## Apps

| App | URL | What it is | Docs |
|-----|-----|------------|------|
| [`apps/main`](apps/main) | [rama.app](https://rama.app) | Personal portfolio / landing page | [README](apps/main/README.md) |
| [`apps/photo`](apps/photo) | [photo.rama.app](https://photo.rama.app) | Photography portfolio + studio tools | [README](apps/photo/README.md) |

## Stack

- **[SvelteKit](https://svelte.dev/)** (Svelte 5) on **Cloudflare Workers** (`@sveltejs/adapter-cloudflare`)
- **[Tailwind CSS v4](https://tailwindcss.com/)** (via `@tailwindcss/vite`)
- **TypeScript**
- **[`fancy-ui-svelte`](https://fancy-ui.rama.app)** for UI components (shared by both apps)
- **pnpm** workspaces

## Getting started

Requires **Node 20+** and **[pnpm](https://pnpm.io/)**.

```bash
pnpm install        # install all workspace deps
pnpm dev            # run both apps in parallel
```

## Commands (from repo root)

```bash
pnpm dev            # both apps in parallel
pnpm dev:main       # rama.app only
pnpm dev:photo      # photo.rama.app only

pnpm build:main     # build rama.app
pnpm build:photo    # build photo.rama.app

pnpm check:main     # typecheck rama.app
pnpm check:photo    # typecheck photo.rama.app
```

Each app can also be run from its own directory (`cd apps/main && pnpm dev`). See the per-app READMEs for app-specific commands, routes, and environment variables.

## Structure

```
apps/
├── main/          # rama.app — portfolio (see apps/main/README.md)
│   └── src/
│       ├── lib/portfolio/   # sections, NavAnchor, ReviewCard, …
│       ├── lib/stores/      # theme (dark/light)
│       └── routes/          # single-page + project/carbon/photo pages
└── photo/         # photo.rama.app — photography platform (see apps/photo/README.md)
    └── src/
        ├── lib/components/  # PhotoCard, PhotoGrid, Lightbox, …
        ├── lib/data/        # JSON data layer
        └── routes/          # gallery, collections, about
pnpm-workspace.yaml
package.json        # workspace scripts
```

---

Made with [FancyUI](https://fancy-ui.rama.app).
