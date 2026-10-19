import Link from "next/link";
import { COMPANY } from "@/lib/constants";
import { editorialProjects } from "@/lib/editorial-projects";

/* Pairing: Cormorant Garamond (display) + Manrope (body).
   Display tracking -0.045em / line-height 0.96; labels tracking +0.18em / line-height 1.6. */
export default function HomePage() {
 const top = editorialProjects.slice(0, 4);
 return <main className="mh-site">
  <header className="mh-header"><Link href="/" className="mh-brand" aria-label="MAINHALL — главная"><span className="mh-brand-symbol">M<span className="mh-brand-rule"/>H</span><span className="mh-brand-text">MAINHALL</span></Link><nav aria-label="Основное меню"><Link href="/projects/">Проекты</Link><Link href="/commercial/">Коммерческая недвижимость</Link><a href="#contact">Связаться <span>↗</span></a></nav></header>
  <section className="mh-stage" aria-label="Инвестиционная недвижимость MAINHALL">
   <div className="mh-stage-sticky">
    <div className="mh-stage-image" aria-hidden="true" />
    <div className="mh-stage-shade" aria-hidden="true" />
    <div className="mh-stage-top"><span>PRIVATE REAL ESTATE ADVISORY</span><span>МОСКВА / 2026</span></div>
    <div className="mh-stage-title"><p className="mh-kicker">MAINHALL · PRIVATE INVESTMENT OFFICE</p><h1>Шаг раньше<br/><em>рынка.</em></h1><div className="mh-stage-caption"><span className="mh-marker">01 / 03</span><p>Там, где другие видят квадратные метры,<br/>мы видим будущую стоимость.</p></div></div>
    <div className="mh-stage-bottom"><span>ИНВЕСТИЦИИ В ЖИЛУЮ НЕДВИЖИМОСТЬ</span><span>SCROLL TO EXPLORE ↓</span></div>
   </div>
  </section>
  <section className="mh-reveal" id="approach"><p className="mh-eyebrow">01 / ФИЛОСОФИЯ MAINHALL</p><div className="mh-reveal-grid"><h2>Не следуем<br/>за рынком.<br/><em>Определяем момент.</em></h2><div className="mh-reveal-text"><p>В премиальной недвижимости важно не только то, что приобретаешь. Важно — когда, на каких условиях и с какой стратегией выхода.</p><p>Мы изучаем проекты, оцениваем альтернативы и отделяем реальный потенциал от красивой презентации.</p><Link href="/projects/" className="mh-text-link">Наш взгляд на проекты <span>↗</span></Link></div></div></section>
  <section className="mh-editorial"><div className="mh-editorial-heading"><p className="mh-eyebrow">02 / ОБЪЕКТЫ ПОД НАБЛЮДЕНИЕМ</p><h2>Архитектура<br/><em>возможностей.</em></h2><Link href="/projects/" className="mh-text-link">Все {editorialProjects.length} проектов ↗</Link></div><div className="mh-projects">{top.map((p,i)=><Link className="mh-project" key={p.slug} href={"/projects/"+p.slug+"/"}><span className="mh-project-index">0{i+1}</span><div><span className="mh-project-meta">{p.area} · {p.className}</span><h3>{p.name}</h3><span className="mh-project-developer">{p.developer}</span></div><span className="mh-project-arrow">↗</span></Link>)}</div><p className="mh-disclaimer">Исследовательский список проектов. Не является подтверждением наличия квартир или актуальной цены.</p></section>
  <section className="mh-principle"><div className="mh-principle-art" aria-hidden="true"><span className="mh-orbit mh-orbit-one"/><span className="mh-orbit mh-orbit-two"/><span className="mh-orbit mh-orbit-three"/><span className="mh-orbit-dot"/></div><p className="mh-eyebrow">03 / МЕТОД</p><h2>Сначала перспектива.<br/><em>Потом метры.</em></h2><div className="mh-principle-foot"><span>НЕ РЕКЛАМА. АНАЛИТИЧЕСКИЙ ВЫБОР.</span><Link href="/projects/" className="mh-text-link">Исследовать каталог ↗</Link></div></section>
  <footer id="contact" className="mh-footer"><p className="mh-eyebrow">MAINHALL / MOSCOW</p><h2>Обсудим<br/><em>следующий шаг.</em></h2><div className="mh-footer-links"><a href={COMPANY.telegram} target="_blank" rel="noopener noreferrer">Telegram ↗</a><a href={COMPANY.whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp ↗</a><Link href="/commercial/">Коммерческая недвижимость ↗</Link></div><div className="mh-footer-sign">M — H <span>PRIVATE INVESTMENT ADVISORY</span></div></footer>
 </main>;
}
