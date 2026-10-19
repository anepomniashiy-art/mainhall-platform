import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  trailingSlash: true,
  ...(process.env.MAINHALL_STATIC_EXPORT === "true" && { output: "export" }),
  ...(isGitHubPages && {
    output: "export",
    basePath: "/mainhall-platform",
  }),
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
