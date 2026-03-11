import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs/promises';
import type { PhotoVariants, PhotoFormat } from '../src/lib/types/photo.js';

interface VariantConfig {
	name: string;
	maxWidth: number;
}

const SIZES: VariantConfig[] = [
	{ name: 'thumb', maxWidth: 400 },
	{ name: 'medium', maxWidth: 1200 },
	{ name: 'large', maxWidth: 2400 },
	{ name: 'original', maxWidth: 9999 }
];

const FORMATS = ['avif', 'webp', 'jpg'] as const;

interface GeneratedVariant {
	size: string;
	format: string;
	filePath: string;
	relativePath: string;
	width: number;
	height: number;
}

export async function generateVariants(
	inputPath: string,
	photoId: string,
	outputDir: string
): Promise<{ variants: PhotoVariants; files: GeneratedVariant[]; aspectRatio: number }> {
	const metadata = await sharp(inputPath).metadata();
	const originalWidth = metadata.width || 2400;
	const originalHeight = metadata.height || 1600;
	const aspectRatio = originalWidth / originalHeight;

	const photoDir = path.join(outputDir, photoId);
	await fs.mkdir(photoDir, { recursive: true });

	const files: GeneratedVariant[] = [];
	const variants: Record<string, Record<string, PhotoFormat>> = {};

	for (const size of SIZES) {
		const targetWidth = Math.min(size.maxWidth, originalWidth);
		const targetHeight = Math.round(targetWidth / aspectRatio);

		variants[size.name] = {};

		for (const format of FORMATS) {
			const ext = format === 'jpg' ? 'jpg' : format;
			const fileName = `${size.name}.${ext}`;
			const filePath = path.join(photoDir, fileName);
			const relativePath = `${photoId}/${fileName}`;

			let pipeline = sharp(inputPath).resize(targetWidth, targetHeight, { fit: 'inside' });

			if (format === 'avif') {
				pipeline = pipeline.avif({ quality: 65 });
			} else if (format === 'webp') {
				pipeline = pipeline.webp({ quality: 80 });
			} else {
				pipeline = pipeline.jpeg({ quality: 85, mozjpeg: true });
			}

			await pipeline.toFile(filePath);

			const outputMeta = await sharp(filePath).metadata();

			const variant: GeneratedVariant = {
				size: size.name,
				format,
				filePath,
				relativePath,
				width: outputMeta.width || targetWidth,
				height: outputMeta.height || targetHeight
			};

			files.push(variant);

			variants[size.name][format] = {
				url: relativePath,
				width: variant.width,
				height: variant.height
			};
		}
	}

	return {
		variants: variants as unknown as PhotoVariants,
		files,
		aspectRatio
	};
}
