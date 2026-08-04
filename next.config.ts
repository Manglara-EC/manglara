import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "pub-2af908891e2c45e6830a95ce9701536d.r2.dev",
      }
    ],
  },
};

export default nextConfig;