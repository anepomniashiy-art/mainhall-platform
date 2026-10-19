"use client";
import Link from "next/link";
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { COMPANY } from "@/lib/constants";
import { editorialProjects } from "@/lib/editorial-projects";
gsap.registerPlugin(useGSAP, ScrollTrigger);

export function MainhallExperience() {
 const root = useRef<HTMLDivElement>(null);
 useGSAP(() => {
  const media = gsap.matchMedia();
  media.add("(prefers-reduced-motion: no-preference)", () => {
   gsap.timeline({defaults:{ease:"power3.out"}})
    .from(".hero-image",{scale:1.06,duration:1.8,ease:"power2.out"},0)
    .from(".hero-line span",{yPercent:110,duration:1.15,stagger:.12},.15)
    .from(".hero-caption",{y:18,opacity:0,duration:.8},"-=.6");
   gsap.to(".hero-image",{yPercent:12,ease:"none",scrollTrigger:{trigger:".mh-hero",start:"top top",end:"bottom top",scrub:true}});
   gsap.utils.toArray<HTMLElement>("[data-reveal]",root.current).forEach(el=>{
    gsap.from(el,{y:35,opacity:0,duration:.85,scrollTrigger:{trigger:el,start:"top 92%",once:true}});
   });
  });
  return () => media.revert();
 },{scope:root});
 return <div ref={root} className="mh-experience">
  <section className="mh-hero">
   {/* Official Capital Group rendering of Badaevsky. */}
   {/* eslint-disable-next-line @next/next/no-img-element */}
   <img className="hero-image" src="/images/badaevsky-day-02.jpg" alt="Бадаевский, Capital Group — дневная визуализация жилого квартала" fetchPriority="high" width="1920" height="1080" />
   <div className="hero-shade" />
   <div className="hero-topline"><span>Частное агентство недвижимости</span><span>Москва, Россия</span></div>
   <div className="hero-content"><p className="mh-eyebrow hero-caption">MAINHALL / MOSCOW REAL ESTATE</p>
    <h1><span className="hero-line"><span>На шаг</span></span><span className="hero-line"><span>раньше рынка.</span></span></h1>
    <div className="hero-bottom hero-caption"><p>Мы посчитали не только дом. Но и всё, что появится вокруг — скоро и не очень.<br/>Нам мало, чтобы вы купили. Нам нужно, чтобы вы заработали.</p><Link href="/projects/" className="mh-pill">Смотреть проекты <span>↗</span></Link></div>
   </div>
   <div className="hero-foot"><a href="#selection">Листайте вниз ↓</a><span>Бадаевский · Capital Group</span></div>
  </section>
  <section id="selection" className="mh-selection mh-pad">
   <div className="mh-section-head" data-reveal><p className="mh-eyebrow">01 / ВЫБОР MAINHALL</p><span>17 проектов · Москва</span></div>
   <div className="mh-editorial-head" data-reveal><h2>Город.<br/><span>Ваш масштаб.</span></h2><p>Камерные дома и новые доминанты.<br/>Отбираем то, что имеет значение.</p></div>
   <div className="mh-project-list">{editorialProjects.slice(0,5).map((p,i)=><Link data-reveal href={"/projects/"+p.slug+"/"} key={p.slug} className="mh-project-row"><span className="mh-index">0{i+1}</span><h3>{p.name}</h3><span className="mh-row-area">{p.area}</span><span className="mh-row-type">{p.className}</span><span className="mh-row-arrow">↗</span></Link>)}</div>
   <div className="mh-list-bottom"><span>Редакционная подборка. Наличие — по запросу.</span><Link href="/projects/" className="mh-text-link">Все 17 проектов ↗</Link></div>
  </section>
  <section id="approach" className="mh-vision">
   {/* eslint-disable-next-line @next/next/no-img-element */}
   <img src="/images/badaevsky-day-01.jpg" alt="Бадаевский, Capital Group — озеленённая пешеходная улица" width="1920" height="1080" loading="lazy" />
   <div className="vision-shade"/><div className="vision-content" data-reveal><p className="mh-eyebrow">02 / НАШ ПОДХОД</p><h2>Меньше случайного.<br/>Больше вашего.</h2><p>Локация. Архитектура. Перспектива.</p><a href={COMPANY.telegram} target="_blank" rel="noopener noreferrer" className="mh-text-link">Обсудить выбор ↗</a></div>
  </section>
  <section id="contact" className="mh-contact mh-pad" data-reveal><p className="mh-eyebrow">03 / ЛИЧНЫЙ ДИАЛОГ</p><div className="mh-contact-main"><h2>Начнём<br/>с разговора.</h2><a href={COMPANY.telegram} target="_blank" rel="noopener noreferrer" className="mh-contact-arrow" aria-label="Написать в Telegram">↗</a></div><div className="mh-contact-links"><a href={"tel:"+COMPANY.phone.replace(/[\s()-]/g,"")}>{COMPANY.phone}</a><a href={COMPANY.telegram} target="_blank" rel="noopener noreferrer">Telegram ↗</a><a href={COMPANY.whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp ↗</a></div></section>
 </div>;
}
