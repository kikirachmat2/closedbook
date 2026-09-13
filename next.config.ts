import type { NextConfig } from "next";

const withBundleAnalyzer = process.env.ANALYZE === "true"
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ? require("@next/bundle-analyzer")({ enabled: true })
  : (config: NextConfig) => config;

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default withBundleAnalyzer(nextConfig);

