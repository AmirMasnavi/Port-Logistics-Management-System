import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.fbx', '**/*.glb', '**/*.gltf', '**/*.obj', '**/*.mtl', '**/*.3ds'],
  server: {
    proxy: {
      // Proxy Planning API endpoints to the backend
      '/api/planning': {
        target: 'http://localhost:5274',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
