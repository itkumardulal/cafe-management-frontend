import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Monorepo: npm workspaces hoist `next` to the repo root (parent of frontend).
  turbopack: {
    root: path.join(__dirname, ".."),
  },
  // Explicit App Router proxy at app/api/[...path]/route.ts forwards cookies reliably.
  // Netlify production uses netlify.toml redirects for the same /api path.
  async rewrites() {
    return [];
  },
};

export default nextConfig;
