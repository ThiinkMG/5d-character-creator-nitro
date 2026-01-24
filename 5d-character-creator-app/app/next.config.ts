import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Ensure API routes work on Netlify
  experimental: {
    // This helps with serverless function compatibility
  },
};

export default nextConfig;
