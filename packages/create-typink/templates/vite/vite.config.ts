import react from '@vitejs/plugin-react';
import analyze from 'rollup-plugin-analyzer';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
<<<<<<<< HEAD:packages/create-typink/templates/vite/vite.config.ts
========
import analyze from 'rollup-plugin-analyzer';
>>>>>>>> main:packages/create-typink/templates/legacy-subconnectv2-vite/vite.config.ts

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  build: {
    rollupOptions: {
      plugins: [analyze()],
    },
  },
  // @ts-ignore
  test: {
    globals: true,
  },
});
