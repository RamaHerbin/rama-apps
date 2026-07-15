export interface ContactFormData {
	name: string;
	email: string;
	message: string;
}

export type FieldErrors = Partial<Record<keyof ContactFormData, string>>;

export interface Testimonial {
	id: number;
	name: string;
	designation: string;
	/** avatar fallback src (JPG photo, or initials SVG data URI) */
	image: string;
	/** avatar WebP source; absent for initials avatars */
	imageWebp?: string;
	/** condensed pull-quote shown on the card */
	excerpt: string;
	/** the full recommendation, one entry per paragraph, shown in the dialog */
	body: string[];
	linkedinUrl: string;
	date: string;
}

export interface Logo {
	name: string;
	path: string;
}
