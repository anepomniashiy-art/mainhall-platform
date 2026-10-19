import type {MetadataRoute} from "next";
import {editorialProjects} from "@/lib/editorial-projects";

export const dynamic = "force-static";
export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/projects/", "/commercial/", ...editorialProjects.map(p => `/projects/${p.slug}/`)]
    .map(path => ({url: `https://main-hall.ru${path}`}));
}
