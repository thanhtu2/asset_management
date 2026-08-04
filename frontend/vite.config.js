// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// import tailwindcss from '@tailwindcss/vite'
// import basicSsl from '@vitejs/plugin-basic-ssl'

// export default defineConfig({
//   plugins: [react(), tailwindcss(), basicSsl()],
//   server: {
//     port: 5173,
//     host: true,
//     proxy: {
//       '/api': {
//         target: 'http://localhost:3001',
//         changeOrigin: true,
//         secure: false
//       }
//     }
//   }
// })


import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [react(), tailwindcss(), basicSsl()],
  server: {
    port: 5173,
    host: true,
    allowedHosts: 'all', // ✅ Cho phép mọi host
    hmr: {
      protocol: 'wss', // ✅ Dùng wss thay vì ws khi có HTTPS
      clientPort: 5173
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        // target: 'http://asset_management_api:3001',
        changeOrigin: true,
        secure: false
      }
    }
  }
})