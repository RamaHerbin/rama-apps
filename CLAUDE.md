# Project: rama-apps (monorepo)

## Structure
pnpm monorepo with two SvelteKit apps:
- **`apps/photo`** — photo.rama.app: Photography portfolio + studio tools
- **`apps/main`** — rama.app: Personal portfolio/landing page

## Stack (shared)
- SvelteKit (Svelte 5) on Cloudflare Workers (`adapter-cloudflare`)
- Tailwind CSS v4 (via `@tailwindcss/vite`)
- `fancy-ui-svelte` npm package for UI components
- TypeScript

## Commands
```bash
# Root
pnpm install              # Install all workspace deps
pnpm dev:photo            # Dev server for photo app
pnpm dev:main             # Dev server for main app
pnpm build:photo          # Build photo app
pnpm build:main           # Build main app
pnpm check:photo          # Typecheck photo app
pnpm check:main           # Typecheck main app

# From app dirs
cd apps/photo && pnpm dev
cd apps/main && pnpm dev
pnpm --filter photo ingest <file> [options]
```

## Monorepo layout
```
apps/
├── photo/                 # photo.rama.app
│   ├── src/
│   │   ├── lib/components/    # PhotoCard, PhotoGrid, Lightbox, etc.
│   │   ├── lib/types/         # Photo, Collection, SiteConfig
│   │   ├── lib/data/          # JSON data layer
│   │   ├── lib/stores/        # Lightbox state
│   │   ├── lib/config/r2.ts   # R2 URL builder
│   │   ├── lib/utils.ts       # cn() merger
│   │   └── routes/            # Gallery + Studio routes
│   ├── scripts/               # CLI ingestion tools
│   ├── data/                  # photos.json, collections.json, site.json
│   └── static/                # Static assets
├── main/                  # rama.app
│   ├── src/
│   │   ├── lib/portfolio/     # Portfolio components (from FancyUI)
│   │   │   ├── sections/      # Hero, About, Projects, etc.
│   │   │   ├── NavAnchor, ReviewCard, ContactForm, etc.
│   │   │   ├── types.ts, validation.ts, index.ts
│   │   ├── lib/stores/theme.svelte.ts  # Dark/light mode
│   │   ├── lib/utils.ts       # cn() merger
│   │   └── routes/            # Single-page portfolio
│   └── static/portfolio/      # Portfolio images & SVGs
pnpm-workspace.yaml
package.json               # Root with workspace scripts
```

---

## apps/photo — photo.rama.app

### Purpose
Photography platform with two faces:
- **Gallery** (`/`, `/gallery`, `/collections`, `/about`) — Public, prerendered, SEO-optimized
- **Studio** (`/studio`) — Private image editing tools (TO BUILD)

### Photo-specific stack
- Sharp for server-side image processing
- Cloudflare R2 for image storage
- GSAP for animations

### What exists
- Full gallery with masonry grid, tag filtering, photo detail + EXIF, collections
- Lightbox with keyboard/touch controls
- ImageOptimized component (`<picture>` AVIF > WebP > JPG)
- SEO: prerendered, OG tags, JSON-LD
- Ingestion pipeline: `pnpm --filter photo ingest photo.jpg -t "Title" --tags "tag1,tag2" -f`

### Data model
```typescript
Photo { id, slug, title, description?, tags[], collectionIds[], featured, aspectRatio, variants, exif, createdAt, updatedAt }
Collection { id, slug, title, description?, coverPhotoId?, featured, createdAt, updatedAt }
SiteConfig { title, description, author, url, r2PublicUrl, socials[], about: { bio, avatar } }
```

### Studio roadmap
- Phase 1: Upload, resize, borders, Instagram preview, publish to gallery
- Phase 2: Batch processing, crop, collection management
- Phase 3: Adjustments, filters, watermarks, history/undo

### Image variants spec
| Size     | Max width | AVIF quality | WebP quality | JPEG quality |
|----------|-----------|--------------|--------------|--------------|
| thumb    | 400px     | 65%          | 80%          | 85%          |
| medium   | 1200px    | 65%          | 80%          | 85%          |
| large    | 2400px    | 65%          | 80%          | 85%          |
| original | max       | 65%          | 80%          | 85%          |

R2 path: `{photoId}/{size}.{format}`

### Photo env vars
```env
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=photo-rama
```

---

## apps/main — rama.app

### Purpose
Personal portfolio / landing page. Migrated from FancyUI repo.

### Components
All FancyUI components imported from `fancy-ui-svelte` npm package.
Portfolio-specific components live in `$lib/portfolio/`.

### Theme
Uses shadcn-style CSS variables (oklch color space) with dark mode toggle.
Theme store at `$lib/stores/theme.svelte.ts`.

---

## Dependency: fancy-ui-svelte
- npm package: `"fancy-ui-svelte": "^0.4.0"`
- Import: `import { BlurReveal, Compare, FluidCursor } from 'fancy-ui-svelte'`
- Both apps use it. Tailwind `@source` directive needed to scan its classes.
- If a component doesn't exist yet, build it in fancy-ui repo first

## Hard rules
- Never store full-resolution images in git
- Always extract and preserve EXIF data before processing
- Image processing server-side (Sharp); Canvas client-side for preview only
- Auth required for `/studio` routes and write API endpoints
- Gallery pages must work without JavaScript (SSR + progressive enhancement)
- Prerender all public gallery routes

## Svelte 5 conventions
- `$state()` for reactive state
- `$derived()` for computed values
- `$effect()` for side effects (with cleanup)
- `$props()` for component props
- `bind:this` for DOM refs
- `onMount` with cleanup return
- `onclick={handler}` syntax (not `on:click`)
