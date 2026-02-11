import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static export for Cloudflare Pages / S3 deployment
  // Uncomment the next line for static export:
  // output: "export",

  // Proxy API requests to PostgREST backend (server-side only)
  async rewrites() {
    const backendUrl = process.env.POSTGREST_INTERNAL_URL || "http://localhost:3000";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
