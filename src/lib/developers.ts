import {editorialProjects} from "./editorial-projects";
const slugs:Record<string,string>={"ST MICHAEL":"st-michael",Sminex:"sminex",PIONEER:"pioneer","Capital Group":"capital-group",Vesper:"vesper","Группа Эталон":"etalon","Level Group":"level-group","MR Group":"mr-group",Hutton:"hutton",STONE:"stone","October Group":"october-group",Coldy:"coldy","Upside Development":"upside-development"};
export const developerSlug=(name:string)=>slugs[name]||name.toLowerCase().replace(/[^a-z0-9]+/g,"-");
export const developers=[...new Set(editorialProjects.map(p=>p.developer))].map(name=>({name,slug:developerSlug(name),projects:editorialProjects.filter(p=>p.developer===name)}));
