import {COMPANY} from "@/lib/constants";
export function TeamSection(){return (<section id="team" className="mh-team-section mh-pad"><div className="mh-section-head"><p className="mh-eyebrow">КОМАНДА</p><span>Люди, с которыми вы работаете лично</span></div><div className="mh-editorial-head"><h2>Знакомимся до сделки.</h2><p>За подбором, переговорами и сопровождением стоят конкретные люди. С первого разговора вы понимаете, с кем решаете свою задачу.</p></div><div className="mh-team-grid">{[
  ["andrey","Андрей Непомнящий","Управляющий партнёр MAINHALL"],
  ["margarita","Маргарита Непомнящая","Работа с клиентами"],
  ["igor","Игорь Константинов","Подбор объектов и работа с застройщиками"],
  ["marina","Марина Тебекина","Работа с инвесторами из Москвы и регионов"],
  ["pavel","Павел Евтеев","Директор по работе с частными инвесторами и привилегированными клиентами"],
  ["evgeny","Евгений Прохоров","Директор по работе с частными инвесторами и привилегированными клиентами"]
 ].map(([photo,name,role])=><article key={photo}><div className={"mh-team-portrait mh-team-portrait-"+photo}><img src={"/images/team/"+(photo==="evgeny"?"evgeny-portrait":photo)+".jpg"} alt={name} width={photo==="pavel"?709:photo==="evgeny"?1281:360} height={photo==="pavel"?1536:photo==="evgeny"?1920:360} loading="lazy"/></div><h3>{name}</h3><p>{role}</p><a href={COMPANY.whatsapp+"?text="+encodeURIComponent("Хочу обсудить подбор недвижимости. Специалист: "+name)} target="_blank" rel="noopener noreferrer" className="mh-text-link">Обсудить подбор ↗</a></article>)}</div></section>);}
