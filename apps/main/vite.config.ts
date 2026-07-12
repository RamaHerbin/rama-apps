import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	server: {
		// Fixed port so the studio editor iframe can rely on a stable portfolio URL.
		port: 5180,
		strictPort: true,
		fs: {
			allow: ['.']
		}
	}
});
