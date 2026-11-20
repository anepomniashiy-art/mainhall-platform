/** Editorial investment decisions and dated evidence remain separate from factor indices. */
const finite=value=>typeof value==='number'&&Number.isFinite(value);
const validDate=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value?value:null;
const number=value=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2}).format(value);
const date=value=>value.split('-').reverse().join('.');
const distinct=values=>[...new Set(values.filter(Boolean))];
const factor=(rating,key)=>rating?.ratings?.find(value=>value.key===key)||null;
const datedFactor=(rating,key)=>{const f=factor(rating,key);return finite(f?.score)&&f.score>=0&&f.score<=10&&validDate(f.asOf)?f:null;};
const expert=profile=>finite(profile?.score)&&profile.score>=0&&profile.score<=10&&validDate(profile.reviewAsOf)?{score:profile.score,asOf:profile.reviewAsOf}:null;
const metric=(profile,key)=>{const m=profile?.metrics?.find(m=>m.key===key);return finite(m?.value)&&validDate(m.asOf)?m:null;};
const priceGap=rating=>{const f=datedFactor(rating,'entry_price');return finite(f?.evidence?.gapPct)?{...f,gap:f.evidence.gapPct}:null;};
const baseConditions=[
 'Подтвердить итоговую цену выбранной квартиры, способ оплаты и все расходы.',
 'Проверить планировку, положение квартиры, срок передачи по договору и документы.',
 'Сравнить результат после расходов с вашей целью и сроком владения.'
];

function evidence(profile,rating){
 const facts=[],price=priceGap(rating),liquidity=datedFactor(rating,'liquidity');
 if(price)facts.push(`На ${date(price.asOf)} цена в сопоставленной выборке ${price.gap<0?'ниже':price.gap>0?'выше':'равна'} ${price.gap===0?'типичной цене похожих предложений':`типичной цены похожих предложений на ${number(Math.abs(price.gap))}%`}. Это цены предложения.`);
 if(liquidity&&finite(liquidity.evidence?.inventoryMonths))facts.push(`На ${date(liquidity.asOf)} условный запас предложения — ${number(liquidity.evidence.inventoryMonths)} мес. при темпе продаж по ДДУ. Это показатель ЖК, а не срок продажи квартиры.`);
 const contracts=metric(profile,'equityContractsSixMonths');
 if(contracts&&Number.isInteger(contracts.value)&&contracts.value>=0&&!liquidity)facts.push(`В разборе на ${date(contracts.asOf)} учтено ${number(contracts.value)} ДДУ за шесть месяцев. Период и состав корпусов нужно сверить перед покупкой.`);
 const gap=metric(profile,'districtPriceDifferencePercent');
 if(gap&&!price)facts.push(`В разборе на ${date(gap.asOf)} ценовой ориентир проекта ${gap.value<0?'ниже':gap.value>0?'выше':'соответствует'} районно${gap.value===0?'му ориентиру':`го ориентира на ${number(Math.abs(gap.value))}%`}. Этот ориентир требует проверки на похожих квартирах.`);
 const older=metric(profile,'olderThan180DaysPercent');
 if(older&&older.value>=0&&older.value<=100)facts.push(`На ${date(older.asOf)} ${number(older.value)}% квартир выборки находились в продаже более 180 дней.`);
 return facts.slice(0,3);
}

function currentFlags(rating){
 const flags=[],price=priceGap(rating),liquidity=datedFactor(rating,'liquidity');
 if(price?.gap>=10)flags.push({why:`На ${date(price.asOf)} сопоставленные предложения дороже похожих вариантов на ${number(price.gap)}%. Высокий рейтинг проекта не оправдывает эту доплату автоматически.`,condition:'Получить улучшение цены либо подтвердить преимущества, которые оправдывают доплату.'});
 if(price?.gap< -30)flags.push({why:`Отклонение цены на ${date(price.asOf)} — ${number(price.gap)}%. Столь большая разница требует проверки цены и условий; это не доказанная инвестиционная выгода.`,condition:'Проверить актуальность цены, полную сумму платежей и причины необычного отклонения.'});
 if(liquidity&&liquidity.score<=3)flags.push({why:`Показатель спроса и ликвидности на ${date(liquidity.asOf)} — ${number(liquidity.score)} из 10. Наблюдавшийся темп продаж требует осторожного сценария выхода.`,condition:'Проверить конкурирующие квартиры и рассчитать более долгую продажу после всех расходов.'});
 return flags;
}

/** score is an existing dated editorial assessment, never a newly computed composite. */
export function recommendProject(project,profile=null,rating=null){
 const mark=expert(profile),flags=currentFlags(rating),why=evidence(profile,rating);
 let status='pending',title='Рекомендация не готова';
 if(mark){
  if(mark.score>=8){status='consider';title='Рассмотреть для покупки';}
  else if(mark.score>=7){status='selective';title='Покупать выборочно';}
  else {status='low-priority';title='Не в приоритете';}
  if(flags.length&&mark.score>=7){status='conditional';title='Покупать только при условиях';}
 }
 const risks=distinct([...(flags.map(f=>f.why)),...(profile?.risks||[]).filter(v=>typeof v==='string'&&v.trim())]);
 if(!mark)why.unshift('Для этого проекта пока нет датированной итоговой экспертной оценки MAINHALL. Отдельная оценка цены не заменяет инвестиционную рекомендацию.');
 if(mark&&!why.length)why.push(`Экспертная оценка MAINHALL — ${number(mark.score)} из 10 на ${date(mark.asOf)}. Для объяснения по отдельным показателям пока недостаточно опубликованных данных.`);
 if(mark&&mark.score<7)why.unshift('По существующей экспертной оценке проект уступает более сильным кандидатам. Это не запрет на покупку для жизни и не оценка каждой квартиры.');
 return {status,title,score:mark?.score??null,asOf:mark?.asOf??null,
  why:distinct([...flags.map(f=>f.why),...why]).slice(0,3),
  conditions:distinct([...flags.map(f=>f.condition),...baseConditions]),
  risks:risks.slice(0,3),
  basis:mark?'Экспертная оценка MAINHALL по совокупности рыночных факторов. Это существующий разбор с указанной датой; арифметическая формула итогового балла не опубликована. Текущие проверки показаны отдельно.':'Итоговой экспертной оценки пока нет. Прочерки не означают нулевой балл или отрицательную рекомендацию.'};
}

/** A project assessment is context; it never becomes an apartment score. */
export function recommendUnit(unit,project,profile=null,unitRating=null){
 // Unit price evidence cannot alter the separate assessment of the whole project.
 const context=recommendProject(project,profile,{ratings:(unitRating?.ratings||[]).filter(f=>f.key!=='entry_price')}),price=priceGap(unitRating),flags=currentFlags(unitRating);
 let status='pending',title='Рекомендация не готова';
 const why=[];
 if(price){
  if(price.gap>=10){status='avoid-premium';title='Не покупать без обоснования доплаты';}
  else if(price.gap< -30){status='verify-price';title='Сначала проверить цену и условия';}
  else if(price.gap<=-5&&context.score!==null&&context.score>=7){status='consider-checked';title='Рассмотреть после проверки';}
  else {status='compare';title='Сравнить другие квартиры';}
  why.push(...evidence(null,unitRating));
  if(context.score===null)why.push('Полный экспертный разбор проекта пока не готов. Более низкая цена сама по себе не подтверждает выгодность покупки.');
  else if(context.score<7)why.push('Проект не входит в инвестиционный приоритет по датированному экспертному разбору. Низкая цена квартиры сама по себе не меняет этот вывод.');
 }else why.push('Для этой квартиры пока нет достаточного датированного сравнения цены с похожими предложениями. Рейтинг дома не переносится на квартиру.');
 if(status==='consider-checked'&&flags.length){status='conditional';title='Покупать только при условиях';}
 return {status,title,score:null,asOf:price?.asOf??null,
  why:distinct([...flags.map(f=>f.why),...why]).slice(0,3),
  conditions:distinct([...flags.map(f=>f.condition),...baseConditions]),
  risks:distinct([...flags.map(f=>f.why),...context.risks]).slice(0,3),
  basis:'Вывод по выбранной квартире учитывает её сравнение цены и контекст проекта. Отдельный полный инвестиционный балл квартиры пока не рассчитан.',
  projectContext:{score:context.score,asOf:context.asOf,title:context.title,status:context.status}};
}
