import type { NextConfig } from "next";

const API_URL = process.env.API_URL ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  // Allow opening the dev server from other devices on the LAN (e.g. phone)
  allowedDevOrigins: ["192.168.100.29", "192.168.*.*"],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
