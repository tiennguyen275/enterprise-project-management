import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'vendor-react', test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom)[\\/]/ },
            { name: 'vendor-mui', test: /[\\/]node_modules[\\/](@mui|@emotion)[\\/]/ },
            { name: 'vendor-realtime', test: /[\\/]node_modules[\\/](@microsoft[\\/]signalr|axios)[\\/]/ },
          ],
        },
      },
    },
  },
});
