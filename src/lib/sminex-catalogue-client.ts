import type {SminexUnit} from './sminex-catalogue';
export type {SminexUnit};
export const categoryNames:Record<string,string>={apartment:'Квартира',house:'Дом',office:'Офис',retail:'Торговое помещение',free_purpose:'Свободное назначение',parking:'Машино-место',storage:'Кладовая',commercial_other:'Коммерческое помещение'};
export function rub(value:number|null){return value===null?'Цена по запросу':new Intl.NumberFormat('ru-RU').format(value)+' ₽';}
