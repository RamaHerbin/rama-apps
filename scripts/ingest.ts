import minimist from 'minimist';
import path from 'node:path';
import fs from 'node:fs/promises';
import { extractExif } from './exif.js';
import { generateVariants } from './variants.js';
import { uploadVariants } from './upload.js';
import { addPhoto, ensureCollection } from './json-store.js';
import { generateId, toSlug, nowISO } from './utils.js';
import type { Photo } from '../src/lib/types/photo.js';

const args = minimist(process.argv.slice(2), {
	string: ['title', 'description', 'collection', 'tags'],
	boolean: ['featured', 'skip-upload', 'dry-run', 'help'],
	alias: { t: 'title', d: 'description', c: 'collection', f: 'featured', h: 'help' }
});

if (args.help || args._.length === 0) {
	console.log(`
Usage: pnpm ingest <photo-file> [options]

Options:
  -t, --title          Photo title (default: filename)
  -d, --description    Photo description
  -c, --collection     Collection slug to add to
  --tags               Comma-separated tags
  -f, --featured       Mark as featured
  --skip-upload        Save to static/dev-images/ instead of R2
  --dry-run            Extract EXIF and show what would be done
  -h, --help           Show this help
`);
	process.exit(0);
}

async function main() {
	const inputFile = path.resolve(args._[0] as string);

	// Verify file exists
	try {
		await fs.access(inputFile);
	} catch {
		console.error(`File not found: ${inputFile}`);
		process.exit(1);
	}

	const fileName = path.basename(inputFile, path.extname(inputFile));
	const title = (args.title as string) || fileName;
	const slug = toSlug(title);
	const id = generateId();

	console.log(`\nIngesting: ${path.basename(inputFile)}`);
	console.log(`  ID:    ${id}`);
	console.log(`  Title: ${title}`);
	console.log(`  Slug:  ${slug}`);

	// Extract EXIF
	console.log('\nExtracting EXIF data...');
	const exif = await extractExif(inputFile);
	console.log('  EXIF:', JSON.stringify(exif, null, 2));

	if (args['dry-run']) {
		console.log('\n[Dry run] Would generate 12 variants (4 sizes × 3 formats)');
		console.log('[Dry run] Would update data/photos.json');
		return;
	}

	// Generate variants
	const skipUpload = args['skip-upload'] as boolean;
	const outputDir = skipUpload
		? path.resolve(import.meta.dirname, '..', 'static', 'dev-images')
		: path.resolve(import.meta.dirname, '..', '.tmp-variants');

	console.log('\nGenerating variants...');
	const { variants, files, aspectRatio } = await generateVariants(inputFile, id, outputDir);
	console.log(`  Generated ${files.length} files`);

	// Upload (if not skip-upload)
	if (!skipUpload) {
		console.log('\nUploading to R2...');
		await uploadVariants(files);

		// Clean up tmp directory
		await fs.rm(path.resolve(import.meta.dirname, '..', '.tmp-variants'), {
			recursive: true,
			force: true
		});
		console.log('  Upload complete');
	} else {
		console.log('\n  Skipped upload (saved to static/dev-images/)');
	}

	// Parse tags
	const tags: string[] = args.tags
		? (args.tags as string).split(',').map((t: string) => t.trim()).filter(Boolean)
		: [];

	// Handle collection
	const collectionIds: string[] = [];
	if (args.collection) {
		const collSlug = toSlug(args.collection as string);
		const collId = generateId();
		const collection = await ensureCollection(collId, args.collection as string, collSlug);
		collectionIds.push(collection.id);
	}

	// Build photo object
	const photo: Photo = {
		id,
		slug,
		title,
		description: (args.description as string) || undefined,
		tags,
		collectionIds,
		featured: !!args.featured,
		aspectRatio,
		variants,
		exif,
		createdAt: nowISO(),
		updatedAt: nowISO()
	};

	// Save to JSON
	console.log('\nSaving to data/photos.json...');
	await addPhoto(photo);
	console.log('  Done!');

	console.log(`\nPhoto "${title}" ingested successfully.`);
	console.log(`View at: /gallery/${slug}`);
}

main().catch((err) => {
	console.error('Error:', err);
	process.exit(1);
});
