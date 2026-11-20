import {rateProject} from './rating-core.mjs';

export function mountExpertise({projects,units,data,neighborhoods,activity,esc,num}) {
  const counts={entry_price:0,neighborhood:0,liquidity:0,delivery:0,rental:0};
  for(const p of projects){
    const r=rateProject(p,data.projects[p.slug],{...neighborhoods.projects?.[p.slug],asOf:neighborhoods.generatedAt});
    for(const f of r.ratings)if(Number.isFinite(f.score))counts[f.key]++;
  }
  const factors=[
    {key:'entry_price',question:'Сколько стоят похожие квартиры?',text:'Сравниваем квартиры похожей площади, отделки и срока сдачи в этом доме и рядом. Показываем, где цена ниже, а где продавец просит больше.'},
    {key:'neighborhood',question:'Что появится рядом с домом?',text:'Изучаем планы метро, парков, школ и магазинов. Проверяем сроки. Объясняем, как изменения района могут повлиять на привлекательность квартиры.'},
    {key:'liquidity',question:'Как быстро здесь покупают квартиры?',text:'Смотрим на покупки у застройщика и число квартир, оставшихся в продаже. Так можно оценить спрос. Одного подсчёта объявлений для этого недостаточно.'},
    {key:'delivery',question:'Есть ли риск задержки сдачи?',text:'Для оценки сравниваем обещанные и фактические сроки застройщика. Задержка означает больше ожидания и более позднее начало дохода от аренды.'},
    {key:'rental',question:'Сколько останется от аренды?',text:'Из дохода вычитаем простой, управление, налоги и содержание. В расходы на покупку включаем ремонт и мебель. Можно изменить условия в калькуляторе.'}
  ];
  document.querySelector('#inventory-label').textContent='Данные каталога на 19 ноября 2026';
  document.querySelector('#cinema-project-count').textContent=num(projects.length);
  document.querySelector('#cinema-offer-count').textContent=num(units.length);
  document.querySelector('#expertise-tabs').innerHTML=factors.map(f=>`<article><h3>${f.question}</h3><p>${f.text}</p><span class="factor-coverage">${counts[f.key]?`Оценка по этому вопросу готова для ${num(counts[f.key])} жилых комплексов`:'Для оценки ещё нужны проверенные данные'}${f.key==='liquidity'&&activity?.coverage?` · История покупок есть для ${num(activity.coverage.matchedProjects)} комплексов`:''}</span></article>`).join('');
  document.querySelector('#expertise-panel').textContent='В карточке дома или квартиры видно, что уже проверено и каких данных ещё не хватает. Если оценка не готова, мы пишем об этом прямо.';
  const example=projects.find(p=>p.slug==='insider');
  const comparison=neighborhoods.projects?.[example?.slug]?.projectPriceComparison;
  const host=document.querySelector('#expertise-example');
  if(example&&comparison?.status==='comparable'&&comparison.gapPct<0){
    host.innerHTML=`<div class="proof-image"><img src="${esc(example.cover?.thumb||example.cover?.src)}" alt="Комплекс апартаментов INSIDER в Москве" width="540" height="180"><span>КОНКРЕТНЫЙ ПРИМЕР ИЗ КАТАЛОГА</span><strong>Комплекс апартаментов INSIDER</strong></div><div class="proof-content"><h3 class="proof-plain-title">Цены ниже похожих предложений рядом</h3><div class="proof-price"><strong>на ${num(Math.abs(comparison.gapPct))}%</strong></div><p class="proof-explanation">Сравнили ${num(comparison.comparableUnits)} предложений в этом комплексе с похожими предложениями в ${num(comparison.peerProjectCount)} соседних жилых комплексах.</p><p class="proof-explanation">Теперь важно проверить, почему здесь дешевле: есть ли преимущество для покупателя или недостаток, который объясняет цену.</p><div class="proof-conclusion"><p>Сравнение на 19 ноября 2026</p><button data-invest-open="${esc(example.slug)}">Посмотреть сравнение цен</button></div></div>`;
  }else{host.hidden=true;}
}
