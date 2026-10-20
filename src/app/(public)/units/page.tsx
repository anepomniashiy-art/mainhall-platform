import type {Metadata} from "next";
import Link from "next/link";
import {ProjectEnquiry} from "@/components/ProjectEnquiry";
export const metadata:Metadata={title:"Подбор квартир — MAINHALL",description:"Подбор квартир в новостройках Москвы: планировки, этажи, виды, цены и условия оплаты на дату запроса."};
export default function UnitsPage(){return <main className="mh-pad mh-project-detail"><p className="mh-eyebrow">MAINHALL / ПОДБОР КВАРТИР</p><h1>Не просто квартира.<br/>Ваш вариант.</h1><p style={{fontSize:18,lineHeight:1.7,maxWidth:700}}>Сравним квартиры по цене входа, планировке, виду и графику платежей. Получите актуальные предложения под вашу задачу.</p><ProjectEnquiry name="новостройках Москвы"/><Link href="/projects/" className="mh-text-link">Сначала выбрать проект ↗</Link></main>}
