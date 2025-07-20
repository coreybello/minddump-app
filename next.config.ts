import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    domains: ['localhost'],
  },
  // Optimize build performance
  experimental: {
    optimizeCss: true,
  },
  // Add build timeout configuration
  staticPageGenerationTimeout: 180,
};

export default nextConfig;
