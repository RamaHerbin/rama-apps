/**
 * apps/main/scripts/generate-icons.ts
 *
 * Renders every raster icon and the Open Graph card for rama.app from one
 * vector source of truth: the ® mark defined by RING_PATH + GLYPH_PATH below.
 * Mirrors the style of apps/photo/scripts/* and ./optimize-videos.ts — a plain
 * tsx script, no framework.
 *
 *   pnpm --filter main icons
 *   pnpm --filter main icons --dry-run     # render + report, write nothing
 *
 * NOT wired into `build`. Icons change roughly never; a designer running this
 * by hand and committing the output is the correct cadence, and keeping sharp
 * off the build path keeps the Vercel build lean.
 *
 * Writes into static/:
 *   favicon.svg              the committed vector mark (TILE art, below)
 *   favicon.ico              16 / 32 / 48 PNG payloads in a hand-built container
 *   apple-touch-icon.png     180x180, FULL-BLEED art, opaque (iOS masks it itself)
 *   icon-192.png             192x192, tile art
 *   icon-512.png             512x512, tile art
 *   icon-maskable-192.png    192x192, maskable art
 *   icon-maskable-512.png    512x512, maskable art
 *   og-image.png             1200x630
 *
 * Idempotent: sharp's PNG encoder is byte-deterministic, and the maskable scale
 * search is a deterministic descent, so re-running leaves `git status` clean.
 */

import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

// --- Brand constants --------------------------------------------------------
// Shared with the hdr sibling icon by construction (64 viewBox, rx 15 tile, the
// inset hairline, gradient-driven ink); only the chroma differs.

const TILE_BG = "#0a0a0a"; // apps/main --background, dark. oklch(0.145 0 0).
const INK_HI = "#ffffff";
const INK_MID = "#f2ebdd";
const INK_LO = "#e3d9bf"; // --accent-work, dark
const HAIRLINE = "#ffffff";
const HAIRLINE_OPACITY = 0.12;

const TITLE = "Rama Herbin — Front-End &amp; UI Engineer";

/**
 * The ring. Outer r 27.5, inner r 22 → a 5.5-unit wall, 1.37px at 16px, which
 * is above the antialiasing floor where thin rings dissolve into grey.
 * Two subpaths + fill-rule="evenodd" so it stays ONE filled shape.
 */
const RING_PATH =
	"M4.5 32a27.5 27.5 0 1 0 55 0a27.5 27.5 0 1 0-55 0ZM10 32a22 22 0 1 1 44 0a22 22 0 1 1-44 0Z";

/**
 * The R, redrawn as geometry (never <text> — an SVG favicon's <text> renders in
 * whatever font the UA picks, and is unusable when librsvg rasterizes it for
 * the .ico). Box x 21..43, y 19..45. 6-unit stem, 5-unit bars, and a 10.5 x 8
 * RECTANGULAR slot counter — 2.6 x 2.0px at 16px. A conventional round tight
 * counter measures ~0.5px there and fills in solid. The leg is a flat-footed
 * wedge springing clear of the stem so the two never merge into a blob.
 */
const GLYPH_PATH = "M21 19H37A6 6 0 0 1 43 25V31A6 6 0 0 1 37 37L43 45H36.5L30.5 37H27V45H21ZM27 24H37.5V32H27Z";

/** Ink gradient, locked to the 64-unit mark space so both shapes read as one glyph. */
const INK_GRADIENT = `<linearGradient id="ink" gradientUnits="userSpaceOnUse" x1="10" y1="6" x2="54" y2="58">
			<stop offset="0" stop-color="${INK_HI}" />
			<stop offset="0.55" stop-color="${INK_MID}" />
			<stop offset="1" stop-color="${INK_LO}" />
		</linearGradient>`;

// --- The three SVG templates ------------------------------------------------

/**
 * TILE art — the committed favicon.svg, and the source for icon-192/512.
 * Rounded tile + inset hairline, mark at scale 1.0.
 */
function tileSvg(): string {
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
	<title>${TITLE}</title>
	<defs>
		${INK_GRADIENT}
	</defs>

	<rect width="64" height="64" rx="15" fill="${TILE_BG}" />
	<rect x="0.5" y="0.5" width="63" height="63" rx="14.5" fill="none" stroke="${HAIRLINE}" stroke-opacity="${HAIRLINE_OPACITY}" />

	<!-- Registered-trademark ring. Outer r 27.5, inner r 22 — a 5.5-unit wall,
	     1.37px at 16px, comfortably above the antialiasing floor. -->
	<path fill="url(#ink)" fill-rule="evenodd" d="${RING_PATH}" />

	<!-- The R, redrawn as geometry rather than type: 6-unit stem, 5-unit bars, and a
	     10.5 x 8 rectangular slot counter (2.6 x 2.0px at 16px) instead of the fine
	     round counter of the system glyph, which fills in solid below 20px. The leg
	     is a flat-footed wedge held clear of the stem so the two never merge. -->
	<path fill="url(#ink)" fill-rule="evenodd" d="${GLYPH_PATH}" />
</svg>
`;
}

/**
 * FULL-BLEED art — apple-touch-icon only. No rx, no hairline: iOS applies its
 * own superellipse mask, and a rounded PNG under that mask shows a dark halo.
 * Opaque, because iOS composites Home Screen icons over white.
 */
function fullBleedSvg(): string {
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
	<defs>${INK_GRADIENT}</defs>
	<rect width="64" height="64" fill="${TILE_BG}" />
	<path fill="url(#ink)" fill-rule="evenodd" d="${RING_PATH}" />
	<path fill="url(#ink)" fill-rule="evenodd" d="${GLYPH_PATH}" />
</svg>
`;
}

/**
 * MASKABLE art — no rx, no hairline, mark scaled about the centre so it survives
 * any Android mask. The gradient is userSpaceOnUse inside the transformed group,
 * so it scales with the mark instead of drifting.
 */
function maskableSvg(scale: number): string {
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
	<defs>${INK_GRADIENT}</defs>
	<rect width="64" height="64" fill="${TILE_BG}" />
	<g transform="translate(32 32) scale(${scale}) translate(-32 -32)">
		<path fill="url(#ink)" fill-rule="evenodd" d="${RING_PATH}" />
		<path fill="url(#ink)" fill-rule="evenodd" d="${GLYPH_PATH}" />
	</g>
</svg>
`;
}

// --- Open Graph -------------------------------------------------------------

const OG_W = 1200;
const OG_H = 630;

/** 2:1 crops (Twitter) keep the centred 1200x600 band; keep content well inside. */
const OG_CROP_TOP = 72;
const OG_CROP_BOTTOM = 546;
const OG_X = 80;

const FONT = "Bricolage Grotesque";
/** A family that cannot exist, for the silent-fallback preflight. */
const FONT_SENTINEL = "Zzz No Such Family 8f3a";

interface OgVariant {
	file: string;
	eyebrow: string;
	name: string;
	role: string;
	meta: string;
}

/** One row today. The array exists so adding a per-route card later is a one-liner. */
const OG_VARIANTS: OgVariant[] = [
	{
		file: "og-image.png",
		eyebrow: "RAMA.APP",
		name: "Rama Herbin",
		role: "Front-End &amp; UI Engineer",
		// NBSPs: librsvg collapses runs of ordinary spaces, which would eat the
		// double spacing around the middle dots.
		meta: "LYON, FRANCE  ·  ANSYS / SYNOPSYS  ·  GOBELINS PARIS"
	}
];

const OG_NAME_SIZE = 104;
const OG_ROLE_SIZE = 42;
const OG_EYEBROW_SIZE = 22;
const OG_META_SIZE = 22;
const OG_META_TRACKING = 2.2;

function ogSvg(v: OgVariant, family = FONT): string {
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${OG_W} ${OG_H}" width="${OG_W}" height="${OG_H}">
	<defs>
		${INK_GRADIENT}
		<linearGradient id="ogInk" gradientUnits="userSpaceOnUse" x1="${OG_X}" y1="250" x2="820" y2="430">
			<stop offset="0" stop-color="${INK_HI}" />
			<stop offset="0.55" stop-color="${INK_MID}" />
			<stop offset="1" stop-color="${INK_LO}" />
		</linearGradient>
		<radialGradient id="glowA" gradientUnits="userSpaceOnUse" cx="300" cy="170" r="440">
			<stop offset="0" stop-color="${INK_MID}" stop-opacity="0.10" />
			<stop offset="1" stop-color="${INK_MID}" stop-opacity="0" />
		</radialGradient>
		<radialGradient id="glowB" gradientUnits="userSpaceOnUse" cx="1060" cy="530" r="520">
			<stop offset="0" stop-color="${INK_LO}" stop-opacity="0.07" />
			<stop offset="1" stop-color="${INK_LO}" stop-opacity="0" />
		</radialGradient>
	</defs>

	<rect width="${OG_W}" height="${OG_H}" fill="${TILE_BG}" />

	<!-- A ~9.4x ghost of the mark, bleeding off the right edge. A left-aligned
	     editorial layout leaves a large void there; this fills it without
	     competing with the type. -->
	<g opacity="0.05" transform="translate(819.2 14.2) scale(9.4)">
		<path fill="url(#ink)" fill-rule="evenodd" d="${RING_PATH}" />
		<path fill="url(#ink)" fill-rule="evenodd" d="${GLYPH_PATH}" />
	</g>

	<rect width="${OG_W}" height="${OG_H}" fill="url(#glowA)" />
	<rect width="${OG_W}" height="${OG_H}" fill="url(#glowB)" />

	<!-- The inset hairline, scaled up from the 64-unit tile: 32px inset, rx 28. -->
	<rect x="32" y="32" width="${OG_W - 64}" height="${OG_H - 64}" rx="28" fill="none" stroke="${HAIRLINE}" stroke-opacity="${HAIRLINE_OPACITY}" stroke-width="1.5" />

	<!-- The tile itself at 104px, anchoring the lockup. -->
	<g transform="translate(${OG_X} ${OG_CROP_TOP}) scale(1.625)">
		<rect width="64" height="64" rx="15" fill="${TILE_BG}" />
		<rect x="0.5" y="0.5" width="63" height="63" rx="14.5" fill="none" stroke="${HAIRLINE}" stroke-opacity="0.24" />
		<path fill="url(#ink)" fill-rule="evenodd" d="${RING_PATH}" />
		<path fill="url(#ink)" fill-rule="evenodd" d="${GLYPH_PATH}" />
	</g>

	<text x="${OG_X}" y="232" font-family="${family}" font-size="${OG_EYEBROW_SIZE}" font-weight="600" letter-spacing="6.5" fill="${INK_LO}" fill-opacity="0.75">${v.eyebrow}</text>

	<text x="${OG_X}" y="338" font-family="${family}" font-size="${OG_NAME_SIZE}" font-weight="800" fill="url(#ogInk)">${v.name}</text>

	<text x="${OG_X}" y="398" font-family="${family}" font-size="${OG_ROLE_SIZE}" font-weight="500" fill="${INK_MID}" fill-opacity="0.82">${v.role}</text>

	<rect x="${OG_X}" y="450" width="120" height="2" fill="${INK_LO}" fill-opacity="0.5" />

	<text x="${OG_X}" y="508" font-family="${family}" font-size="${OG_META_SIZE}" font-weight="600" letter-spacing="${OG_META_TRACKING}" fill="${INK_LO}" fill-opacity="0.62">${v.meta}</text>
</svg>
`;
}

// --- Rendering primitives ---------------------------------------------------

/** Every PNG goes through here. No palette (measured: costs bytes, bands the OG). */
function encodePng(svg: string, w: number, h: number): Promise<Buffer> {
	// .resize() is mandatory: without it a viewBox="0 0 64 64" SVG rasterizes at 64x64.
	return sharp(Buffer.from(svg)).resize(w, h).png({ compressionLevel: 9, effort: 10 }).toBuffer();
}

/** Trimmed pixel width of a string rendered in `family`. Used by the preflight and the crop report. */
async function measureText(text: string, family: string, size: number, weight = 400, tracking = 0): Promise<number> {
	const probe = `<svg xmlns="http://www.w3.org/2000/svg" width="2400" height="300" viewBox="0 0 2400 300">
	<text x="20" y="200" font-family="${family}" font-size="${size}" font-weight="${weight}" letter-spacing="${tracking}" fill="#ffffff">${text}</text>
</svg>`;
	const { info } = await sharp(Buffer.from(probe)).trim({ threshold: 8 }).toBuffer({ resolveWithObject: true });
	return info.width;
}

/**
 * FONT PREFLIGHT. librsvg falls back to Helvetica SILENTLY when a family is
 * missing, so a broken font ships as a plausible-looking wrong OG image.
 * Render the same string under the real family and an impossible one: equal
 * widths mean nothing resolved and we must abort.
 */
async function preflightFont(): Promise<void> {
	// Already XML-escaped: measureText splices straight into an SVG document.
	const probe = "Rama Herbin — Front-End &amp; UI Engineer";
	const real = await measureText(probe, FONT, 96, 800);
	const bogus = await measureText(probe, FONT_SENTINEL, 96, 800);
	console.log(`font preflight: "${FONT}" ${real}px vs sentinel ${bogus}px`);
	if (real === bogus) {
		throw new Error(
			`Font preflight FAILED: "${FONT}" did not resolve — librsvg fell back to the default face.\n` +
				`Install it (Google Fonts → Bricolage Grotesque) to ~/Library/Fonts/ and re-run:\n` +
				`  ~/Library/Fonts/BricolageGrotesque-VariableFont_opsz,wdth,wght.ttf`
		);
	}
}

// --- Maskable safe zone -----------------------------------------------------

/**
 * Android's contract: content must survive any mask that contains the centred
 * circle of diameter 80% of the icon, i.e. r_safe = 0.40 * size.
 */
const MASKABLE_PROBE = 512;
const R_SAFE = 0.4 * MASKABLE_PROBE; // 204.8px
const MASKABLE_SCALE_START = 0.87;
const MASKABLE_SCALE_STEP = 0.01;
/** Target band for maxRadius / r_safe. Below ~0.55 the mark looks lost inside the disc. */
const MASKABLE_RATIO_MAX = 0.62;
const MASKABLE_RATIO_MIN = 0.55;

/** Farthest ink pixel from the centre, in px. Ink = luminance > 32 (the #0a0a0a ground is 10). */
async function maxInkRadius(svg: string, size: number): Promise<number> {
	const { data, info } = await sharp(Buffer.from(svg))
		.resize(size, size)
		.removeAlpha()
		.raw()
		.toBuffer({ resolveWithObject: true });
	const c = size / 2;
	let maxR = 0;
	for (let y = 0; y < info.height; y++) {
		for (let x = 0; x < info.width; x++) {
			const i = (y * info.width + x) * info.channels;
			const lum = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
			if (lum <= 32) continue;
			// Measure to the pixel's far corner, so a partially-covered edge pixel still counts.
			const dx = Math.max(Math.abs(x - c), Math.abs(x + 1 - c));
			const dy = Math.max(Math.abs(y - c), Math.abs(y + 1 - c));
			const r = Math.hypot(dx, dy);
			if (r > maxR) maxR = r;
		}
	}
	return maxR;
}

/** Descends from MASKABLE_SCALE_START until the measured ink fits the target band. */
async function solveMaskableScale(): Promise<{ scale: number; maxR: number; ratio: number }> {
	for (let scale = MASKABLE_SCALE_START; scale > 0.2; scale -= MASKABLE_SCALE_STEP) {
		const s = Number(scale.toFixed(4));
		const maxR = await maxInkRadius(maskableSvg(s), MASKABLE_PROBE);
		const ratio = maxR / R_SAFE;
		if (ratio <= MASKABLE_RATIO_MAX) {
			if (ratio < MASKABLE_RATIO_MIN) {
				throw new Error(`Maskable scale search overshot: ratio ${ratio.toFixed(3)} < ${MASKABLE_RATIO_MIN}`);
			}
			if (maxR > R_SAFE) {
				throw new Error(`Maskable ink escapes the safe zone: ${maxR.toFixed(1)}px > ${R_SAFE}px`);
			}
			return { scale: s, maxR, ratio };
		}
	}
	throw new Error("Maskable scale search failed to converge.");
}

// --- ICO container ----------------------------------------------------------

const ICO_SIZES = [16, 32, 48]; // 48 because Google Search's favicon crawler prefers multiples of 48.

/** ICONDIR + one ICONDIRENTRY per image + concatenated PNG payloads. sharp has no ICO encoder. */
function buildIco(images: Buffer[], sizes: number[]): Buffer {
	const dir = Buffer.alloc(6);
	dir.writeUInt16LE(0, 0); // reserved
	dir.writeUInt16LE(1, 2); // type: 1 = icon
	dir.writeUInt16LE(images.length, 4); // count

	const entries = Buffer.alloc(16 * images.length);
	let offset = 6 + 16 * images.length;
	images.forEach((png, i) => {
		const at = i * 16;
		entries.writeUInt8(sizes[i] >= 256 ? 0 : sizes[i], at); // 0 means 256
		entries.writeUInt8(sizes[i] >= 256 ? 0 : sizes[i], at + 1);
		entries.writeUInt8(0, at + 2); // colorCount (0 = truecolour)
		entries.writeUInt8(0, at + 3); // reserved
		entries.writeUInt16LE(1, at + 4); // colour planes
		entries.writeUInt16LE(32, at + 6); // bits per pixel
		entries.writeUInt32LE(png.length, at + 8); // bytesInRes
		entries.writeUInt32LE(offset, at + 12); // imageOffset
		offset += png.length;
	});

	return Buffer.concat([dir, entries, ...images]);
}

/** Reads back our own container and decodes every payload, proving each entry is real. */
async function verifyIco(file: string): Promise<void> {
	const buf = await fs.readFile(file);
	if (buf.readUInt16LE(0) !== 0 || buf.readUInt16LE(2) !== 1) throw new Error(`${file}: not an ICO`);
	const count = buf.readUInt16LE(4);
	console.log(`  round-trip: ICONDIR count=${count}`);
	for (let i = 0; i < count; i++) {
		const at = 6 + i * 16;
		const declared = buf.readUInt8(at) || 256;
		const bytes = buf.readUInt32LE(at + 8);
		const start = buf.readUInt32LE(at + 12);
		if (start + bytes > buf.length) throw new Error(`${file}: entry ${i} runs past EOF`);
		const meta = await sharp(buf.subarray(start, start + bytes)).metadata();
		if (meta.width !== declared || meta.height !== declared) {
			throw new Error(`${file}: entry ${i} declares ${declared} but decodes ${meta.width}x${meta.height}`);
		}
		console.log(
			`  round-trip: entry ${i} declared ${declared} → ${meta.format} ${meta.width}x${meta.height}, ${bytes} B at offset ${start}`
		);
	}
}

// --- Output -----------------------------------------------------------------

interface Written {
	name: string;
	bytes: number;
}

async function main(): Promise<void> {
	const dryRun = process.argv.slice(2).includes("--dry-run");
	const staticDir = path.resolve(import.meta.dirname, "../static");
	const written: Written[] = [];

	async function emit(name: string, data: Buffer | string): Promise<void> {
		const buf = typeof data === "string" ? Buffer.from(data) : data;
		if (!dryRun) await fs.writeFile(path.join(staticDir, name), buf);
		written.push({ name, bytes: buf.length });
		console.log(`  ${name}: ${buf.length} B`);
	}

	console.log(dryRun ? "generate-icons (--dry-run, writing nothing)\n" : "generate-icons\n");

	await preflightFont();

	console.log("\nmaskable safe zone");
	const mask = await solveMaskableScale();
	console.log(
		`  scale ${mask.scale} → max ink radius ${mask.maxR.toFixed(1)}px of r_safe ${R_SAFE}px ` +
			`(${(mask.ratio * 100).toFixed(1)}% — the mark fills that share of the guaranteed-visible disc)`
	);

	const tile = tileSvg();
	const fullBleed = fullBleedSvg();
	const maskable = maskableSvg(mask.scale);

	console.log("\nassets");
	await emit("favicon.svg", tile);

	const icoPngs = await Promise.all(ICO_SIZES.map((s) => encodePng(tile, s, s)));
	await emit("favicon.ico", buildIco(icoPngs, ICO_SIZES));

	await emit("apple-touch-icon.png", await encodePng(fullBleed, 180, 180));
	await emit("icon-192.png", await encodePng(tile, 192, 192));
	await emit("icon-512.png", await encodePng(tile, 512, 512));
	await emit("icon-maskable-192.png", await encodePng(maskable, 192, 192));
	await emit("icon-maskable-512.png", await encodePng(maskable, 512, 512));

	for (const v of OG_VARIANTS) {
		await emit(v.file, await encodePng(ogSvg(v), OG_W, OG_H));
	}

	if (!dryRun) {
		console.log("\nico verification");
		await verifyIco(path.join(staticDir, "favicon.ico"));
	}

	// Crop safety: 2:1 crops keep the centred 1200x600 band, so everything must
	// sit inside y 72..546, and stay clear of the right edge too.
	console.log("\nog crop safety");
	for (const v of OG_VARIANTS) {
		const name = await measureText(v.name, FONT, OG_NAME_SIZE, 800);
		const role = await measureText(v.role, FONT, OG_ROLE_SIZE, 500);
		const meta = await measureText(v.meta, FONT, OG_META_SIZE, 600, OG_META_TRACKING);
		const widest = Math.max(name, role, meta);
		console.log(`  ${v.file}: name ${name}px, role ${role}px, meta ${meta}px → right edge x=${OG_X + widest}`);
		console.log(`  ${v.file}: content band y ${OG_CROP_TOP}..515 (limit ${OG_CROP_BOTTOM})`);
		if (OG_X + widest > 900) {
			throw new Error(`${v.file}: text runs to x=${OG_X + widest}, too close to the 1200px edge`);
		}
	}

	const total = written.reduce((n, w) => n + w.bytes, 0);
	console.log(`\ntotal: ${total} B (${(total / 1024).toFixed(1)} KiB) across ${written.length} files`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
