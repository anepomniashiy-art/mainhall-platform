"use client";
import {useRef,useState} from "react";
type Photo={src:string;caption:string;width:number;height:number;category?:string};
export function ProjectPhotoGallery({photos,name,slug}:{photos:Photo[];name:string;slug:string}){
 const [category,setCategory]=useState('Все'),[active,setActive]=useState(0);const dialog=useRef<HTMLDialogElement>(null);
 const categories=['Все',...new Set(photos.map(p=>p.category).filter((c):c is string=>Boolean(c)))];
 const visible=category==='Все'?photos:photos.filter(p=>p.category===category);
 if(!photos.length)return null;
 const photo=photos[active];
 return <section className="mh-project-gallery" data-project-gallery={slug} aria-label={'Галерея '+name}>
  <div className="mh-gallery-heading"><h2>Галерея проекта</h2><span>{photos.length} изображений</span></div>
  {categories.length>1&&<div className="mh-gallery-categories" aria-label="Разделы галереи">{categories.map(c=><button key={c} type="button" aria-pressed={category===c} onClick={()=>setCategory(c)}>{c}</button>)}</div>}
  <div className="mh-gallery-thumbnails">{visible.map(p=><figure key={p.src}><button type="button" onClick={()=>{setActive(photos.indexOf(p));dialog.current?.showModal();}} aria-label={'Открыть: '+p.caption}><img src={p.src} alt={name+': '+p.caption} width={p.width} height={p.height} loading="lazy"/></button><figcaption>{p.caption}</figcaption></figure>)}</div>
  <dialog ref={dialog} className="mh-photo-dialog" onClick={e=>{if(e.target===e.currentTarget)dialog.current?.close();}} onKeyDown={e=>{if(e.key==='ArrowRight')setActive((active+1)%photos.length);if(e.key==='ArrowLeft')setActive((active+photos.length-1)%photos.length);}}>
   <button className="mh-photo-close" type="button" onClick={()=>dialog.current?.close()} aria-label="Закрыть галерею">Закрыть ×</button>
   <img src={photo.src} alt={name+': '+photo.caption}/><p>{photo.caption} · {active+1} / {photos.length}</p>
   <div className="mh-photo-controls"><button type="button" onClick={()=>setActive((active+photos.length-1)%photos.length)}>← Предыдущее</button><button type="button" onClick={()=>setActive((active+1)%photos.length)}>Следующее →</button></div>
  </dialog>
 </section>;
}
