import {NextResponse} from 'next/server';
import {editorialProjects} from '@/lib/editorial-projects';
import {projectImages} from '@/lib/project-images';
export const dynamic='force-static';
export function GET(){
 return NextResponse.json({count:editorialProjects.length,results:editorialProjects.map(p=>({
  slug:p.slug,name:p.name,developer:p.developer,area:p.area,className:p.className,
  summary:p.summary,href:'/projects/'+p.slug+'/',image:projectImages[p.slug]?.src??null,
 }))},{headers:{'Cache-Control':'public, max-age=60, stale-while-revalidate=300'}});
}
