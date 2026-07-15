# EDIT-CONTRACT.md — click-to-edit portfolio content (FROZEN)

Authoritative contract for making every user-visible string + editable link on
`apps/main` (rama.app portfolio) click-to-edit **when the site runs inside the
fancy-studio editor iframe**. Content lives in JSON in this repo; the studio saves
it and can git commit + push it.

`arch-core` owns this file and the foundation it describes. Everyone else **reads**
it and consumes the foundation. Do not modify the contract; extend content only via
the partial files (§8).

---

## 1. Content file — `apps/main/content/site-content.json`

A **flat namespaced map**: `key → string | string[]`. No nesting. Keys are dotted,
kebab-cased segments. Values are either a plain string (headings, paragraphs,
labels, hrefs) or a `string[]` (tag pill rows).

### Namespaces

| Namespace       | Scope |
|-----------------|-------|
| `home.*`        | Home page sections (`home.hero.*`, `home.trusted.*`, `home.about.*`, …) |
| `fdp.*`         | Fleur de Papier case study page |
| `bnf.*`         | BnF Richelieu detail page |
| `personal.*`    | Personal projects page + its cards |
| `carbon.*`      | `/carbon` page body |
| `photo.*`       | anything surfaced from the photo side |
| `shared.*`      | cross-page chrome: NavAnchor title, footer, carbon badge, made-with-FancyUI |
| `productions.*` | the 6 FdP production entries (title/desc/tags per index) |
| `testimonials.*`| review cards |

### Key naming convention

```
<namespace>.<section>[.<block>][.<role>]
```

- `<section>` groups a visual section (`hero`, `contact`, `card-fancyui`, `badge`).
- `<block>` optionally scopes a sub-element (`ansys`, `link`, `made-with`).
- `<role>` is the leaf: the visible slot. Reserved leaf conventions:
  - `.href` → a URL string edited via the link popover (`data-edit-href`).
  - `.label` → the visible text of a link or button.
  - `.tags` → a `string[]` rendered as a pill row (`data-edit-list`).
  - `.title` / `.role` / `.text` / `.status` / `.note` → plain strings.

Examples:

```jsonc
"home.hero.title"            // string
"home.hero.ansys.label"      // string (link label)
"home.hero.ansys.href"       // string (link URL)
"personal.card-fancyui.tags" // string[]  → ["Svelte","Tailwind","..."]
"shared.nav.title"           // string    → "DevFolio 2k25"
```

**Arrays are for pill rows only.** A paragraph that contains inline links is split
into several string keys around the links (see the Hero worked example, §7).

---

## 2. Content module — `apps/main/src/lib/content/`

Public entry: **`$lib/content/index.js`** (re-exports the reactive store).

```ts
import { c, cList } from "$lib/content/index.js";

c(key: string): string          // string content; console.warn + returns key if missing
cList(key: string): string[]    // string[] content; console.warn + returns [] if missing
getAll(): ContentMap            // raw base+overlay map (used by the edit runtime)
applyLocal(key, value): void    // optimistic edit-mode update (reactive)
```

- The JSON is imported **statically** so its values are baked into the prerendered
  build (the whole portfolio is `prerender = true`).
- Reactive state lives in `store.svelte.ts` (Svelte 5 runes require a `.svelte.ts`
  module). `c()`/`cList()` read through a module-level `$state` **overlay** that is
  empty in normal builds — so reads collapse to the static JSON and prerender is
  unaffected. In edit mode, `applyLocal()` writes the overlay and every `c()`/
  `cList()` read in a template re-renders in place.
- **Never** read the JSON directly in a component. Always go through `c()`/`cList()`
  so edit-mode reactivity works.

---

## 3. DOM marking

Mark the element whose **`textContent` is exactly `c(key)`** (or whose children are
the `cList(key)` pills). The runtime finds edit targets purely by these attributes.

| Attribute                    | On                          | Meaning |
|------------------------------|-----------------------------|---------|
| `data-edit="<key>"`          | the text element            | `textContent` = `c(key)`; click → inline `contenteditable` |
| `data-edit-list="<key>"`     | the pill **container**      | children are the `cList(key)` pills |
| `data-edit-item="<index>"`   | each pill inside the list   | 0-based index into the array; **must** be `{i}` from the `{#each}` |
| `data-edit-href="<key>"`     | an `<a>`                    | its `href` = `c(key)`; click → URL popover (navigation disabled) |

Rules:

- A `data-edit` element must contain **only** the interpolated text (no nested
  markup), so `textContent` round-trips cleanly.
- A `data-edit-list` container renders its pills from `{#each cList(key) as t, i}`
  with `data-edit-item={i}` on each pill. The runtime injects a trailing **“+”**
  chip in edit mode only; do not add it yourself.
- An `<a>` may carry **both** `data-edit-href` (URL key) **and** `data-edit`
  (label key), **on the same element**. In edit mode the link is never followed;
  clicking it opens one popover that edits **both** the label and the URL. Plain
  (non-link) text uses inline editing. This is the one deliberate exception to
  “`data-edit` = inline”: link labels are edited in the link popover, not
  inline, to avoid a click clash.
- **Never** put `data-edit` (or `data-edit-item`) on a *descendant* of a
  `data-edit-href` element — only on the `data-edit-href` element itself. Click
  delegation resolves the nearest `[data-edit-href]` ancestor before it ever
  considers `[data-edit]`/`[data-edit-item]` (see edit-mode.ts `onClick`), so a
  `data-edit` nested inside a `data-edit-href` ancestor is unreachable: every
  click on it is swallowed by the link's popover instead. If a link's visible
  label is exactly the editable text, put both attributes on the `<a>` (previous
  bullet) — `openLinkEditor()` reads the label via `c(labelKey)`, not
  `textContent`, so non-text siblings (e.g. an icon `<svg>`) inside the `<a>`
  don't break this. If unrelated editable fields must sit visually inside what
  looks like a link (e.g. a card with several independent fields plus a
  profile-link), don't wrap them all in one `<a>` — scope the link to just the
  linking affordance (e.g. an avatar) and keep the fields as siblings.

### Markup examples (before → after)

**Heading**

```svelte
<!-- before -->
<h1 class="...">Rama Herbin</h1>
<!-- after -->
<h1 class="..." data-edit="home.hero.title">{c("home.hero.title")}</h1>
```

**Paragraph with an inline editable link** (split around the link)

```svelte
<!-- before -->
<p>working at <a href="https://www.ansys.com">Ansys®</a> — part of Synopsys Inc.</p>
<!-- after -->
<p>
  <span data-edit="home.hero.working-at">{c("home.hero.working-at")}</span>
  <a
    href={c("home.hero.ansys.href")}
    data-edit="home.hero.ansys.label"
    data-edit-href="home.hero.ansys.href"
  >{c("home.hero.ansys.label")}</a>
  <span data-edit="home.hero.company-part">{c("home.hero.company-part")}</span>
  <span data-edit="home.hero.parent-company">{c("home.hero.parent-company")}</span>
</p>
```

**Tags row**

```svelte
<!-- before -->
<div class="flex gap-2">
  {#each ["Svelte","Tailwind"] as t}<Tag>{t}</Tag>{/each}
</div>
<!-- after -->
<div class="flex gap-2" data-edit-list="personal.card-fancyui.tags">
  {#each cList("personal.card-fancyui.tags") as t, i}
    <Tag data-edit-item={i}>{t}</Tag>
  {/each}
</div>
```

> If `<Tag>` is a component, `data-edit-item` must reach a DOM element — forward the
> attribute to the rendered pill (`{...rest}`) or wrap the pill in a `<span
> data-edit-item={i}>`. The container `data-edit-list` must be a real DOM element.

**Editable link (URL only)**

```svelte
<a href={c("shared.carbon.link.href")} data-edit-href="shared.carbon.link.href">
  {c("shared.carbon.link.label")}
</a>
```

---

## 4. Edit-runtime activation

Edit mode is **dev-build only**, gated on `import.meta.env.DEV` (a build-time
constant). In a production build (`vite build`, what ships to rama.app) the
whole activation branch — including the dynamic imports — is dead code the
bundler strips, so the deployed site cannot be driven into edit mode by an
attacker-supplied `?edit=1&studioOrigin=<their origin>`. The studio only ever
points at the local portfolio dev server anyway (§9).

Within a dev build, edit mode activates when the URL has:

```
?edit=1&studioOrigin=<origin>
```

where `<origin>` parses as a valid `http:`/`https:` origin (validated with `new
URL`, normalised to `u.origin`). Anything else → no activation, zero editor code.

Wiring (in `apps/main/src/routes/+layout.svelte`, `onMount`, client-only):

1. If not `import.meta.env.DEV` → return (production build never proceeds past
   here).
2. Dynamically `import("$lib/content/edit-mode.js")`, call `parseEditParams(url)`.
3. If params found → also `sessionStorage.setItem("portfolio-edit-studio-origin",
   studioOrigin)`. If not found, fall back to that sessionStorage key (parsed
   the same way params would be) before giving up. This covers a reload of a
   URL that lost the query string during SvelteKit client-side navigation to an
   internal link (the root layout persists across that navigation and doesn't
   need the fallback, but a hard reload of the resulting sub-page URL does).
4. If still null → return (normal site).
5. Else dynamically `import("$lib/content/EditOverlay.svelte")` and mount it with
   the validated `studioOrigin`.

Because both imports are dynamic and inside `onMount`, normal visitors never
download the editor chunk, and production builds never reference it at all.
Re-runs on every load ⇒ the handshake re-fires after HMR.

---

## 5. postMessage protocol

All messages are origin-checked on **both** sides. The child (portfolio) posts only
to `studioOrigin`; the parent (studio) accepts only `event.origin === <portfolio
origin>`.

```ts
// child → parent
interface PortfolioEditReadyMsg   { type: "portfolio:edit-ready"; }
interface PortfolioContentEditMsg { type: "portfolio:content-edit"; key: string; value: string | string[]; }
type PortfolioMessage = PortfolioEditReadyMsg | PortfolioContentEditMsg;

// parent → child
interface StudioEditInitMsg { type: "studio:edit-init"; }
type StudioMessage = StudioEditInitMsg;
```

Handshake + flow (bounded — must terminate, never an unconditional reply loop):

1. On activation the child posts `{ type: "portfolio:edit-ready" }` to `studioOrigin`,
   then retries on a 500ms interval (child-side only, up to 20 attempts / ~10s)
   until acknowledged. This covers the parent's message listener not being
   registered yet when the first `ready` is sent (e.g. right after HMR).
2. The parent acks **once per connection**: on the *first* `edit-ready` it sees
   while not already `connected`, it flips to `connected` and replies
   `{ type: "studio:edit-init" }` (origin = portfolio origin). Further `ready`
   messages while already `connected` are no-ops on the parent side — it must
   **not** reply to every `ready` unconditionally, or the two sides ping-pong
   `ready`/`init` forever.
3. The child stops retrying on the *first* `studio:edit-init` it receives
   (`acked` latch) and ignores any further inits — also idempotent, so a
   redundant init from the parent can never restart the loop.
4. If the iframe document reloads (a real navigation/reload, not a SvelteKit
   client-side route change), the parent resets to `waiting` on the iframe's
   `load` event so the next connection's first `ready` is acked instead of
   being ignored as a stale duplicate.
5. On every **committed** edit the child posts
   `{ type: "portfolio:content-edit", key, value }`:
   - text / label edit → `value: string`
   - tag-list edit (add / edit / remove a pill) → `value: string[]` (the **full**
     updated array every time)
   - link URL edit → `value: string`; a link popover that changes both label and
     URL posts **two** messages (label key, then URL key).

The child also `applyLocal(key, value)` on each commit for optimistic in-iframe
rendering. Transient states are never posted (e.g. adding a pill applies locally
only; the array is posted when the new pill is committed).

---

## 6. Interaction semantics (what the runtime does)

- **Hover**: subtle `1px dashed` outline + `cursor:text` on `[data-edit]`/
  `[data-edit-item]`, `cursor:pointer` on `[data-edit-href]`. Injected stylesheet
  scoped to `body.content-edit-active`; removed on teardown.
- **Text (`data-edit`)**: click → `contenteditable="plaintext-only"` (falls back to
  `contenteditable="true"` on browsers without `plaintext-only` support, e.g.
  Firefox < 136 — same paste-forced-to-plain-text handling either way), focus,
  caret at end (mirrors the studio `InlineTextEditor`). **Enter** commits
  everywhere (every `data-edit`/`data-edit-item` field is a single-line content
  string; a literal newline is stripped before commit as a defensive backstop);
  **blur** commits everywhere; **Escape** reverts. Paste is forced to plain text.
  Commit posts `content-edit` + `applyLocal` (only if changed).
- **Tag list (`data-edit-list`)**: click a pill (`data-edit-item`) → inline edit its
  text. A trailing **“+”** chip (injected in edit mode only) appends an empty pill in
  edit state. Emptying a pill removes it. Every commit posts the **full** array.
  Chip injection is re-run via a `MutationObserver` on `document.body` (not just
  once at session creation), so `[data-edit-list]` containers that appear after
  a SvelteKit client-side navigation — the root layout persists across routes,
  so the edit session is never re-created — still get a chip.
- **Link (`data-edit-href`)**: click is intercepted (`preventDefault`; no navigation
  in edit mode). A minimal fixed popover opens (URL input prefilled with the current
  href, plus a Text input when the `<a>` also has `data-edit`) → OK commits, Cancel
  discards.
- All listeners are cleaned up on teardown; injected chips + stylesheet + body class
  are removed. A single edit is active at a time; starting another commits the first.

---

## 7. Hero worked example (reference conversion)

`apps/main/src/lib/portfolio/sections/Hero.svelte` is the canonical converted
section. `home.hero.*` keys in `site-content.json`:

```
home.hero.title           "Rama Herbin"
home.hero.role            "Front-End & UI Engineer"
home.hero.working-at      "working at"
home.hero.ansys.label     "Ansys®"          (link label)
home.hero.ansys.href      "https://www.ansys.com"  (link URL, data-edit-href)
home.hero.company-part    "— part of"
home.hero.parent-company  "Synopsys Inc."
home.hero.tagline         "A simulation-driven company™"
home.hero.badge.version   "v1.0.0-alpha"
home.hero.cta             "Explore"
```

Notes reusable by extraction agents:
- The paragraph is split into separate string keys around the Ansys link.
- The Ansys `<a>` carries both `data-edit` (label) and `data-edit-href` (URL).
- The `RainbowButton` label lives in an inner `<span data-edit="home.hero.cta">` so
  the edit target is a real DOM element inside the component.

`shared.*` keys are **defined** in `site-content.json` by arch-core but the shared
components (NavAnchor / Footer / CarbonNeutralBadge / made-with-FancyUI) are
converted by the home-extraction agent, not arch-core:

```
shared.nav.title                 "DevFolio 2k25"
shared.footer.copyright          "Rama Herbin. All rights reserved."   (rendered as: © {year} {copyright})
shared.footer.made-with.text     "Made with"
shared.footer.made-with.highlight "FancyUI"
shared.footer.made-with.href     "https://fancy-ui.rama.app/"
shared.carbon.label              "Carbon footprint"
shared.carbon.status             "neutral"
shared.carbon.link.label         "Learn more"
shared.carbon.link.href          "/carbon"
```

> The footer copyright keeps the year dynamic in the component
> (`© {new Date().getFullYear()} {c("shared.footer.copyright")}`); only the text is
> content.

---

## 8. Partial-files rule (extraction agents)

Extraction agents **must not** touch `content/site-content.json`. They write their
extracted keys to flat partial files, same format (`key → string | string[]`):

- `apps/main/content/partial-home.json` — home page + `shared.*` conversions.
- `apps/main/content/partial-pages.json` — the case-study / detail / personal pages.

The orchestrator later merges the partials into `site-content.json`. Keys must be
unique across partials and not collide with keys arch-core already defined
(`shared.*`, `home.hero.*`). If a shared/hero key already exists, reuse it — do not
redefine.

---

## 9. Ports & env

- **Portfolio dev server**: fixed at **5180** (`server.port: 5180` + `strictPort:
  true` in `apps/main/vite.config.ts`).
- **Studio side** reads:
  - `PORTFOLIO_URL` — default `http://localhost:5180`.
  - `PORTFOLIO_REPO_PATH` — default `/Users/ramaherbin/Documents/dev-perso/photo-rama`.

The studio embeds `${PORTFOLIO_URL}/?edit=1&studioOrigin=<studio origin>` in its
editor iframe and passes its own origin as `studioOrigin`.
