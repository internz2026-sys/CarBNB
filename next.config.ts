import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Allow owner document uploads up to ~5 MB plus multipart overhead.
      // Default Next.js limit is 1 MB, which is too tight for PDF IDs.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
