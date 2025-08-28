import react from '@vitejs/plugin-react';
import analyze from 'rollup-plugin-analyzer';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

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
