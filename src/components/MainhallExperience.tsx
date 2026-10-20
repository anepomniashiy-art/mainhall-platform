"use client";
import Link from "next/link";
import {InvestmentDesk} from "./InvestmentDesk";
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
   gsap.to(".hero-image",{scale:1.08,ease:"none",scrollTrigger:{trigger:".mh-hero",start:"top top",end:"bottom top",scrub:true}});
   gsap.utils.toArray<HTMLElement>("[data-reveal]",root.current).forEach(el=>{
    gsap.from(el,{y:35,opacity:0,duration:.85,scrollTrigger:{trigger:el,start:"top 92%",once:true}});
   });
  });
  return () => media.revert();
 },{scope:root});
 return <div ref={root} className="mh-experience mh-home-v2">
  <section className="mh-hero">
   <div className="hero-image-panel"><img className="hero-image" src="/images/projects/nicole.jpg" alt="Николь, MR Group — дневная архитектурная визуализация квартала" fetchPriority="high" width="1920" height="1080" /><span className="mh-image-credit">Николь · MR Group · визуализация</span></div>
   <div className="hero-content">
    <p className="mh-eyebrow hero-caption">МОСКВА / ИНВЕСТИЦИИ В НЕДВИЖИМОСТЬ</p>
    <h1><span className="hero-line"><span>На шаг</span></span><span className="hero-line"><span>раньше рынка.</span></span></h1>
    <div className="hero-bottom hero-caption"><p>Мы посчитали не только дом. Но и всё, что появится вокруг — скоро и не очень.</p><p className="hero-promise">Нам мало, чтобы вы купили.<br/>Нам нужно, чтобы вы заработали.</p><Link href="#selection" className="mh-pill">Выбрать направление <span>↗</span></Link></div>
   </div>
  </section>
  <section className="mh-intro mh-pad" id="approach">
   <div className="mh-section-head" data-reveal><p className="mh-eyebrow">01 / СМОТРИМ ГЛУБЖЕ</p><span>Бизнес+ · Премиум · Элитная недвижимость</span></div>
   <div className="mh-editorial-head" data-reveal><h2>Красивый дом —<br/><span>ещё не инвестиция.</span></h2><p>Хорошая покупка начинается там, где заканчивается презентация застройщика. Мы разбираем цену входа, будущий спрос и то, как вы выйдете из сделки.</p></div>
   <div className="mh-analysis-list">
    {[
      ["01","Что изменится вокруг","Новые станции, деловые кластеры, парки и преобразование бывших промзон. Смотрим, что уже заложено в цену, а что рынок ещё не оценил."],
      ["02","Сколько стоит вход","Сравниваем похожие квартиры, этажи, виды и условия оплаты. Считаем полную стоимость: покупка, отделка, содержание и расходы на выход."],
      ["03","Кто купит после вас","Определяем будущего покупателя или арендатора. Проверяем планировку, окружение и конкуренцию — красивый рендер не заменяет спрос."],
      ["04","Что может пойти иначе","Сравниваем сценарии: сроки сдвинулись, цены не выросли, продажа заняла больше времени. Решение должно выдержать и такой рынок."]
    ].map(([n,t,d])=><article className="mh-analysis-row" data-reveal key={n}><span className="mh-index">{n}</span><h3>{t}</h3><p>{d}</p></article>)}
   </div>
  </section>
  <section id="selection" className="mh-selection mh-pad">
   <div className="mh-section-head" data-reveal><p className="mh-eyebrow">02 / ПРОЕКТЫ В ФОКУСЕ</p><span>Москва · {editorialProjects.length} проектов в обзоре</span></div>
   <div className="mh-editorial-head" data-reveal><h2>Разные адреса.<br/><span>Разная логика покупки.</span></h2><p>Выбираем не название на фасаде. Разбираемся, почему именно здесь, почему сейчас и для какой задачи.</p></div>
   <div className="mh-featured-projects">{["high-life","opus","nicole"].map((slug,i)=>{const p=editorialProjects.find(p=>p.slug===slug)!;return <Link data-reveal href={"/projects/"+p.slug+"/"} key={p.slug} className="mh-featured-project"><img className="mh-featured-photo" src={"/images/projects/"+p.slug+".jpg"} alt={p.name+" — "+p.developer} width="800" height="600" loading="lazy"/><div className="mh-project-meta"><span>0{i+1} / {p.developer}</span><span>{p.className} ↗</span></div><h3>{p.name}</h3><p className="mh-project-location">{p.area}, Москва</p><p className="mh-project-thesis">{p.thesis}</p><span className="mh-text-link">Разобрать проект ↗</span></Link>})}</div>
   <div className="mh-list-bottom"><span>Проекты для изучения. Актуальные лоты и условия уточняем перед подбором.</span><Link href="/projects/" className="mh-text-link">Весь обзор проектов ↗</Link></div>
  </section>
  <InvestmentDesk/>
  <section className="mh-decision mh-pad">
   <div data-reveal><p className="mh-eyebrow">03 / ВАША ЗАДАЧА</p><h2>Сначала цель.<br/><span>Потом адрес.</span></h2></div>
   <div className="mh-strategy-list">
    {[["Купить раньше роста","Ищем недооценённые характеристики и изменения локации. Сопоставляем потенциал со сроком, на который вы готовы вложить деньги."],["Получать арендный доход","Считаем доход после отделки, простоя и содержания. Смотрим на спрос арендаторов и конкурирующее предложение."],["Жить. И сохранить капитал.","Подбираем под ваш образ жизни, но не выключаем расчёт: качество дома, окружение и возможность продать через несколько лет."]].map(([t,d])=><article data-reveal key={t}><h3>{t}</h3><p>{d}</p></article>)}
   </div>
  </section>
  <section className="mh-city-interlude"><img src="/images/badaevsky-day-02.jpg" alt="Бадаевский, Capital Group — дневная архитектурная визуализация квартала" width="1920" height="1080" loading="lazy"/><span className="mh-image-credit">Бадаевский · Capital Group · визуализация</span></section>
  <section className="mh-partner mh-pad">
   <div data-reveal><p className="mh-eyebrow">04 / ЛИЧНАЯ ЭКСПЕРТИЗА</p><h2>За решением<br/><span>стоит человек.</span></h2></div>
   <div className="mh-partner-copy" data-reveal><p className="mh-partner-name">Андрей Непомнящий</p><p className="mh-partner-role">Управляющий партнёр MAINHALL</p><p>В недвижимости с 2004 года. Опыт работы с московскими проектами — от башни «Федерация» до премиального жилого комплекса ELEVEN на Пресне.</p><p>Мне важно не провести экскурсию по красивым квартирам. Мне важно объяснить, где в покупке есть смысл — и где его нет.</p><a href={COMPANY.telegram} target="_blank" rel="noopener noreferrer" className="mh-text-link">Обсудить задачу лично ↗</a></div>
  </section>
  <section id="team" className="mh-team-section mh-pad"><div className="mh-section-head"><p className="mh-eyebrow">КОМАНДА</p><span>Люди, с которыми вы работаете лично</span></div><div className="mh-editorial-head"><h2>Знакомимся до сделки.</h2><p>За подбором, переговорами и сопровождением стоят конкретные люди. С первого разговора вы понимаете, с кем решаете свою задачу.</p></div><div className="mh-team-grid">{[
  ["andrey","Андрей Непомнящий","Управляющий партнёр MAINHALL"],
  ["margarita","Маргарита Непомнящая","Работа с клиентами"],
  ["igor","Игорь Константинов","Подбор объектов и работа с застройщиками"],
  ["marina","Марина Тебекина","Работа с инвесторами из Москвы и регионов"]
 ].map(([photo,name,role])=><article key={photo}><img src={"/images/team/"+photo+".jpg"} alt={name} width="360" height="360" loading="lazy"/><h3>{name}</h3><p>{role}</p><a href={COMPANY.whatsapp+"?text="+encodeURIComponent("Хочу обсудить подбор недвижимости. Специалист: "+name)} target="_blank" rel="noopener noreferrer" className="mh-text-link">Обсудить подбор ↗</a></article>)}</div></section>
  <section className="mh-process mh-pad">
   <div className="mh-section-head" data-reveal><p className="mh-eyebrow">05 / КАК РАБОТАЕМ</p><span>От первого разговора до сделки</span></div>
   <div className="mh-process-grid">{[["01","Разбираем задачу","Бюджет, срок, цель покупки и допустимая нагрузка. Сначала договариваемся, какой результат вам нужен."],["02","Сравниваем варианты","Короткий список с аргументами: почему эти проекты, чем отличаются условия и что стоит проверить."],["03","Проверяем конкретный лот","Цена, планировка, вид, график платежей и документы. Переходим от общей идеи к конкретным цифрам."],["04","Сопровождаем покупку","Помогаем пройти переговоры и оформление. Заранее обсуждаем дальнейший план: жить, сдавать или продавать."]].map(([n,t,d])=><article data-reveal key={n}><span className="mh-index">{n}</span><h3>{t}</h3><p>{d}</p></article>)}</div>
  </section>
  <section id="contact" className="mh-contact mh-pad" data-reveal><p className="mh-eyebrow">06 / НАЧНЁМ С ВАШЕЙ ЗАДАЧИ</p><div className="mh-contact-main"><h2>Что должен<br/>дать вам этот адрес?</h2><a href={COMPANY.telegram} target="_blank" rel="noopener noreferrer" className="mh-contact-arrow" aria-label="Обсудить покупку в Telegram">↗</a></div><p className="mh-contact-description">Расскажите о бюджете, сроке и цели покупки. Обсудим, с каких проектов имеет смысл начать.</p><div className="mh-contact-links"><a href={"tel:"+COMPANY.phone.replace(/[\s()-]/g,"")}>{COMPANY.phone}</a><a href={COMPANY.telegram} target="_blank" rel="noopener noreferrer">Telegram ↗</a><a href={COMPANY.whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp ↗</a></div><p className="mh-investment-note">Потенциал роста — сценарий, а не обещание доходности. Условия покупки и наличие проверяем на дату запроса.</p></section>
 </div>;
}
