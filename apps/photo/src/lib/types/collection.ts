export interface Collection {
	id: string;
	slug: string;
	title: string;
	description?: string;
	coverPhotoId?: string;
	featured: boolean;
	createdAt: string;
	updatedAt: string;
}
