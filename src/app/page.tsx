import Link from "next/link";
import Image from "next/image";
import {COMPANY} from "@/lib/constants";
import {editorialProjects} from "@/lib/editorial-projects";
import heroForum from "@/media/forum-hero.webp";
const steps=[
 {n:"01",title:"Отбираем потенциал",copy:"Изучаем микрорайон, девелопера, стадии строительства и альтернативные предложения."},
 {n:"02",title:"Считаем сценарии",copy:"Оцениваем денежный поток, расходы, риски, аренду и ликвидность — без обещаний гарантированной доходности."},
 {n:"03",title:"Выбираем момент",copy:"Сопоставляем реальные условия покупки, рассрочки и срок выхода из инвестиции."}
];
export default function HomePage(){return <div className="bg-[#F8F7F4] text-[#1E2B22]">
<section className="bg-gradient-to-b from-[#F6F4EE] to-[#EEECE4] text-[#17251C]">
 <div className="mx-auto max-w-7xl px-6 pt-28 pb-20 lg:py-36 grid lg:grid-cols-[1fr_1.05fr] gap-16 lg:gap-24 items-center">
 <div>
  <p className="text-[11px] font-medium uppercase tracking-[.22em] text-[#8A9784]">MAINHALL · Investment Advisory · Moscow</p>
  <h1 className="mt-9 font-serif text-6xl sm:text-7xl lg:text-[7rem] leading-[1.0] tracking-[-.03em] text-[#1A251D]">Шаг раньше<br/>рынка.</h1>
  <p className="mt-10 max-w-md text-lg leading-[1.75] text-[#5D6B57]">Инвестируем в потенциал, не в метры. Находим в премиальной жилой недвижимости Москвы стоимость, которую рынок ещё не отразил в цене, и проверяем гипотезы цифрами.</p>
  <div className="mt-12 flex flex-wrap items-center gap-4">
   <Link href="/projects" className="group inline-flex items-center gap-2 rounded-sm bg-[#17251C] px-9 py-4 text-sm font-medium text-[#F4F2EC] shadow-[0_18px_40px_-18px_rgba(23,37,28,0.45)] transition-all duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.02] hover:shadow-[0_26px_60px_-20px_rgba(23,37,28,0.5)]">Исследовать проекты <span className="transition-transform duration-500 group-hover:translate-x-1">↗</span></Link>
   <a href="#approach" className="rounded-sm border border-black/[0.08] px-8 py-4 text-sm text-[#5A5440] transition-all duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:border-black/20 hover:bg-white/50">Наш подход ↓</a>
  </div>
  <p className="mt-12 text-[11px] font-medium uppercase tracking-[.2em] text-[#9AA594]">Сегмент бизнес-плюс, премиум и элит · от 600&nbsp;000&nbsp;₽/м²</p>
 </div>
 <div className="group relative">
  <div className="relative aspect-[5/4] w-full overflow-hidden rounded-[3px] border border-black/[0.04] shadow-[0_40px_80px_-28px_rgba(23,37,28,0.22)] transition-transform duration-700 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.01]">
   <Image src={heroForum} alt="Клубный дом ФОРУМ (MR Group), вид на башню" fill priority sizes="(max-width:1024px) 100vw, 50vw" className="object-cover" />
  </div>
  <span className="absolute bottom-4 right-4 rounded-sm border border-black/[0.05] bg-white/60 px-3.5 py-1.5 text-[11px] tracking-wide text-[#3A4A3D] backdrop-blur-xl">ЖК ФОРУМ · MR&nbsp;Group</span>
 </div>
 </div>
</section>
<section id="approach" className="mx-auto max-w-7xl px-5 py-24 md:py-32"><p className="uppercase text-xs tracking-[.3em] text-[#7B907E]">Философия MAINHALL</p><div className="mt-8 grid gap-12 lg:grid-cols-2"><h2 className="font-serif text-4xl md:text-6xl leading-[1.1]">Мы не продаём квадратные метры. Мы изучаем инвестиционную перспективу.</h2><div className="text-lg leading-8 text-[#5A685D]"><p>Хорошая недвижимость не всегда становится хорошей инвестицией. Значение имеют цена входа, условия платежей, предложение конкурентов, расходы и стратегия выхода.</p><p className="mt-6">Поэтому каждую гипотезу сопровождаем источниками, актуальностью данных, альтернативными сценариями и ограничениями расчётов.</p></div></div>
<div className="mt-20 grid gap-9 md:grid-cols-3">{steps.map(s=><div className="border-t border-[#B7C2B8] pt-6" key={s.n}><span className="text-xs text-[#7B907E]">{s.n} / METHOD</span><h3 className="font-serif text-3xl mt-7">{s.title}</h3><p className="mt-4 leading-7 text-[#5A685D]">{s.copy}</p></div>)}</div></section>
<section className="bg-[#E5E9E1] py-24"><div className="mx-auto max-w-7xl px-5"><div className="flex flex-wrap justify-between items-end gap-6"><div><p className="text-xs uppercase tracking-[.3em] text-[#617364]">Research universe</p><h2 className="mt-5 font-serif text-4xl md:text-6xl">Проекты под наблюдением</h2></div><Link href="/projects" className="border-b border-[#3A5842] py-2 text-sm">Открыть каталог ↗</Link></div><div className="mt-12 grid gap-5 md:grid-cols-3">{editorialProjects.slice(0,6).map(p=><Link href={"/projects/"+p.slug} key={p.slug} className="group bg-[#FAFAF7] p-8 min-h-[255px] flex flex-col"><p className="uppercase tracking-widest text-xs text-[#738575]">{p.className} · {p.area}</p><h3 className="font-serif text-3xl mt-8">{p.name}</h3><p className="text-sm text-[#657368] mt-3">{p.developer}</p><span className="mt-auto pt-8 text-sm text-[#536D59] group-hover:translate-x-1 transition-transform">Инвестиционный обзор ↗</span></Link>)}</div><p className="mt-6 text-center text-sm text-[#68776B]">Всего {editorialProjects.length} проектов под наблюдением · <Link href="/projects" className="underline underline-offset-4">Открыть полный каталог ↗</Link></p><p className="mt-4 text-sm text-[#68776B]">Реестр исследуемых проектов, не перечень подтверждённых свободных квартир. Цены и наличие уточняются у девелоперов.</p></div></section>
<section className="mx-auto max-w-7xl px-5 py-24 lg:py-32 grid lg:grid-cols-2 gap-14"><div><p className="text-xs uppercase tracking-[.3em] text-[#748975]">Investment intelligence</p><h2 className="mt-6 font-serif text-4xl md:text-6xl">У доходности всегда есть контекст.</h2></div><div className="space-y-6 text-[#526254] leading-7"><p>Вместо рекламных процентов — несколько сценариев: покупка и перепродажа, сдача в аренду, длительное владение. Считаем расходы и проверяем чувствительность результата к цене выхода и срокам.</p><p>Точные расчёты появляются только при наличии верифицированных цен, условий покупки и рыночных сопоставлений.</p></div></section>
<section id="contact" className="bg-[#14241B] text-[#F2F4EC] py-24"><div className="mx-auto max-w-7xl px-5 flex flex-col md:flex-row gap-12 items-start justify-between"><div><p className="text-xs tracking-[.3em] uppercase text-[#9EB09E]">MAINHALL / Private Advisory</p><h2 className="font-serif text-4xl md:text-6xl mt-6">Давайте обсудим<br/>ваш капитал.</h2><p className="mt-6 text-[#B8C9B8]">Начнём с целей, горизонта и допустимого риска.</p></div><div className="flex flex-col gap-4 w-full md:w-auto"><a className="px-9 py-4 bg-[#C2D1B9] text-[#14241B] text-center" href={COMPANY.telegram} target="_blank" rel="noopener noreferrer">Написать в Telegram ↗</a><a className="px-9 py-4 border border-[#8C9E8C] text-center" href={COMPANY.whatsapp} target="_blank" rel="noopener noreferrer">Связаться в WhatsApp ↗</a><Link href="/commercial" className="text-sm mt-5 text-[#9CAF9B] underline underline-offset-4">Коммерческая недвижимость MAINHALL</Link></div></div></section>
</div>}