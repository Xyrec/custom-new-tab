import type { NextConfig } from "next";

const config: NextConfig = {
  output: "export",
  distDir: "dist",
  images: {
    unoptimized: true,
  },
  basePath: "",
  assetPrefix: "/",
};

export default config;
