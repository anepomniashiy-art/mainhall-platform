import type {MetadataRoute} from "next";
import {SITE_URL} from "@/lib/seo";
export const dynamic="force-static";
export default function robots():MetadataRoute.Robots{
 if(process.env.SITE_PREVIEW==="true")return {rules:{userAgent:"*",disallow:"/"}};
 return {rules:{userAgent:"*",allow:"/",disallow:["/api/","/legacy/"]},sitemap:SITE_URL+"/sitemap.xml"};
}
