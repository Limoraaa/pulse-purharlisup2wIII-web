import type { NextConfig } from "next";
import path from "path";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  basePath: isProd ? "/dasher-ui" : "",
  assetPrefix: isProd ? "/dasher-ui/" : "",
  allowedDevOrigins: ['192.168.214.1'],
  images: {
    // unoptimized harus tetap true karena menggunakan output: "export"
    unoptimized: true, 
    remotePatterns: [
      {
        protocol: 'http', // Ubah ke 'https' jika API Laravel nanti menggunakan SSL
        hostname: 'localhost', // Ganti dengan domain/IP Laravel saat production (misal: 192.168.x.x atau api.domain.com)
        port: '8000', // Sesuaikan port backend Anda, hapus baris ini jika production tidak pakai port
        pathname: '/storage/**',
      },
    ],
  },
  output: "export",
  env: {
    NEXT_PUBLIC_BASE_PATH: isProd ? "/dasher-ui" : "",
  },
  sassOptions: {
    includePaths: [path.join(__dirname, "node_modules")],
  },
};

export default nextConfig;