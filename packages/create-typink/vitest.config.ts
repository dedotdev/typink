/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  // @ts-ignore
  test: {
    environment: 'jsdom',
  },
});
