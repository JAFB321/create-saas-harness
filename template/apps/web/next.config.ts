import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Transpile the workspace packages (they ship raw TS).
  transpilePackages: ["@app/core", "@app/db", "@app/integrations"],
};

export default nextConfig;
