import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        gallery: resolve(__dirname, 'gallery.html'),
        donate: resolve(__dirname, 'donate.html'),
        contact: resolve(__dirname, 'contact.html'),
        sevakDal: resolve(__dirname, 'sevak-dal.html'),
        blogs: resolve(__dirname, 'blogs.html')
      }
    }
  }
});
