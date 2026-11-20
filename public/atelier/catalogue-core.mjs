export const normalize = value => String(value??'').toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
export const hasValue = value => value !== '' && value !== null && value !== undefined;
export function inRange(value,min,max){ if(!hasValue(min)&&!hasValue(max))return true; if(!Number.isFinite(value))return false; return (!hasValue(min)||value>=Number(min))&&(!hasValue(max)||value<=Number(max)); }
export const unitFiltersActive=f=>Boolean(f.rooms?.length||hasValue(f.pmin)||hasValue(f.pmax)||hasValue(f.amin)||hasValue(f.amax)||hasValue(f.fmin)||hasValue(f.fmax)||f.finish||f.year||f.ready||f.onlyStock);
export function matchesUnit(u,f){
 if(f.rooms?.length&&!f.rooms.some(r=>r==='s'?u.studio:!u.studio&&(r==='4'?u.rooms>=4:u.rooms===Number(r))))return false;
 if(!inRange(u.price,hasValue(f.pmin)?Number(f.pmin)*1e6:null,hasValue(f.pmax)?Number(f.pmax)*1e6:null))return false;
 if(!inRange(u.area,f.amin,f.amax)||!inRange(u.floor,f.fmin,f.fmax))return false;
 if(f.ready&&u.state!=='hand-over')return false;
 if(f.year&&(!Number.isFinite(u.year)||u.year>Number(f.year)))return false;
 if(f.finish&&normalize(u.finish)!==normalize(f.finish))return false;
 return true;
}
export function matchesProject(p,f){
 const words=normalize(f.q).split(' ').filter(Boolean),haystack=normalize([p.name,p.developer,p.area,p.district,p.address,p.metro].join(' '));
 if(!words.every(w=>haystack.includes(w)))return false;
 if(f.region&&p.region!==f.region&&!(f.region==='Москва'&&/^Москва[,\s]/.test(p.address||'')))return false;
 if(f.className&&(f.className==='premium'?!['Премиум','Элитная'].includes(p.className):p.className!==f.className))return false;
 if(f.developer&&normalize(p.developer)!==normalize(f.developer))return false;
 return true;
}
export const validCoordinates=p=>Number.isFinite(p.lat)&&Number.isFinite(p.lng)&&p.lat>=-90&&p.lat<=90&&p.lng>=-180&&p.lng<=180;
export function groupResults(projects,units,f={}){
 const byProject=new Map();
 for(const u of units)if(matchesUnit(u,f)){if(!byProject.has(u.projectSlug))byProject.set(u.projectSlug,[]);byProject.get(u.projectSlug).push(u);}
 const results=[];for(const p of projects){if(!matchesProject(p,f))continue;const matches=byProject.get(p.slug)||[];if(!matches.length&&unitFiltersActive(f))continue;
 results.push({project:p,units:matches,count:matches.length,minPrice:matches.length?Math.min(...matches.map(u=>u.price)):null,minArea:matches.length?Math.min(...matches.map(u=>u.area)):null});}
 return results;
}
