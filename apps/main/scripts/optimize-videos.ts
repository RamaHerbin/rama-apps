/**
 * apps/main/scripts/optimize-videos.ts
 *
 * Encodes the Fleur de Papier case-study source recordings into web-ready
 * clips. Mirrors the style of apps/photo/scripts/* (plain tsx script, no
 * framework). tsx is NOT a dependency of apps/main — run it via the tsx
 * binary from apps/photo, or `npx tsx` / `pnpm dlx tsx` if you have network
 * access:
 *
 *   npx tsx apps/main/scripts/optimize-videos.ts
 *   npx tsx apps/main/scripts/optimize-videos.ts --only bnf-richelieu,terre-adelice
 *   npx tsx apps/main/scripts/optimize-videos.ts --map path/to/video-map.json
 *
 *   # Ad-hoc single-frame grab (e.g. FIG. a/b/c stills for a detail page):
 *   npx tsx apps/main/scripts/optimize-videos.ts --still "/abs/source.mov" \
 *     --at 27.3 --out static/videos/fleur-de-papier/bnf-richelieu-fig-a.jpg
 *
 * Mapping file shape (default: <repo-root>/design-refs/video-map.json):
 *   { sourceDir: string, outputDir: string, videos: [{ file, slug,
 *     duration_s, posterHintPct, ... }] }
 *
 * For each mapping entry, writes into <outputDir>/:
 *   <slug>.webm          libvpx-vp9, crf ~36 -b:v 0, -row-mt 1 -cpu-used 4,
 *                        fps capped at 30, width capped at 1920, no audio
 *   <slug>.mp4           libx264 crf ~26 preset medium, +faststart, same
 *                        scale/fps, no audio
 *   <slug>-poster.jpg    single frame at duration_s * posterHintPct / 100,
 *                        q ~4, width capped at 1920
 *
 * HARD LIMIT: every output file must stay under 20 MiB (Cloudflare Workers'
 * asset cap is 25 MiB). If an encode comes out too big, the script
 * automatically re-encodes at a higher CRF and, if still too big, at a
 * narrower (1280px) width.
 *
 * Source .mov files are read-only inputs — never modified, uploaded, moved,
 * or referenced anywhere except as ffmpeg input (*.mov is git-ignored).
 */

import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const FFMPEG = process.env.FFMPEG_BIN ?? "/opt/homebrew/bin/ffmpeg";
const FFPROBE = process.env.FFPROBE_BIN ?? "/opt/homebrew/bin/ffprobe";

const MAX_BYTES = 20 * 1024 * 1024; // stay safely under Cloudflare Workers' 25 MiB asset cap
const MAX_WIDTH = 1920;
const FALLBACK_WIDTH = 1280;
const MAX_FPS = 30;

interface VideoMapEntry {
	file: string;
	slug: string;
	duration_s: number;
	posterHintPct: number;
	[key: string]: unknown;
}

interface VideoMap {
	sourceDir: string;
	outputDir: string;
	videos: VideoMapEntry[];
}

function repoRoot(): string {
	// apps/main/scripts -> apps/main -> apps -> <repo root>
	return path.resolve(import.meta.dirname, "../../..");
}

async function fileSize(p: string): Promise<number> {
	const stat = await fs.stat(p);
	return stat.size;
}

async function probeFps(input: string): Promise<number> {
	const { stdout } = await execFileAsync(FFPROBE, [
		"-v",
		"error",
		"-select_streams",
		"v:0",
		"-show_entries",
		"stream=r_frame_rate",
		"-of",
		"csv=p=0",
		input
	]);
	const [num, den] = stdout.trim().split("/").map(Number);
	if (!den) return num;
	return num / den;
}

function scaleFilter(width: number): string {
	// Keep aspect ratio, cap width, force an even height (required by yuv420p / vp9).
	return `scale='min(${width},iw)':-2`;
}

async function buildVideoFilter(input: string, width: number): Promise<string> {
	const fps = await probeFps(input);
	const parts = [scaleFilter(width)];
	// Only cap fps down — never upsample a slower source (would bloat the file for nothing).
	if (fps > MAX_FPS) parts.push(`fps=${MAX_FPS}`);
	return parts.join(",");
}

async function runFfmpeg(args: string[]): Promise<void> {
	await execFileAsync(FFMPEG, ["-y", ...args], { maxBuffer: 1024 * 1024 * 64 });
}

async function encodeWebm(input: string, out: string, width: number, crf: number): Promise<void> {
	const vf = await buildVideoFilter(input, width);
	await runFfmpeg([
		"-i",
		input,
		"-vf",
		vf,
		"-c:v",
		"libvpx-vp9",
		"-crf",
		String(crf),
		"-b:v",
		"0",
		"-row-mt",
		"1",
		"-cpu-used",
		"4",
		"-an",
		out
	]);
}

async function encodeMp4(input: string, out: string, width: number, crf: number): Promise<void> {
	const vf = await buildVideoFilter(input, width);
	await runFfmpeg([
		"-i",
		input,
		"-vf",
		vf,
		"-c:v",
		"libx264",
		"-crf",
		String(crf),
		"-preset",
		"medium",
		"-pix_fmt",
		"yuv420p",
		"-movflags",
		"+faststart",
		"-an",
		out
	]);
}

async function extractStill(
	input: string,
	atSeconds: number,
	out: string,
	width = MAX_WIDTH
): Promise<void> {
	await runFfmpeg([
		"-ss",
		Math.max(0, atSeconds).toFixed(2),
		"-i",
		input,
		"-frames:v",
		"1",
		"-q:v",
		"4",
		"-vf",
		scaleFilter(width),
		out
	]);
}

/** Re-encodes at escalating crf/width until the output fits under MAX_BYTES. */
async function encodeUnderCap(
	label: string,
	encode: (out: string, width: number, crf: number) => Promise<void>,
	out: string,
	baseCrf: number
): Promise<void> {
	const attempts: Array<{ width: number; crf: number }> = [
		{ width: MAX_WIDTH, crf: baseCrf },
		{ width: MAX_WIDTH, crf: baseCrf + 6 },
		{ width: FALLBACK_WIDTH, crf: baseCrf + 6 },
		{ width: FALLBACK_WIDTH, crf: baseCrf + 12 }
	];

	for (let i = 0; i < attempts.length; i++) {
		const attempt = attempts[i];
		await encode(out, attempt.width, attempt.crf);
		const bytes = await fileSize(out);
		const mib = (bytes / (1024 * 1024)).toFixed(2);
		if (bytes < MAX_BYTES) {
			console.log(`  ${label}: ${mib} MiB (width=${attempt.width}, crf=${attempt.crf})`);
			return;
		}
		console.warn(
			`  ${label}: ${mib} MiB exceeds the 20 MiB cap at width=${attempt.width}, crf=${attempt.crf} — retrying…`
		);
		if (i === attempts.length - 1) {
			throw new Error(`${label}: could not get ${out} under 20 MiB after ${attempts.length} attempts`);
		}
	}
}

/** Collapse space variants (incl. macOS' U+202F narrow no-break space in screen-recording filenames) for matching. */
function normalizeSpaces(s: string): string {
	return s.replace(/[\s  ]+/g, " ").trim();
}

/**
 * Resolves `fileName` inside `dir`, tolerating whitespace-only filename
 * mismatches (e.g. video-map.json using a regular space where the actual
 * macOS screen-recording file has U+202F before "PM").
 */
async function resolveSourceFile(dir: string, fileName: string): Promise<string> {
	const direct = path.join(dir, fileName);
	try {
		await fs.access(direct);
		return direct;
	} catch {
		const wanted = normalizeSpaces(fileName);
		const entries = await fs.readdir(dir);
		const match = entries.find((e) => normalizeSpaces(e) === wanted);
		if (!match) throw new Error(`Source file not found (even after whitespace-normalized match): ${fileName}`);
		return path.join(dir, match);
	}
}

async function processEntry(map: VideoMap, entry: VideoMapEntry, outDir: string): Promise<void> {
	const input = await resolveSourceFile(map.sourceDir, entry.file);

	const posterAt = (entry.posterHintPct / 100) * entry.duration_s;

	const webmOut = path.join(outDir, `${entry.slug}.webm`);
	const mp4Out = path.join(outDir, `${entry.slug}.mp4`);
	const posterOut = path.join(outDir, `${entry.slug}-poster.jpg`);

	console.log(`\n${entry.slug} (${entry.file})`);

	await encodeUnderCap(
		`${entry.slug}.webm`,
		(out, width, crf) => encodeWebm(input, out, width, crf),
		webmOut,
		36
	);
	await encodeUnderCap(
		`${entry.slug}.mp4`,
		(out, width, crf) => encodeMp4(input, out, width, crf),
		mp4Out,
		26
	);
	await extractStill(input, posterAt, posterOut);
	const posterBytes = await fileSize(posterOut);
	console.log(`  ${entry.slug}-poster.jpg: ${(posterBytes / 1024).toFixed(0)} KiB @ ${posterAt.toFixed(1)}s`);
}

// --- CLI -------------------------------------------------------------------

function parseArgs(argv: string[]): Record<string, string> {
	const out: Record<string, string> = {};
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a.startsWith("--")) {
			const key = a.slice(2);
			const next = argv[i + 1];
			if (next && !next.startsWith("--")) {
				out[key] = next;
				i++;
			} else {
				out[key] = "true";
			}
		}
	}
	return out;
}

async function main(): Promise<void> {
	const args = parseArgs(process.argv.slice(2));
	const root = repoRoot();

	if (args.still) {
		// Ad-hoc single-frame extraction (used for FIG. a/b/c detail-page stills).
		const input = args.still;
		const at = Number(args.at ?? "0");
		if (!args.out) throw new Error("--still requires --out <path>");
		const out = path.isAbsolute(args.out) ? args.out : path.join(root, "apps/main", args.out);
		await fs.mkdir(path.dirname(out), { recursive: true });
		await extractStill(input, at, out);
		const bytes = await fileSize(out);
		console.log(`still: ${out} (${(bytes / 1024).toFixed(0)} KiB) @ ${at}s`);
		return;
	}

	const mapPath = args.map ? path.resolve(args.map) : path.join(root, "design-refs/video-map.json");
	const map: VideoMap = JSON.parse(await fs.readFile(mapPath, "utf8"));

	const outDir = path.isAbsolute(map.outputDir) ? map.outputDir : path.join(root, map.outputDir);
	await fs.mkdir(outDir, { recursive: true });

	const only = args.only ? new Set(args.only.split(",")) : null;
	const entries = only ? map.videos.filter((v) => only.has(v.slug)) : map.videos;

	if (entries.length === 0) {
		console.log("Nothing to encode (check --only against video-map.json slugs).");
		return;
	}

	for (const entry of entries) {
		await processEntry(map, entry, outDir);
	}

	console.log("\nDone.");
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
