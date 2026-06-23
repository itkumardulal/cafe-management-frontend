import path from "node:path";
import type { NextConfig } from "next";

const backendOrigin = (process.env.API_URL ?? "http://localhost:4000").replace(
  /\/$/,
  "",
);

const nextConfig: NextConfig = {
  // Socket.io must hit the Nest host directly (Netlify cannot proxy WebSockets reliably).
  // Falls back to API_URL at build time when NEXT_PUBLIC_SOCKET_URL is unset.
  env: {
    NEXT_PUBLIC_SOCKET_URL:
      process.env.NEXT_PUBLIC_SOCKET_URL?.replace(/\/$/, "") ?? backendOrigin,
  },
  // Monorepo: npm workspaces hoist `next` to the repo root (parent of frontend).
  turbopack: {
    root: path.join(__dirname, ".."),
  },
  // Optional fallback: same-origin /socket.io proxy (Netlify). Dev uses direct backend + auth token.
  async rewrites() {
    const apiOrigin = (process.env.API_URL ?? "http://localhost:4000").replace(
      /\/$/,
      "",
    );
    return {
      beforeFiles: [
        {
          source: "/socket.io",
          destination: `${apiOrigin}/socket.io`,
        },
        {
          source: "/socket.io/:path*",
          destination: `${apiOrigin}/socket.io/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
