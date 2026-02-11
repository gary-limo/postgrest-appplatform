import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static export for Cloudflare Pages / S3 deployment
  // Uncomment the next line for static export:
  // output: "export",

  // Allow API requests to PostgREST backend
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/:path*`,
      },
    ];
  },
};

export default nextConfig;
