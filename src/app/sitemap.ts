import {residentialUnits} from "@/lib/residential-catalogue";
import {commercialUnits} from '@/lib/sminex-catalogue';
import type {MetadataRoute} from "next";
import {editorialProjects} from "@/lib/editorial-projects";
import {districts,collections} from "@/lib/site-content";
import {SITE_URL} from "@/lib/seo";
import {articles} from "@/lib/articles";
import {developers} from "@/lib/developers";
export const dynamic="force-static";
export default function sitemap():MetadataRoute.Sitemap{
 const paths=[...commercialUnits.map(u=>`/commercial/${u.sourceId}/`),...residentialUnits.map(u=>u.detailPath),"/","/projects/","/units/","/investments/","/investment-rating/","/districts/","/collections/","/analytics/","/installments/","/developers/","/about/","/contacts/","/commercial/",...developers.map(d=>`/developers/${d.slug}/`),...editorialProjects.map(p=>`/projects/${p.slug}/`),...districts.map(d=>`/districts/${d.slug}/`),...collections.map(c=>`/collections/${c.slug}/`),...articles.map(a=>`/analytics/${a.slug}/`)];
 return paths.map(path=>({url:SITE_URL+path}));
}
