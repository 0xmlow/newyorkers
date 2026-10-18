import { defineConfig } from 'vite';
// Builds to site/, which build_galleries.py copies into NEW YORKERS SITE/assets/unreal.
export default defineConfig({ base: './', build: { outDir: 'site', emptyOutDir: true, assetsDir: 'js', chunkSizeWarningLimit: 1200 } });
