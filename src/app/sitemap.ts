import type {MetadataRoute} from "next";
import {editorialProjects} from "@/lib/editorial-projects";
import {districts,collections,articles} from "@/lib/site-content";
import {SITE_URL} from "@/lib/seo";
export const dynamic="force-static";
export default function sitemap():MetadataRoute.Sitemap{
 const paths=["/","/projects/","/districts/","/collections/","/analytics/","/installments/","/developers/","/about/","/contacts/","/commercial/",...editorialProjects.map(p=>`/projects/${p.slug}/`),...districts.map(d=>`/districts/${d.slug}/`),...collections.map(c=>`/collections/${c.slug}/`),...articles.map(a=>`/analytics/${a.slug}/`)];
 return paths.map(path=>({url:SITE_URL+path}));
}
