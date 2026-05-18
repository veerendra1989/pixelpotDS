import { defineConfig } from 'vite';
import { resolve } from 'path';
export default defineConfig({
  server: { port: 3000, open: true },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        preview: resolve(__dirname, 'preview.html'),
        generate: resolve(__dirname, 'generate.html')
      }
    }
  }
});
