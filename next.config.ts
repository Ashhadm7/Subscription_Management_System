import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin the workspace root: a stray lockfile in the parent directory would
  // otherwise make Turbopack resolve modules from outside the project.
  turbopack: {
    root: path.resolve(process.cwd()),
  },
};

export default nextConfig;
