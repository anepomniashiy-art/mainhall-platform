import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  trailingSlash: true,
  experimental: {cpus: 2, staticGenerationMaxConcurrency: 4},
  ...(process.env.MAINHALL_STATIC_EXPORT === "true" && { output: "export" }),
  ...(isGitHubPages && {
    output: "export",
  }),
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
