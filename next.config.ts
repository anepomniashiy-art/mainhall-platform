import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  trailingSlash: true,
  ...(isGitHubPages && {
    output: "export",
    basePath: "/mainhall-platform",
  }),
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
