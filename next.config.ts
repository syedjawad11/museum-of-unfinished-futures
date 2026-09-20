import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    useTypeScriptCli: false,
  },
  typescript: {
    tsconfigPath: "tsconfig.typecheck.json",
  },
};

export default nextConfig;
