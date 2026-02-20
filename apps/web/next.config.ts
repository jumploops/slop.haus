import type { NextConfig } from "next";

const debugNoLightningcss = process.env.SLOP_DEBUG_NO_LIGHTNINGCSS === "1";
const debugCssChunkingStrict = process.env.SLOP_DEBUG_CSS_CHUNKING_STRICT === "1";
const debugDisableOptimizedLoading = process.env.SLOP_DEBUG_DISABLE_OPTIMIZED_LOADING === "1";
const debugOptimizeCssFlag = process.env.SLOP_DEBUG_OPTIMIZE_CSS;

const experimental: NonNullable<NextConfig["experimental"]> = {};

if (debugNoLightningcss) {
  experimental.useLightningcss = false;
}

if (debugCssChunkingStrict) {
  experimental.cssChunking = "strict";
}

if (debugDisableOptimizedLoading) {
  experimental.disableOptimizedLoading = true;
}

if (debugOptimizeCssFlag === "1") {
  experimental.optimizeCss = true;
} else if (debugOptimizeCssFlag === "0") {
  experimental.optimizeCss = false;
}

const nextConfig: NextConfig = {
  transpilePackages: ["@slop/shared"],
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3001",
        pathname: "/uploads/**",
      },
      // Add production storage domain when needed
    ],
  },
  ...(Object.keys(experimental).length > 0 ? { experimental } : {}),
};

export default nextConfig;
