/**
 * Next.js top-level configuration.
 * reactCompiler enables Next.js React Compiler optimizations (experimental performance).
 * Add future options (images, redirects, rewrites, headers, etc.) here.
 */
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable experimental React compiler (can disable if issues arise)
  reactCompiler: true,
};

export default nextConfig;
