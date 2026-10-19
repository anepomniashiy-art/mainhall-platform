import type {MetadataRoute} from "next";

export const dynamic = "force-static";
export default function robots(): MetadataRoute.Robots {
  // Preview URLs must not compete with the production commercial document.
  if (process.env.GITHUB_PAGES === "true") return {rules: {userAgent: "*", disallow: "/"}};
  return {rules: {userAgent: "*", allow: "/"}, sitemap: "https://main-hall.ru/sitemap.xml"};
}
