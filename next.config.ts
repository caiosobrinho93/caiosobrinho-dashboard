import type { NextConfig } from "next";
import { BASE_PATH } from "./lib/base-path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  basePath: BASE_PATH,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
