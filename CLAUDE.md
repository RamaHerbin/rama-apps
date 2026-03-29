# Project: photo.rama.app

## Purpose
Personal photography platform — one SvelteKit app with two faces:
- **Gallery** (`/`, `/gallery`, `/collections`, `/about`) — Public portfolio, prerendered, SEO-optimized
- **Studio** (`/studio`) — Private tools for image editing (resize, borders, batch processing) and publishing to both the site and Instagram

## Stack
- SvelteKit (Svelte 5) on Cloudflare Workers (`adapter-cloudflare`)
- Tailwind CSS v4 (via `@tailwindcss/vite`)
- `fancy-ui` as local dependency (`link:../fancy-ui`)
- Sharp for server-side image processing
- Cloudflare R2 for image storage
- GSAP for animations

## Repository structure

```
src/
├── lib/
│   ├── components/          # App components
│   │   ├── PhotoCard.svelte         # Card with spotlight effect
│   │   ├── PhotoGrid.svelte         # CSS columns masonry layout
│   │   ├── Lightbox.svelte          # Modal viewer (keyboard + touch)
│   │   ├── ImageOptimized.svelte    # <picture> with AVIF/WebP/JPG
│   │   ├── ExifDisplay.svelte       # EXIF metadata grid
│   │   ├── CollectionCard.svelte    # Collection preview card
│   │   ├── Header.svelte            # Sticky nav
│   │   ├── Footer.svelte            # Footer with socials
│   │   └── SEOHead.svelte           # Meta tags, OG, JSON-LD
│   ├── types/               # TypeScript definitions
│   │   ├── photo.ts                 # Photo, PhotoVariants, ExifData
│   │   ├── collection.ts            # Collection
│   │   └── site.ts                  # SiteConfig
│   ├── data/                # In-memory JSON data layer
│   │   └── index.ts                 # getPhotos(), getCollections(), etc.
│   ├── stores/              # Svelte 5 reactive stores
│   │   └── lightbox.svelte.ts       # Lightbox state ($state/$derived)
│   ├── config/
│   │   └── r2.ts                    # R2 URL builder
│   └── utils.ts             # cn() class merger
├── routes/
<<<<<<< HEAD
│   ├── +layout.svelte               # Root layout (header/footer)
│   ├── +layout.ts                   # Root load (site config)
│   ├── +page.svelte                 # Home: hero + recent + collections
│   ├── +page.ts                     # Home load (photos, trailImages)
│   ├── gallery/
│   │   ├── +page.svelte             # All photos, tag filtering
│   │   └── [slug]/+page.svelte      # Photo detail + EXIF + nav
│   ├── collections/
│   │   ├── +page.svelte             # All collections
│   │   └── [slug]/+page.svelte      # Collection photos
│   ├── about/+page.svelte           # Bio, avatar, social links
│   └── studio/                      # Private, auth required (TO BUILD)
│       ├── +page.svelte             # Dashboard
│       ├── edit/+page.svelte        # Single image editor
│       ├── batch/+page.svelte       # Batch processing
│       ├── publish/+page.svelte     # Publish to gallery + Instagram
│       └── library/+page.svelte     # Photo management
=======
│   ├── (gallery)/           # Public portfolio (prerendered)
│   │   ├── +page.svelte             # Home: hero + recent + collections
│   │   ├── gallery/
│   │   │   ├── +page.svelte         # All photos, tag filtering
│   │   │   └── [slug]/+page.svelte  # Photo detail + EXIF + nav
│   │   ├── collections/
│   │   │   ├── +page.svelte         # All collections
│   │   │   └── [slug]/+page.svelte  # Collection photos
│   │   └── about/+page.svelte       # Bio, avatar, social links
│   ├── (studio)/            # Private, auth required (TO BUILD)
│   │   └── studio/
│   │       ├── +page.svelte         # Dashboard
│   │       ├── edit/+page.svelte    # Single image editor
│   │       ├── batch/+page.svelte   # Batch processing
│   │       ├── publish/+page.svelte # Publish to gallery + Instagram
│   │       └── library/+page.svelte # Photo management
│   └── +layout.svelte       # Root layout (header/footer)
>>>>>>> 3073dd2 (fix: rename inspira-svelte → fancy-ui references, add photos data and CLAUDE.md)
├── scripts/                 # CLI tools (existing)
│   ├── ingest.ts            # Main ingestion CLI
│   ├── exif.ts              # EXIF extraction (sharp + exif-reader)
│   ├── variants.ts          # Image resize (4 sizes × 3 formats)
│   ├── upload.ts            # R2 upload (AWS SDK S3Client)
│   └── json-store.ts        # Read/write photos.json, collections.json
└── data/                    # JSON data files
    ├── photos.json          # Photo metadata + variant URLs
    ├── collections.json     # Collections
    └── site.json            # Site config (title, socials, about)
```

## What exists today

### Gallery (done)
- Home page with ImageTrailCursor hero, recent photos grid, featured collections
- Gallery page with masonry grid, tag filtering
- Photo detail with full EXIF display, prev/next navigation, JSON-LD
- Collections index and detail pages
- About page with TextGenerateEffect, LineShadowText, LiquidGlass avatar
- Lightbox with keyboard/touch controls, EXIF overlay
- ImageOptimized component (`<picture>` AVIF > WebP > JPG, lazy loading)
- SEO: prerendered, OG tags, structured data

### Ingestion pipeline (done)
```bash
pnpm ingest photo.jpg -t "Title" -d "Description" -c "collection" --tags "tag1,tag2" -f
```
- Extracts EXIF (camera, lens, aperture, shutter, ISO, GPS, date)
- Generates 12 variants (4 sizes: thumb/medium/large/original × 3 formats: AVIF/WebP/JPG)
- Uploads to R2 with immutable cache headers
- Stores metadata in data/photos.json

### Data model
```typescript
Photo {
  id, slug, title, description?, tags[], collectionIds[], featured, aspectRatio,
  variants: { thumb/medium/large/original: { avif/webp/jpg: { url, width, height } } },
  exif: { camera?, lens?, focalLength?, aperture?, shutterSpeed?, iso?, dateTaken?, location? },
  createdAt, updatedAt
}
Collection { id, slug, title, description?, coverPhotoId?, featured, createdAt, updatedAt }
SiteConfig { title, description, author, url, r2PublicUrl, socials[], about: { bio, avatar } }
```

## What needs to be built: Studio

### Architecture
- Route group `(studio)` with auth guard (simple password or OAuth — just me for now)
- Server-side image processing via Sharp (reuse existing variants.ts logic)
- Canvas API client-side for real-time preview only
- Replaces CLI workflow with a web UI

### Phase 1 — MVP editor
- Upload single/multiple images via drag & drop
- Resize with aspect ratio presets: 1:1, 4:5, 16:9, 9:16, 4:3, free
- Add borders (solid color: white, black, custom hex)
- Preview Instagram grid appearance
- Export/download processed images
- Publish to gallery (replace `pnpm ingest` with UI flow)

### Phase 2 — Batch & collections
- Batch processing (apply same edits to multiple images)
- Border presets (textures, gradients)
- Crop tool with grid overlay
- Preview across formats (Instagram post, story, carousel)
- Collection/album management UI
- Photo metadata editing (title, description, tags)

### Phase 3 — Lightroom light
- Basic adjustments: exposure, contrast, saturation, temperature, highlights, shadows
- Filters/presets (saveable)
- Watermark overlay (text or image, position, opacity)
- Multi-format export (WebP, JPEG quality slider, PNG)
- History/undo stack
- Side-by-side before/after (use fancy-ui Compare component)

### Instagram sync (bidirectional)
- **Outbound**: Select photos → apply edits → publish to Instagram (Graph API) + portfolio simultaneously
- **Inbound**: Import existing Instagram posts into the portfolio
- Requires Instagram Graph API + Facebook Business account

## Dependency: fancy-ui
<<<<<<< HEAD
- Local link: `"fancy-ui": "link:../fancy-ui"`
=======
- Local link: `"fancy-ui": "link:../inspira-svelte"`
>>>>>>> 3073dd2 (fix: rename inspira-svelte → fancy-ui references, add photos data and CLAUDE.md)
- Import: `import { BlurReveal, Compare, Focus } from 'fancy-ui'`
- Currently used: ImageTrailCursor, CardSpotlight, LineShadowText, LiquidGlass, TextGenerateEffect
- Useful for Studio: Compare (before/after), Focus, BlurReveal
- If a component doesn't exist yet in fancy-ui, build it there first — not here

## Hard rules
- Never store full-resolution images in the git repo
- Always extract and preserve EXIF data before any processing
- Image processing server-side (Sharp) for production quality; Canvas client-side for preview only
- Auth required for all `/studio` routes and all write API endpoints
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

## Image variants spec
| Size     | Max width | AVIF quality | WebP quality | JPEG quality |
|----------|-----------|--------------|--------------|--------------|
| thumb    | 400px     | 65%          | 80%          | 85%          |
| medium   | 1200px    | 65%          | 80%          | 85%          |
| large    | 2400px    | 65%          | 80%          | 85%          |
| original | max       | 65%          | 80%          | 85%          |

R2 path pattern: `{photoId}/{size}.{format}`

## Environment variables
```env
# R2 Storage
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=photo-rama

# Instagram (future)
INSTAGRAM_APP_ID=
INSTAGRAM_APP_SECRET=
INSTAGRAM_REDIRECT_URI=

# Auth (future)
AUTH_SECRET=
ADMIN_PASSWORD=
```

## Commands
- `pnpm dev` — dev server
- `pnpm build` — production build
- `pnpm check` — typecheck
- `pnpm ingest <file> [options]` — CLI photo ingestion
