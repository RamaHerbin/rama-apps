export interface PhotoFormat {
	url: string;
	width: number;
	height: number;
}

export interface PhotoVariants {
	thumb: { avif: PhotoFormat; webp: PhotoFormat; jpg: PhotoFormat };
	medium: { avif: PhotoFormat; webp: PhotoFormat; jpg: PhotoFormat };
	large: { avif: PhotoFormat; webp: PhotoFormat; jpg: PhotoFormat };
	original: { avif: PhotoFormat; webp: PhotoFormat; jpg: PhotoFormat };
}

export interface PhotoLocation {
	latitude: number;
	longitude: number;
	altitude?: number;
	name?: string;
}

export interface ExifData {
	camera?: string;
	lens?: string;
	focalLength?: string;
	aperture?: string;
	shutterSpeed?: string;
	iso?: number;
	dateTaken?: string;
	location?: PhotoLocation;
}

export interface Photo {
	id: string;
	slug: string;
	title: string;
	description?: string;
	tags: string[];
	collectionIds: string[];
	featured: boolean;
	aspectRatio: number;
	variants: PhotoVariants;
	exif: ExifData;
	createdAt: string;
	updatedAt: string;
}
