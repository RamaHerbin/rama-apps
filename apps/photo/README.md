# apps/photo — photo.rama.app

Rama Herbin's photography platform with two faces:

- **Gallery** (`/`, `/gallery`, `/collections`, `/about`) — public, prerendered, SEO-optimized
- **Studio** (`/studio`) — private image-editing tools *(to build)*

**Live:** [photo.rama.app](https://photo.rama.app)

> Part of the [rama-apps](../../README.md) monorepo — run `pnpm install` from the repo root first.

## Stack

- SvelteKit (Svelte 5) on Cloudflare Workers (`@sveltejs/adapter-cloudflare`)
- Tailwind CSS v4 · [`fancy-ui-svelte`](https://fancy-ui.rama.app) `^0.7.0`
- **[Sharp](https://sharp.pixelplumbing.com/)** — server-side image processing
- **Cloudflare R2** (`@aws-sdk/client-s3`) — image storage
- **GSAP** — animations · `exif-reader` — EXIF extraction

## What exists

- Masonry gallery grid with tag filtering
- Photo detail pages with EXIF
- Collections
- Lightbox (keyboard + touch controls)
- `ImageOptimized` component — `<picture>` with AVIF → WebP → JPG
- SEO: prerendered, OG tags, JSON-LD
- CLI ingestion pipeline (see below)

## Routes

`/` · `/gallery` · `/gallery/[slug]` · `/collections` · `/collections/[slug]` · `/about`

## Data model

```typescript
Photo      { id, slug, title, description?, tags[], collectionIds[], featured, aspectRatio, variants, exif, createdAt, updatedAt }
Collection { id, slug, title, description?, coverPhotoId?, featured, createdAt, updatedAt }
SiteConfig { title, description, author, url, r2PublicUrl, socials[], about: { bio, avatar } }
```

JSON data lives in `data/` (`photos.json`, `collections.json`, `site.json`).

## Ingestion

Process an image (resize, extract EXIF, generate variants, upload to R2, add to the gallery):

```bash
pnpm --filter photo ingest photo.jpg -t "Title" --tags "tag1,tag2" -f
```

### Image variants

Each photo is generated in four sizes × three formats (AVIF/WebP/JPEG). R2 path: `{photoId}/{size}.{format}`.

| Size     | Max width | AVIF | WebP | JPEG |
|----------|-----------|------|------|------|
| thumb    | 400px     | 65%  | 80%  | 85%  |
| medium   | 1200px    | 65%  | 80%  | 85%  |
| large    | 2400px    | 65%  | 80%  | 85%  |
| original | max       | 65%  | 80%  | 85%  |

## Commands

```bash
pnpm --filter photo dev      # dev server
pnpm --filter photo build    # production build
pnpm --filter photo check    # typecheck
pnpm --filter photo ingest <file> [options]
```

(Or from the repo root: `pnpm dev:photo`, `pnpm build:photo`, `pnpm check:photo`.)

## Environment

Copy `.env.example` to `.env` and fill in the Cloudflare R2 credentials:

```env
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=photo-rama
```

## Notes

- Never store full-resolution images in git.
- EXIF is extracted and preserved before processing.
- Image processing is server-side (Sharp); Canvas is client-side, for preview only.
- Public gallery routes are prerendered and must work without JavaScript (SSR + progressive enhancement).
- Auth is required for `/studio` routes and write API endpoints.
