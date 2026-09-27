import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { fileURLToPath } from 'url';

const projectDirectory = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Scan only the application entry. This keeps OneDrive traversal bounded while allowing
  // Vite to convert React's CommonJS-compatible runtime into browser-safe ESM.
  optimizeDeps: {
    entries: [path.resolve(projectDirectory, 'index.html')],
    include: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
  },
  resolve: { alias: { '@': path.resolve(projectDirectory, './src') } },
});
