import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Monorepo: npm workspaces hoist `next` to the repo root (parent of frontend).
  turbopack: {
    root: path.join(__dirname, ".."),
  },
};

export default nextConfig;
