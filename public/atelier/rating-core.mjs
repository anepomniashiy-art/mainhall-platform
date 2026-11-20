/** MAINHALL 1.0: independent evidence-backed screening dimensions, not a price forecast. */
export const RATING_VERSION = 'MAINHALL 1.0';
const finite = value => typeof value === 'number' && Number.isFinite(value);
const positive = value => finite(value) && value > 0;
const clamp = (n,min,max) => Math.min(max,Math.max(min,n));
const round = (n,places=2) => Math.round(n*10**places)/10**places;
const date = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,10)===value ? value : null;
const formatter = new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2});
const number = value => formatter.format(value);

export function entryPriceScore(gapPct) {
  return finite(gapPct) ? round(clamp(5-gapPct/4,0,10)) : null;
}

function dimension(key,title,why,missing,formula=null) {
  return {key,title,score:null,max:10,why,formula,evidence:null,asOf:null,coverage:0,missing};
}

function strictFilters(filters,neighborScope) {
  if(!filters || typeof filters.roomLabel!=='string' || !filters.roomLabel.trim())return false;
  if(!positive(filters.areaMin)||!positive(filters.areaMax)||filters.areaMin>filters.areaMax)return false;
  if(typeof filters.finish!=='string'||!filters.finish.trim())return false;
  if(!['unfinished','hand-over'].includes(filters.state))return false;
  return !neighborScope || (typeof filters.className==='string'&&filters.className.trim()&&filters.className!=='Не указан');
}

function priceDimension(cohort,{unit=null,project=false,asOf=null}={}) {
  const empty=dimension('entry_price','Цена входа',
    'Для числовой оценки нужна достаточная выборка квартир с сопоставимыми характеристиками.',
    'Сопоставимые квартиры: формат, площадь, отделка и стадия; для соседних ЖК также класс.',
    'Индекс = ограничить от 0 до 10: 5 − разница с медианой, % / 4.');
  if(!cohort)return empty;
  const neighborScope=project||cohort.scope==='neighbors';
  const count=cohort.units??cohort.peerUnits;
  const projects=cohort.projectCount??cohort.peerProjectCount;
  if(!Number.isInteger(count)||count<5||!Number.isInteger(projects)||projects<(neighborScope?2:1))return empty;
  if(!strictFilters(cohort.filters,neighborScope))return empty;
  if(project&&cohort.controlled!==true)return empty;
  const reference=cohort.medianPpm??cohort.peerMedianPpm;
  const subject=project?(cohort.projectMedianPpm??cohort.subjectPpm):(cohort.unitPpm??unit?.ppm);
  if(!positive(reference)||!positive(subject))return empty;
  if(unit){
    const actual=positive(unit.ppm)?unit.ppm:(positive(unit.price)&&positive(unit.area)?unit.price/unit.area:null);
    // A valid comparison belongs to this exact apartment, not merely to its ЖК.
    if(!actual||Math.abs(subject-actual)/actual>.005)return empty;
    if(!positive(unit.area)||unit.area<cohort.filters.areaMin||unit.area>cohort.filters.areaMax)return empty;
    if(cohort.filters.state!==unit.state||cohort.filters.finish!==unit.finish)return empty;
    const roomLabel=cohort.filters.roomLabel;
    if(unit.studio?!/^Студи/iu.test(roomLabel):Number.parseInt(roomLabel,10)!==unit.rooms)return empty;
  }
  const gap=(subject/reference-1)*100,score=entryPriceScore(gap);
  return {...empty,score,coverage:100,missing:null,asOf:date(cohort.asOf)||date(asOf),
    why:`Цена за м² ${gap<0?'ниже':gap>0?'выше':'равна'} медиан${gap===0?'е':'ы'} сопоставимой выборки${gap===0?'':` на ${number(Math.abs(gap))}%`}. Это позиция цены предложения, а не прогноз роста.`,
    evidence:{scope:cohort.scope||(project?'neighbors':'within_project'),units:count,projectCount:projects,
      subjectPpm:round(subject),medianPpm:round(reference),gapPct:round(gap),filters:{...cohort.filters}}};
}

function projectPriceDimension(comparison,asOf){
  if(comparison?.status!=='comparable')return priceDimension(null,{project:true});
  const empty=priceDimension(null,{project:true});
  const projects=[...new Set(comparison.referenceProjectSlugs||[])];
  if(comparison.scope!=='neighbors'||comparison.strictMatch!==true||!finite(comparison.gapPct)
    ||!Number.isInteger(comparison.comparableUnits)||comparison.comparableUnits<5
    ||!Number.isInteger(comparison.peerProjectCount)||comparison.peerProjectCount<2||projects.length!==comparison.peerProjectCount
    ||!Number.isInteger(comparison.cohortMinimumUnits)||comparison.cohortMinimumUnits<5
    ||!finite(comparison.coveragePct)||comparison.coveragePct<=0||comparison.coveragePct>100
    ||!Array.isArray(comparison.controls)||comparison.controls.length<5)return empty;
  const gap=comparison.gapPct;
  return {...empty,score:entryPriceScore(gap),coverage:100,missing:null,asOf:date(asOf),
    why:`Медианное отклонение цен индивидуально сопоставленных квартир от соседних предложений — ${number(gap)}%. Сопоставлено ${comparison.comparableUnits} квартир (${number(comparison.coveragePct)}% предложения ЖК). Это ценовой скрининг выборки, а не обещание «догоняющего» роста.`,
    evidence:{scope:'neighbors',gapPct:gap,comparableUnits:comparison.comparableUnits,sampleCoveragePct:comparison.coveragePct,
      peerProjectCount:comparison.peerProjectCount,referenceProjectSlugs:projects,cohortMinimumUnits:comparison.cohortMinimumUnits,
      controls:[...comparison.controls],benchmark:comparison.benchmark||'Медиана индивидуально сопоставленных отклонений'}};
}

function metric(profile,key){return profile?.metrics?.find(m=>m.key===key)||null;}
function liquidityDimension(profile){
  const empty=dimension('liquidity','Спрос и ликвидность',
    'Структура предложения сама по себе не подтверждает спрос или скорость продажи.',
    'Согласованные по дате объём предложения и ДДУ за шесть месяцев.',
    'Условный запас, мес. = предложений / (ДДУ за 6 мес. / 6); индекс = ограничить от 0 до 10: 10 − запас / 1,2.');
  const listings=metric(profile,'listings'),contracts=metric(profile,'equityContractsSixMonths');
  if(!positive(listings?.value)||!Number.isInteger(listings.value)||!positive(contracts?.value)||!Number.isInteger(contracts.value)||!date(listings.asOf)||date(listings.asOf)!==date(contracts.asOf))return empty;
  const inventoryMonths=listings.value/(contracts.value/6);
  const old=metric(profile,'olderThan180DaysPercent');
  const oldShare=finite(old?.value)&&old.value>=0&&old.value<=100&&date(old.asOf)===date(listings.asOf)?old.value:null;
  return {...empty,score:round(clamp(10-inventoryMonths/1.2,0,10)),coverage:100,missing:null,asOf:date(listings.asOf),
    why:`Условный запас предложения — ${number(inventoryMonths)} мес. при темпе ${number(contracts.value/6)} ДДУ в месяц на дату оценки.${oldShare===null?'':` В экспозиции более 180 дней — ${number(oldShare)}%.`} Индекс описывает эту выборку и период, а не срок продажи конкретной квартиры.`,
    evidence:{listings:listings.value,equityContractsSixMonths:contracts.value,contractsPerMonth:round(contracts.value/6),inventoryMonths:round(inventoryMonths),olderThan180DaysPercent:oldShare}};
}

function missingDimensions(neighborhoodProfile){
  const delivery=dimension('delivery','Надёжность сроков','Для оценки нужна история плановых и фактических сроков девелопера. Готовность отдельного корпуса не заменяет эту статистику.','Плановые и фактические даты по сопоставимым завершённым корпусам девелопера.');
  const timeline=neighborhoodProfile?.timelineStats;
  if(timeline&&Number.isInteger(timeline.pastPlannedDateCount)&&timeline.pastPlannedDateCount>0){
    delivery.why=`В каталоге есть ${timeline.pastPlannedDateCount} предложений, где плановая дата уже прошла, а стадия отмечена как строящаяся. Это повод проверить текущий статус корпуса, а не подтверждённая задержка. Статистика фактических переносов девелопера пока не установлена.`;
    delivery.evidence={...timeline};
  }
  const neighborhood=dimension('neighborhood','Развитие района','Инфраструктурная гипотеза требует подтверждения стадии, сроков и связи с выбранным корпусом.','Подтверждённые объекты инфраструктуры, сроки реализации и проверенные маршруты.');
  if(neighborhoodProfile?.sampleStats)neighborhood.evidence={neighborCount:neighborhoodProfile.neighborCount??null,scopeLabel:neighborhoodProfile.scopeLabel??null,totalUnits:neighborhoodProfile.sampleStats.totalUnits??null};
  return [delivery,neighborhood,
    dimension('rental','Экономика аренды','Доля студий или трёхкомнатных квартир в предложении не является доказательством спроса на аренду.','Сопоставимая аренда, простой, расходы и полная сумма вложений; пользовательский сценарий показывается отдельно.')];
}

function complete(ratings,expertProfile,subject){
  const known=ratings.filter(r=>finite(r.score)),coveragePct=round(known.length/ratings.length*100);
  const fullScore=known.length===ratings.length?round(known.reduce((sum,r)=>sum+r.score,0)/ratings.length):null;
  const price=ratings.find(r=>r.key==='entry_price');
  let conclusion='Данных для полной инвестиционной рекомендации пока недостаточно. Доступные измерения показаны отдельно.';
  if(price.score!==null){
    conclusion=price.score>=7.5?`${subject} стоит рассмотреть по цене входа. Прежде чем покупать, нужно проверить остальные риски и экономику конкретного лота.`:
      price.score<=2.5?`Доплата относительно сопоставимых вариантов требует обоснования. Не брать без подтверждённого преимущества или улучшения условий.`:
      `Цена находится внутри сопоставимого диапазона. Решение зависит от характеристик квартиры, сроков и полной экономики покупки.`;
  }
  return {version:RATING_VERSION,ratings,coveragePct,fullScore,missing:ratings.filter(r=>r.score===null).map(r=>({key:r.key,title:r.title,needed:r.missing})),conclusion,
    expertAssessment:finite(expertProfile?.score)&&expertProfile.score>=0&&expertProfile.score<=10?{score:expertProfile.score,max:10,asOf:date(expertProfile.reviewAsOf),label:'Отдельная экспертная оценка MAINHALL',formulaAvailable:false}:null};
}

/** Every project receives the same five-dimensional check; missing data never becomes zero. */
export function rateProject(project,expertProfile=null,neighborhoodProfile=null){
  const cohort=neighborhoodProfile?.projectPriceComparison??neighborhoodProfile?.controlledPriceComparison??null;
  const price=cohort?.status?projectPriceDimension(cohort,neighborhoodProfile?.asOf):priceDimension(cohort,{project:true,asOf:neighborhoodProfile?.asOf});
  return complete([price,liquidityDimension(expertProfile),...missingDimensions(neighborhoodProfile)],expertProfile,'ЖК');
}

/** optionalUnitEvidence.cohort must refer to the same apartment and a strict comparison cohort. */
export function rateUnit(unit,project,expertProfile=null,neighborhoodProfile=null,optionalUnitEvidence=null){
  let evidence=optionalUnitEvidence;
  if(!evidence&&neighborhoodProfile?.recommendations){evidence=[...(neighborhoodProfile.recommendations.consider||[]),...(neighborhoodProfile.recommendations.avoid||[])].find(c=>String(c.id)===String(unit?.id));}
  if(!unit||(evidence?.id!==undefined&&String(evidence.id)!==String(unit.id)))evidence=null;
  return complete([priceDimension(evidence?.cohort,{unit,asOf:neighborhoodProfile?.asOf}),liquidityDimension(expertProfile),...missingDimensions(neighborhoodProfile)],expertProfile,'Квартиру');
}
