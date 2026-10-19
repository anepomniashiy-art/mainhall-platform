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
<section className="bg-[#F3F1EA] text-[#17251C]">
 <div className="mx-auto max-w-7xl px-5 pt-24 pb-14 lg:py-24 grid lg:grid-cols-[1fr_1.04fr] gap-12 lg:gap-16 items-center">
 <div>
  <p className="text-xs uppercase tracking-[.38em] text-[#7E9079]">MAINHALL / Investment Advisory / Moscow</p>
  <h1 className="mt-8 font-serif text-5xl sm:text-7xl lg:text-[6.4rem] leading-[1.02] tracking-[-.035em]">Шаг раньше<br/><em className="not-italic text-[#3E6B4A]">рынка.</em></h1>
  <p className="mt-9 max-w-xl text-lg leading-8 text-[#55634F]">Инвестируем в потенциал, не в метры. Находим в премиальной жилой недвижимости Москвы стоимость, которую рынок ещё не отразил в цене, и проверяем гипотезы цифрами.</p>
  <div className="mt-11 flex flex-wrap items-center gap-4">
   <Link href="/projects" className="bg-[#17251C] px-8 py-4 text-[#F3F1EA] text-sm font-medium hover:bg-[#24402D] transition-colors">Исследовать проекты ↗</Link>
   <a href="#approach" className="border border-[#C3B48E] px-8 py-4 text-sm text-[#5A5440] hover:bg-[#EBE5D8] transition-colors">Наш подход ↓</a>
  </div>
  <p className="mt-10 text-sm text-[#6C7A69]">Бизнес-плюс, премиум и элитный сегмент · от 600&nbsp;000&nbsp;₽/м² в стартовом фильтре.</p>
 </div>
 <div className="relative">
  <div className="relative aspect-[5/4] w-full overflow-hidden rounded-sm shadow-[0_40px_90px_-50px_rgba(23,37,28,.55)]">
   <Image src={heroForum} alt="Клубный дом ФОРУМ, MR Group — вид на башню" fill priority sizes="(max-width:1024px) 100vw, 50vw" className="object-cover" />
  </div>
  <span className="absolute bottom-3 right-3 bg-white/85 backdrop-blur-sm px-3 py-1 text-[11px] tracking-wide text-[#3A4A3D]">ЖК ФОРУМ · MR&nbsp;Group</span>
 </div>
 </div>
</section>
<section id="approach" className="mx-auto max-w-7xl px-5 py-24 md:py-32"><p className="uppercase text-xs tracking-[.3em] text-[#7B907E]">Философия MAINHALL</p><div className="mt-8 grid gap-12 lg:grid-cols-2"><h2 className="font-serif text-4xl md:text-6xl leading-[1.1]">Мы не продаём квадратные метры. Мы изучаем инвестиционную перспективу.</h2><div className="text-lg leading-8 text-[#5A685D]"><p>Хорошая недвижимость не всегда становится хорошей инвестицией. Значение имеют цена входа, условия платежей, предложение конкурентов, расходы и стратегия выхода.</p><p className="mt-6">Поэтому каждую гипотезу сопровождаем источниками, актуальностью данных, альтернативными сценариями и ограничениями расчётов.</p></div></div>
<div className="mt-20 grid gap-9 md:grid-cols-3">{steps.map(s=><div className="border-t border-[#B7C2B8] pt-6" key={s.n}><span className="text-xs text-[#7B907E]">{s.n} / METHOD</span><h3 className="font-serif text-3xl mt-7">{s.title}</h3><p className="mt-4 leading-7 text-[#5A685D]">{s.copy}</p></div>)}</div></section>
<section className="bg-[#E5E9E1] py-24"><div className="mx-auto max-w-7xl px-5"><div className="flex flex-wrap justify-between items-end gap-6"><div><p className="text-xs uppercase tracking-[.3em] text-[#617364]">Research universe</p><h2 className="mt-5 font-serif text-4xl md:text-6xl">Проекты под наблюдением</h2></div><Link href="/projects" className="border-b border-[#3A5842] py-2 text-sm">Открыть каталог ↗</Link></div><div className="mt-12 grid gap-5 md:grid-cols-3">{editorialProjects.slice(0,6).map(p=><Link href={"/projects/"+p.slug} key={p.slug} className="group bg-[#FAFAF7] p-8 min-h-[255px] flex flex-col"><p className="uppercase tracking-widest text-xs text-[#738575]">{p.className} · {p.area}</p><h3 className="font-serif text-3xl mt-8">{p.name}</h3><p className="text-sm text-[#657368] mt-3">{p.developer}</p><span className="mt-auto pt-8 text-sm text-[#536D59] group-hover:translate-x-1 transition-transform">Инвестиционный обзор ↗</span></Link>)}</div><p className="mt-6 text-center text-sm text-[#68776B]">Всего {editorialProjects.length} проектов под наблюдением · <Link href="/projects" className="underline underline-offset-4">Открыть полный каталог ↗</Link></p><p className="mt-4 text-sm text-[#68776B]">Реестр исследуемых проектов, не перечень подтверждённых свободных квартир. Цены и наличие уточняются у девелоперов.</p></div></section>
<section className="mx-auto max-w-7xl px-5 py-24 lg:py-32 grid lg:grid-cols-2 gap-14"><div><p className="text-xs uppercase tracking-[.3em] text-[#748975]">Investment intelligence</p><h2 className="mt-6 font-serif text-4xl md:text-6xl">У доходности всегда есть контекст.</h2></div><div className="space-y-6 text-[#526254] leading-7"><p>Вместо рекламных процентов — несколько сценариев: покупка и перепродажа, сдача в аренду, длительное владение. Считаем расходы и проверяем чувствительность результата к цене выхода и срокам.</p><p>Точные расчёты появляются только при наличии верифицированных цен, условий покупки и рыночных сопоставлений.</p></div></section>
<section id="contact" className="bg-[#14241B] text-[#F2F4EC] py-24"><div className="mx-auto max-w-7xl px-5 flex flex-col md:flex-row gap-12 items-start justify-between"><div><p className="text-xs tracking-[.3em] uppercase text-[#9EB09E]">MAINHALL / Private Advisory</p><h2 className="font-serif text-4xl md:text-6xl mt-6">Давайте обсудим<br/>ваш капитал.</h2><p className="mt-6 text-[#B8C9B8]">Начнём с целей, горизонта и допустимого риска.</p></div><div className="flex flex-col gap-4 w-full md:w-auto"><a className="px-9 py-4 bg-[#C2D1B9] text-[#14241B] text-center" href={COMPANY.telegram} target="_blank" rel="noopener noreferrer">Написать в Telegram ↗</a><a className="px-9 py-4 border border-[#8C9E8C] text-center" href={COMPANY.whatsapp} target="_blank" rel="noopener noreferrer">Связаться в WhatsApp ↗</a><Link href="/commercial" className="text-sm mt-5 text-[#9CAF9B] underline underline-offset-4">Коммерческая недвижимость MAINHALL</Link></div></div></section>
</div>}