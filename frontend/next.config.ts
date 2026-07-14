import type { NextConfig } from "next";
import path from "path";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  basePath: isProd ? "/dasher-ui" : "",
  assetPrefix: isProd ? "/dasher-ui/" : "",
  allowedDevOrigins: [' 192.168.214.1'],
  images: {
    unoptimized: true,
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
