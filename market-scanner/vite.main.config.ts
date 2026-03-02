import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      external: ['better-sqlite3', 'yahoo-finance2', 'electron'],
    },
  },
});
