import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  const rootDir = import.meta.dirname;
  return {
    base: './',
    build: {
      rollupOptions: {
        input: path.resolve(rootDir, 'app.html'),
      },
    },
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'sync-github-pages-static-root',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) return;
          const distDir = path.resolve(rootDir, 'dist');
          const srcAssets = path.resolve(rootDir, 'src/assets');
          const distSrcAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distSrcAssets, {recursive: true, force: true});
          }
          // Publish compiled static entry + bundle to repo root so GitHub Pages on main works out of the box
          const builtHtml = path.resolve(distDir, 'app.html');
          const rootIndex = path.resolve(rootDir, 'index.html');
          const distBundleAssets = path.resolve(distDir, 'assets');
          const rootBundleAssets = path.resolve(rootDir, 'assets');
          if (fs.existsSync(builtHtml)) {
            fs.copyFileSync(builtHtml, rootIndex);
          }
          if (fs.existsSync(distBundleAssets)) {
            if (fs.existsSync(rootBundleAssets)) {
              fs.rmSync(rootBundleAssets, {recursive: true, force: true});
            }
            fs.cpSync(distBundleAssets, rootBundleAssets, {recursive: true, force: true});
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': rootDir,
      },
    },
    server: {
      open: '/app.html',
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
