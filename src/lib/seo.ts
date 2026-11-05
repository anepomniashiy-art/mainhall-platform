import type {Metadata} from "next";
export const SITE_URL="https://main-hall.ru";
export function pageMetadata(title:string,description:string,path:string,image?:string):Metadata{
 return {title,description,alternates:{canonical:path},robots:{index:true,follow:true},openGraph:{title,description,url:path,siteName:"MAINHALL",locale:"ru_RU",type:"website",...(image?{images:[{url:image,alt:title}]}:{})},twitter:{card:image?"summary_large_image":"summary",title,description,...(image?{images:[image]}:{})}};
}
