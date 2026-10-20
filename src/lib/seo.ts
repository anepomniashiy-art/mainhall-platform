import type {Metadata} from "next";
export const SITE_URL="https://main-hall.ru";
export function pageMetadata(title:string,description:string,path:string,image="/images/projects/nicole.jpg"):Metadata{
 return {title,description,alternates:{canonical:path},robots:{index:true,follow:true},openGraph:{title,description,url:path,siteName:"MAINHALL",locale:"ru_RU",type:"website",images:[{url:image,alt:title}]},twitter:{card:"summary_large_image",title,description,images:[image]}};
}
