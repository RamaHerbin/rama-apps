import sharp from 'sharp';
import exifReader from 'exif-reader';
import type { ExifData } from '../src/lib/types/photo.js';

export async function extractExif(filePath: string): Promise<ExifData> {
	const metadata = await sharp(filePath).metadata();
	const result: ExifData = {};

	if (!metadata.exif) return result;

	try {
		const exif = exifReader(metadata.exif);

		if (exif.Image) {
			result.camera = [exif.Image.Make, exif.Image.Model]
				.filter(Boolean)
				.join(' ')
				.replace(/\s+/g, ' ')
				.trim();
		}

		if (exif.Photo) {
			if (exif.Photo.LensModel) {
				result.lens = exif.Photo.LensModel as string;
			}
			if (exif.Photo.FocalLength) {
				result.focalLength = `${exif.Photo.FocalLength}mm`;
			}
			if (exif.Photo.FNumber) {
				result.aperture = `f/${exif.Photo.FNumber}`;
			}
			if (exif.Photo.ExposureTime) {
				const exposure = exif.Photo.ExposureTime as number;
				result.shutterSpeed =
					exposure >= 1 ? `${exposure}s` : `1/${Math.round(1 / exposure)}s`;
			}
			if (exif.Photo.ISOSpeedRatings) {
				result.iso = Array.isArray(exif.Photo.ISOSpeedRatings)
					? exif.Photo.ISOSpeedRatings[0]
					: (exif.Photo.ISOSpeedRatings as number);
			}
			if (exif.Photo.DateTimeOriginal) {
				const d = exif.Photo.DateTimeOriginal;
				result.dateTaken = d instanceof Date ? d.toISOString() : String(d);
			}
		}

		if (exif.GPSInfo) {
			const gps = exif.GPSInfo;
			if (gps.GPSLatitude && gps.GPSLongitude) {
				result.location = {
					latitude: gps.GPSLatitude as number,
					longitude: gps.GPSLongitude as number,
					altitude: gps.GPSAltitude as number | undefined
				};
			}
		}
	} catch {
		// EXIF parsing failed, return partial result
	}

	return result;
}
