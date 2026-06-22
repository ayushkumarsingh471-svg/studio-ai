import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Yeh TypeScript ke saare errors ignore kar dega
    ignoreBuildErrors: true,
  },
  eslint: {
    // Yeh saare warning errors ko ignore kar dega
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;