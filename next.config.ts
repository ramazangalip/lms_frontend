import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // eslint hatası alırsan bu satırı silebilirsin, 
  // Next.js 15+ sürümlerinde bazen tip tanımı değişebiliyor.
};

export default nextConfig;