import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	resolve: {
		alias: {
			'fancy-ui': path.resolve(__dirname, '../fancy-ui/src/lib')
		}
	},
	server: {
		fs: {
			allow: ['.', path.resolve(__dirname, '../fancy-ui')]
		}
	}
});
