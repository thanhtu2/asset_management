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
import fs from 'node:fs'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const devHttpsHost = process.env.VITE_DEV_HTTPS_HOST || '192.168.90.29'
const legacyLanHost = '192.168.88.175'
const devCertificatePath = path.resolve(__dirname, '.certs', 'asset-management-dev.pfx')
const devCertificatePassphrase = process.env.VITE_DEV_CERT_PASSPHRASE || 'asset-management-dev'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    host: true,
    https: fs.existsSync(devCertificatePath) ? {
      pfx: fs.readFileSync(devCertificatePath),
      passphrase: devCertificatePassphrase
    } : undefined,
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