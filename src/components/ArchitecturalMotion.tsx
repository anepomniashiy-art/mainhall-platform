"use client";
import {useEffect,useRef,useState} from "react";
import type {AnimationItem} from "lottie-web";

/** Transparent architectural study. The static drawing also covers reduced motion and loading. */
export function ArchitecturalMotion(){
 const root=useRef<HTMLDivElement>(null);
 const [ready,setReady]=useState(false);
 useEffect(()=>{
  const el=root.current;
  if(!el||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  let animation:AnimationItem|undefined, disposed=false, loading=false;
  const observer=new IntersectionObserver(async([entry])=>{
   if(!entry.isIntersecting){animation?.pause();return;}
   if(animation){animation.play();return;}
   if(loading)return;loading=true;
   try{
    const {default:lottie}=await import("lottie-web");
    if(disposed)return;
    animation=lottie.loadAnimation({container:el.querySelector(".mh-motion-player")!,renderer:"svg",loop:false,autoplay:false,path:"/projects/mainhall/scene-1/lottie.json"});
    animation.addEventListener("DOMLoaded",()=>{if(!disposed){setReady(true);if(el.getBoundingClientRect().top<innerHeight)animation?.play();}});
   }catch{/* The architectural drawing remains visible if animation cannot load. */}
  },{threshold:.15});
  observer.observe(el);
  return()=>{disposed=true;observer.disconnect();animation?.destroy();};
 },[]);
 return <div className="mh-architectural-motion" ref={root} aria-hidden="true"><svg className={ready?"mh-motion-fallback is-hidden":"mh-motion-fallback"} viewBox="0 0 244 220" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M36 192V68H136V192M72 192V40H172V192M108 192V12H208V192"/></svg><div className="mh-motion-player"/></div>;
}
