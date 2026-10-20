import {readFileSync} from "node:fs";
import {join} from "node:path";
import {SITE_URL} from "@/lib/seo";
export const dynamic="force-static";
export function GET(){
 let source=readFileSync(join(process.cwd(),"public/legacy-mainhall/index.html"),"utf8");
 source=source.replaceAll("https://main-hall.ru",SITE_URL);
 const description="Коммерческая недвижимость Москвы: подход MAINHALL к выбору объектов, инвестиционным сценариям и работе с инвесторами.";
 let descriptions=0;
 source=source.replace(/<meta\s+name="description"[^>]*>/g,()=>descriptions++?"":`<meta name="description" content="${description}">`);
 source=source.replace(/<meta\s+property="og:description"[^>]*>/g,`<meta property="og:description" content="${description}">`);
 source=source.replace(/<html>/,"<html lang=\"ru\">");
 const breadcrumb={"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"Главная",item:SITE_URL+"/"},{"@type":"ListItem",position:2,name:"Коммерческая недвижимость",item:SITE_URL+"/commercial/"}]};
 source=source.replace("</head>",`<script type="application/ld+json">${JSON.stringify(breadcrumb)}</script></head>`);
 return new Response(source,{headers:{"Content-Type":"text/html; charset=utf-8"}});
}
