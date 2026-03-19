import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  async rewrites() {
    return [
      {
        source: "/api/proxy/multiplexer/:path*",
        destination: `${process.env.MULTIPLEXER_URL}/:path*`,
      },
      {
        source: "/api/proxy/core/:path*",
        destination: `${process.env.CORE_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
