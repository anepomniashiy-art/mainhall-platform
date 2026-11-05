"use client";

import {useEffect,useRef} from "react";
import {usePathname} from "next/navigation";
import {COMPANY} from "@/lib/constants";

type MetrikaFunction=((...args:unknown[])=>void)&{a?:unknown[][];l?:number};
declare global {interface Window {ym?:MetrikaFunction}}

/** Contact goals record intent to contact MAINHALL, not a delivered message or sale. */
export function Analytics({counterId}:{counterId:number}){
 const pathname=usePathname();
 const previousPath=useRef<string|null>(null);
 useEffect(()=>{
  // Technical previews must not pollute production reports.
  if(!["main-hall.ru","www.main-hall.ru"].includes(window.location.hostname))return;
  if(!window.ym){
   const ym:MetrikaFunction=(...args:unknown[])=>{(ym.a??=[]).push(args);};
   ym.l=Date.now();window.ym=ym;
  }
  if(!document.querySelector('script[data-mainhall-metrika]')){
   const script=document.createElement("script");
   script.src="https://mc.yandex.ru/metrika/tag.js";script.async=true;
   script.dataset.mainhallMetrika="true";document.head.appendChild(script);
   window.ym(counterId,"init",{clickmap:true,trackLinks:false,accurateTrackBounce:true,webvisor:false});
  }
  const click=(event:MouseEvent)=>{
   if(!(event.target instanceof Element))return;
   const link=event.target.closest<HTMLAnchorElement>('a[href]');
   if(!link)return;
   const href=link.href;
   const cleanPhone=(value:string)=>value.replace(/[^\d+]/g,"");
   let goal:string|undefined;
   if(href.startsWith("tel:")&&cleanPhone(href.slice(4))===cleanPhone(COMPANY.phone))goal="contact_phone";
   else if(href.startsWith("mailto:")&&href.slice(7).split("?")[0].toLowerCase()===COMPANY.email.toLowerCase())goal="contact_email";
   else {
    try {
     const url=new URL(href);
     if(url.origin+url.pathname===COMPANY.telegram)goal="contact_telegram";
     if(url.origin+url.pathname===COMPANY.whatsapp)goal="contact_whatsapp";
    }catch{/* Only complete MAINHALL contact links are measured. */}
   }
   // No form values, phone numbers or message text are sent as event parameters.
   if(goal)window.ym?.(counterId,"reachGoal",goal);
  };
  const submitted=()=>window.ym?.(counterId,"reachGoal","enquiry_submitted");
  document.addEventListener("click",click);
  document.addEventListener("mainhall:enquiry-submitted",submitted);
  return ()=>{document.removeEventListener("click",click);document.removeEventListener("mainhall:enquiry-submitted",submitted);};
 },[counterId]);
 useEffect(()=>{
  if(!["main-hall.ru","www.main-hall.ru"].includes(window.location.hostname))return;
  if(previousPath.current!==null&&previousPath.current!==pathname)window.ym?.(counterId,"hit",window.location.origin+pathname);
  previousPath.current=pathname;
 },[pathname,counterId]);
 return null;
}
