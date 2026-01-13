import type { NextConfig } from "next";

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
};

export default nextConfig;
