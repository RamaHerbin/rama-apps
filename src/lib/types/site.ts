export interface SocialLink {
	platform: string;
	url: string;
	label: string;
}

export interface SiteConfig {
	title: string;
	description: string;
	author: string;
	url: string;
	r2PublicUrl: string;
	socials: SocialLink[];
	about: {
		bio: string;
		avatar: string;
	};
}
