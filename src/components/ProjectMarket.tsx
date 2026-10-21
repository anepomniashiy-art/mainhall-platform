import unitsData from "../../data/catalogue/public-units.json";
import galleries from "../../data/catalogue/project-galleries.json";
import {COMPANY} from "@/lib/constants";

type Unit = {id:string;projectSlug:string;unitNumber:string;buildingName:string;floor:number;floorsTotal?:number;rooms:number;bedrooms?:number|null;areaSqm:number;finish?:string;type?:string;unitType?:string;priceRub:number;priceBeforeDiscountRub?:number;pricePerSqm?:number;ceilingHeightM?:number;completionYear?:number;fetchedAt:string;features?:string[];planImageSrc?:string};
type Photo = {src:string;caption:string;width:number;height:number};
const number=(value:number)=>new Intl.NumberFormat("ru-RU",{maximumFractionDigits:2}).format(value);
const date=(value:string)=>new Intl.DateTimeFormat("ru-RU",{day:"2-digit",month:"2-digit",year:"numeric",timeZone:"Europe/Moscow"}).format(new Date(value));
export function ProjectGallery({slug,name}:{slug:string;name:string}){
 const photos=(galleries as Record<string,Photo[]>)[slug]||[];
 if(!photos.length)return null;
 return <div data-project-gallery={slug} style={{marginTop:40,display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,320px),1fr))",gap:20}}>{photos.map((photo,i)=><figure key={photo.src} style={{margin:0}}><a href={photo.src} target="_blank" rel="noopener" aria-label={name+": открыть изображение "+(i+1)}><img src={photo.src} alt={name+" — "+photo.caption+", изображение "+(i+1)} width={photo.width} height={photo.height} loading="lazy" style={{display:"block",width:"100%",height:"auto",aspectRatio:"4 / 3",objectFit:"cover"}}/></a><figcaption className="mh-content-caption">{name} · {photo.caption}</figcaption></figure>)}</div>;
}
export function ProjectMarketUnits({slug,name}:{slug:string;name:string}){
 const units=(unitsData.units as Unit[]).filter(unit=>unit.projectSlug===slug);
 if(!units.length)return null;
 return <div style={{margin:"32px 0 48px"}}>
  <p className="mh-content-caption">Прайс проверен {date(units[0].fetchedAt)}. Условия оплаты и наличие уточним при подборе.</p>
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,290px),1fr))",gap:24}}>
   {units.map(unit=><article key={unit.id} data-market-unit={unit.id} style={{border:"1px solid #ddd8cd",padding:"clamp(20px,3vw,32px)",background:"#fffdfa",minWidth:0}}>
    {unit.planImageSrc&&<a href={unit.planImageSrc} target="_blank" rel="noopener" aria-label={"Открыть планировку "+unit.unitNumber}><img src={unit.planImageSrc} alt={"Планировка квартиры "+unit.unitNumber+", "+number(unit.areaSqm)+" м²"} width={700} height={700} loading="lazy" style={{width:"100%",height:"auto",aspectRatio:"1 / 1",objectFit:"contain",background:"#fff",marginBottom:24}}/></a>}
    <p className="mh-eyebrow" style={{marginBottom:16}}>{unit.buildingName} · № {unit.unitNumber}</p>
    <h3 style={{fontSize:"clamp(22px,2vw,30px)",lineHeight:1.25,margin:"0 0 20px"}}>{unit.unitType==="studio"||(unit.rooms===1&&unit.bedrooms===0)?"Студия":unit.type==="Пентхаус"?"Пентхаус · "+unit.rooms+" комнаты":unit.rooms+"-комнатная квартира"}<br/>{number(unit.areaSqm)} м²</h3>
    <p style={{fontSize:"clamp(25px,2.5vw,34px)",lineHeight:1.2,margin:"0 0 8px",color:"#252b26"}}>{number(unit.priceRub)} ₽</p>
    {unit.priceBeforeDiscountRub&&unit.priceBeforeDiscountRub>unit.priceRub?<p style={{margin:"0 0 8px",fontSize:16,color:"#717568"}}><s>{number(unit.priceBeforeDiscountRub)} ₽</s></p>:null}
    {unit.pricePerSqm&&<p style={{fontSize:15,color:"#62695d",margin:"0 0 24px"}}>{number(unit.pricePerSqm)} ₽/м²</p>}
    <dl style={{fontSize:16,lineHeight:1.65,margin:0}}>
     <div style={{display:"flex",justifyContent:"space-between",gap:16}}><dt>Этаж</dt><dd style={{margin:0}}>{unit.floor}{unit.floorsTotal?" из "+unit.floorsTotal:""}</dd></div>
     {unit.finish&&<div style={{display:"flex",justifyContent:"space-between",gap:16}}><dt>Отделка</dt><dd style={{margin:0,textAlign:"right"}}>{unit.finish}</dd></div>}
     {unit.ceilingHeightM&&<div style={{display:"flex",justifyContent:"space-between",gap:16}}><dt>Потолки</dt><dd style={{margin:0}}>{number(unit.ceilingHeightM)} м</dd></div>}
     {unit.completionYear&&<div style={{display:"flex",justifyContent:"space-between",gap:16}}><dt>Срок в проекте</dt><dd style={{margin:0}}>{unit.completionYear}</dd></div>}
    </dl>
    {unit.features?.length?<p style={{fontSize:15,lineHeight:1.6,margin:"20px 0 0",color:"#62695d"}}>{unit.features.slice(0,2).join(" · ")}</p>:null}
    <a href={COMPANY.whatsapp+"?text="+encodeURIComponent("Интересует "+name+", квартира № "+unit.unitNumber+", "+number(unit.areaSqm)+" м², этаж "+unit.floor+". Цена в опубликованном прайсе "+number(unit.priceRub)+" ₽. Уточните наличие и условия покупки.")} target="_blank" rel="noopener noreferrer" className="mh-text-link" style={{marginTop:24,display:"inline-block"}}>Обсудить эту квартиру ↗</a>
   </article>)}
  </div>
 </div>;
}
