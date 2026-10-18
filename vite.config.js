import {defineConfig} from 'vite';
export default defineConfig({base:'./',build:{outDir:'site',chunkSizeWarningLimit:1800},server:{fs:{strict:true}}});
