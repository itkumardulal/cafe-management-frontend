import path from "node:path";
import type { NextConfig } from "next";

const apiOrigin = process.env.API_URL?.replace(/\/$/, "");

const nextConfig: NextConfig = {
  // Monorepo: npm workspaces hoist `next` to the repo root (parent of frontend).
  turbopack: {
    root: path.join(__dirname, ".."),
  },
  // When API_URL is set (production), proxy /api to the backend so cookies stay same-origin.
  // Netlify also proxies via netlify.toml; this supports `next start` and the Netlify Next plugin.
  async rewrites() {
    if (!apiOrigin) {
      return [];
    }
    return [
      {
        source: "/api/:path*",
        destination: `${apiOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
