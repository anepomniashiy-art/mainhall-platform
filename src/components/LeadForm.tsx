'use client';
import Link from 'next/link';
import {useState,type FormEvent} from 'react';

export function LeadForm({context='Подбор недвижимости',preferences=''}:{context?:string;preferences?:string}){
 const [status,setStatus]=useState<'idle'|'sending'|'sent'|'error'>('idle');
 const [error,setError]=useState('');
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(status==='sending')return;
  const form=event.currentTarget,data=new FormData(form);
  setStatus('sending');setError('');
  try{
   const response=await fetch('/api/enquiry',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:String(data.get('name')||''),phone:String(data.get('phone')||''),context,comment:preferences,consent:data.get('consent')==='on',website:String(data.get('website')||'')})});
   if(!response.ok)throw new Error(response.status===429?'Слишком много запросов. Попробуйте позже или позвоните нам.':'Не удалось отправить заявку. Попробуйте ещё раз или свяжитесь с нами по телефону.');
   setStatus('sent');form.reset();document.dispatchEvent(new CustomEvent('mainhall:enquiry-submitted'));
  }catch(e){setStatus('error');setError(e instanceof Error?e.message:'Не удалось отправить заявку.');}
 }
 return <form className="mh-lead-form" onSubmit={submit} aria-label={'Заявка: '+context}>
  <div className="mh-lead-fields"><label>Как к вам обращаться<input name="name" autoComplete="name" maxLength={120} placeholder="Ваше имя"/></label><label>Телефон<input name="phone" type="tel" autoComplete="tel" required minLength={7} maxLength={32} placeholder="+7 …"/></label></div>
  <div className="mh-form-trap" aria-hidden="true"><label>Сайт<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
  <label className="mh-lead-consent"><input name="consent" type="checkbox" required/><span>Согласен на обработку имени, телефона и параметров запроса, чтобы MAINHALL связался со мной по заявке. <Link href="/privacy/">Условия обработки данных</Link>.</span></label>
  <button className="mh-pill" type="submit" disabled={status==='sending'||status==='sent'}>{status==='sending'?'Отправляем…':status==='sent'?'Заявка получена':'Отправить заявку'} <span aria-hidden>↗</span></button>
  <p role="status" aria-live="polite">{status==='sent'?'Заявка сохранена. Команда MAINHALL свяжется с вами по указанному телефону.':error}</p>
 </form>;
}
