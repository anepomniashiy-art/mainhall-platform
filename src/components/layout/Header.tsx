"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { COMPANY } from "@/lib/constants";
const nav=[{label:"Проекты",href:"/projects/"},{label:"Районы",href:"/districts/"},{label:"Аналитика",href:"/analytics/"},{label:"Рассрочки",href:"/installments/"},{label:"Команда",href:"/about/"},{label:"Коммерческая",href:"/commercial/"}];
export function Header(){const [open,setOpen]=useState(false);const path=usePathname();return <header className={"mh-header "+(path==="/"?"mh-header-home":"")}><Link href="/" className="mh-wordmark" onClick={()=>setOpen(false)}>MAINHALL<span>®</span></Link><nav aria-label="Основная навигация" className="mh-desktop-nav">{nav.map(n=><Link href={n.href} key={n.href}>{n.label}</Link>)}</nav><a className="mh-header-contact" href={COMPANY.telegram} target="_blank" rel="noopener noreferrer">Связаться ↗</a><button className="mh-menu-toggle" aria-expanded={open} aria-controls="mobile-nav" aria-label={open?"Закрыть меню":"Открыть меню"} onClick={()=>setOpen(!open)}>{open?"Закрыть −":"Меню +"}</button>{open&&<nav id="mobile-nav" className="mh-mobile-nav" aria-label="Мобильная навигация">{nav.map(n=><Link key={n.href} href={n.href} onClick={()=>setOpen(false)}>{n.label}</Link>)}<Link href="/contacts/" onClick={()=>setOpen(false)}>Контакты ↗</Link></nav>}</header>}
