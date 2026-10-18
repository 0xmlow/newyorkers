import { defineConfig } from 'vite';
// Builds to site/, which NEW YORKERS SITE/_build/build_galleries.py copies into assets/inside.
export default defineConfig({ base: './', build: { outDir: 'site', emptyOutDir: true, assetsDir: 'js', chunkSizeWarningLimit: 1500 } });
