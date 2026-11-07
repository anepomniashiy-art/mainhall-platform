import {editorialProjects,type ProjectEntry} from "./editorial-projects";
import {researchBySlug} from "./research-projects";
import {projectImages} from "./project-images";

/**
 * Customer-facing project card. Client components receive ONLY these fields as
 * props, so internal provenance (source URLs, methodology, feed addresses and
 * research hand-off links) never reaches the browser bundle. Internal evidence
 * stays in data/catalogue and data/provenance for QA.
 */
export type PublicProjectCard={
 slug:string;name:string;developer:string;area:string;className:ProjectEntry["className"];thesis:string;
 /** Cover image; null renders the named placeholder. */
 cover:{src:string;caption:string}|null;
 /** MAINHALL investment rating on a 0–100 scale; null when the project is not rated. */
 score:number|null;
};

export function publicProjectCards(slugs?:string[]):PublicProjectCard[]{
 return editorialProjects
  .filter(p=>!slugs||slugs.includes(p.slug))
  .map(p=>({slug:p.slug,name:p.name,developer:p.developer,area:p.area,className:p.className,thesis:p.thesis,cover:projectImages[p.slug]?{src:projectImages[p.slug].src,caption:projectImages[p.slug].caption}:null,score:researchBySlug(p.slug)?.score??null}));
}
