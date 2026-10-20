/** Editorial registry only. This is NOT an inventory of available apartments.
 * Prices, photos, status and promised returns must not be inferred from names.
 * Unit-level prices enter the public catalog only after source verification.
 */
export type ProjectEntry = {
 slug: string; name: string; developer: string; area: string;
 className: "Бизнес+" | "Премиум" | "Элитная" | "Комфорт"; sourceUrl: string;
 summary: string; thesis: string; dueDiligence: string[];
};
export const editorialProjects: ProjectEntry[] = [
 // ── PIONEER ──
 {slug:"high-life",name:"HIGH LIFE",developer:"PIONEER",area:"Павелецкая",className:"Премиум",sourceUrl:"https://pioneer.ru/",summary:"Высотный жилой проект в сложившемся деловом окружении Москвы.",thesis:"Анализируем долгосрочный спрос на квартиры рядом с деловыми кластерами, транспортную доступность и ценовую конкуренцию.",dueDiligence:["Ликвидность квартир разных площадей","Реальные условия рассрочки","Стоимость отделки и содержания"]},
 {slug:"opus",name:"OPUS",developer:"PIONEER",area:"Дербеневская",className:"Премиум",sourceUrl:"https://pioneer.ru/",summary:"Современный жилой проект с выразительной архитектурой.",thesis:"Оценка потенциала локации и конкурирующего предложения в близлежащих кварталах.",dueDiligence:["Сопоставимые сделки","Видовые характеристики","Сроки передачи квартир"]},

 // ── Capital Group ──
 {slug:"badaevsky",name:"Бадаевский",developer:"Capital Group",area:"Кутузовский",className:"Элитная",sourceUrl:"https://www.capitalgroup.ru/",summary:"Архитектурно выразительный проект в западной части центра Москвы.",thesis:"Проверяем премию за уникальную архитектуру, глубину спроса и ликвидность крупных лотов.",dueDiligence:["Реальные прайсы девелопера","Эксплуатационные расходы","Сценарии выхода"]},

 // ── Vesper ──
 {slug:"vesper-kutuzovsky",name:"Vesper Кутузовский",developer:"Vesper",area:"Кутузовский",className:"Элитная",sourceUrl:"https://www.vespermoscow.com/",summary:"Проект в сегменте элитной городской недвижимости.",thesis:"Сравнение ограниченного предложения в локации и качества продукта, без предположений о гарантированном росте цены.",dueDiligence:["Наличие конкретных лотов","Формат отделки","Ликвидность при перепродаже"]},

 // ── Группа Эталон ──
 {slug:"shagal",name:"Шагал",developer:"Группа Эталон",area:"Даниловский",className:"Бизнес+",sourceUrl:"https://etalongroup.ru/",summary:"Масштабный квартальный проект на территории развивающейся городской локации.",thesis:"Сравниваем корпуса и сроки, оцениваем предложение конкурентов и влияние очередности застройки.",dueDiligence:["Корпуса и сроки ввода","Акции по каждому лоту","Сопоставимые предложения"]},

 // ── Level Group ──
 {slug:"level-yuzhnoportovaya",name:"Level Южнопортовая",developer:"Level Group",area:"Печатники",className:"Комфорт",sourceUrl:"https://level.ru/",summary:"Многокорпусная жилая застройка с вариативностью квартир.",thesis:"Ищем отклонения в цене сопоставимых планировок с учётом стадии строительства и вида.",dueDiligence:["Различия между корпусами","Фактические цены после акций","Объём предложения по типам лотов"]},

 // ── MR Group ──
 {slug:"symphony-34",name:"Symphony 34",developer:"MR Group",area:"Дмитровская",className:"Премиум",sourceUrl:"https://www.mr-group.ru/",summary:"Высотный жилой комплекс в районе Дмитровской.",thesis:"Оцениваем премию за высотность и виды, сравниваем с ценами на вторичном рынке после ввода в эксплуатацию.",dueDiligence:["Ликвидность на вторичном рынке","Эксплуатационные расходы высотки","Сопоставимые проекты в локации"]},
 {slug:"nicole",name:"Николь",developer:"MR Group",area:"Площадь Революции",className:"Премиум",sourceUrl:"https://www.mr-group.ru/",summary:"Жилой комплекс в историческом центре Москвы вблизи Кремля.",thesis:"Анализируем ценообразование в локации с крайне ограниченным новым предложением и высоким барьером входа.",dueDiligence:["Условия покупки и рассрочки","Конкурирующие объекты в радиусе","Ожидаемые сроки строительства"]},

 // ── Hutton ──
 {slug:"lumin",name:"LUMIN",developer:"Hutton",area:"Китай-город",className:"Премиум",sourceUrl:"https://hutton.ru/",summary:"Клубный дом на Славянской площади в непосредственной близости от исторического центра.",thesis:"Оцениваем камерный формат и ограниченное предложение в контексте спроса на клубную городскую недвижимость.",dueDiligence:["Количество и типы лотов","Юридическая чистота участка","Конкурирующие клубные дома"]},
 {slug:"lunar",name:"Lunar",developer:"Hutton",area:"Ленинский проспект",className:"Премиум",sourceUrl:"https://hutton.ru/",summary:"Многофункциональный жилой комплекс на Ленинском проспекте.",thesis:"Сравниваем стоимость входа с проектами на юго-западе, оцениваем транспортную доступность и спрос в локации.",dueDiligence:["Формат квартир и планировок","Инфраструктура комплекса","Сроки реализации"]},

 // ── STONE ──
 {slug:"stone-sokolniki",name:"STONE Сокольники",developer:"STONE",area:"Сокольники",className:"Бизнес+",sourceUrl:"https://stone.ru/",summary:"Жилой комплекс в восточной части Москвы рядом с парком Сокольники.",thesis:"Ищем потенциал роста за счёт близости к парковой зоне и развивающейся инфраструктуры района.",dueDiligence:["Плановые сроки сдачи","Стартовые и текущие цены","Конкуренция в районе Сокольников"]},
 {slug:"stone-blik",name:"STONE Блик",developer:"STONE",area:"Донской",className:"Премиум",sourceUrl:"https://stone.ru/",summary:"Жилой комплекс в Донском районе южного административного округа Москвы.",thesis:"Оцениваем перспективу локации, ценовой спред к проектам ближе к центру и горизонт инвестирования.",dueDiligence:["Этап строительства и сроки","Конкурирующее предложение в ЮАО","Транспортная доступность"]},

 // ── October Group ──
 {slug:"king-and-sons",name:"KING & SONS",developer:"October Group",area:"Ломоносовский",className:"Элитная",sourceUrl:"https://octobergroup.ru/",summary:"Элитный 15-этажный жилой дом в районе Ломоносовского проспекта.",thesis:"Проверяем обоснованность элитного позиционирования в этой локации и глубину платёжеспособного спроса.",dueDiligence:["Реальные цены девелопера","Формат и площади квартир","Конкурирующие элитные проекты в ЗАО"]},
 {slug:"stories-mosfilmovskaya",name:"Stories на Мосфильмовской",developer:"October Group",area:"Раменки",className:"Бизнес+",sourceUrl:"https://octobergroup.ru/",summary:"Жилой комплекс бизнес-класса вблизи метро Аминьевская.",thesis:"Анализируем ценообразование в контексте растущего предложения в западной части Москвы.",dueDiligence:["Вторичный рынок после сдачи","Арендный потенциал","Сопоставимые объекты в Раменках"]},

 // ── Coldy ──
 {slug:"dom-7-danilovsky",name:"Дом 7 Даниловский",developer:"Coldy",area:"Тульская",className:"Премиум",sourceUrl:"https://coldy.ru/",summary:"Премиальный жилой проект в южном административном округе Москвы.",thesis:"Оцениваем потенциал Даниловского района и конкуренцию с проектами бизнес-класса в соседних кварталах.",dueDiligence:["Сроки строительства","Условия покупки","Альтернативное предложение на Тульской"]},

 // ── Upside Development ──
 {slug:"upside-towers",name:"Upside Towers",developer:"Upside Development",area:"Бутырский",className:"Бизнес+",sourceUrl:"https://upsidedev.ru/",summary:"Квартал небоскрёбов в северо-восточной части Москвы.",thesis:"Сравниваем высотный формат с классическими проектами бизнес-класса, оцениваем этапность застройки.",dueDiligence:["Корпуса и очереди строительства","Цены по этажам и видам","Ликвидность высотного формата"]},
 {slug:"enigmia",name:"Энигмия",developer:"Upside Development",area:"Новослободская",className:"Премиум",sourceUrl:"https://upsidedev.ru/",summary:"Клубный дом в Тверском районе Москвы, в локации Новослободской.",thesis:"Анализируем камерный формат в центральной локации с высоким пешеходным трафиком.",dueDiligence:["Ограниченное число лотов","Условия покупки","Конкурирующие клубные дома в ЦАО"]},
];
