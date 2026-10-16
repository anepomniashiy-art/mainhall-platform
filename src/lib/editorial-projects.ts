/** Editorial registry only. This is NOT an inventory of available apartments.
 * Prices, photos, status and promised returns must not be inferred from names.
 * Unit-level prices enter the public catalog only after source verification.
 */
export type ProjectEntry = {
 slug: string; name: string; developer: string; area: string;
 className: "Бизнес+" | "Премиум" | "Элитная"; sourceUrl: string;
 summary: string; thesis: string; dueDiligence: string[];
};
export const editorialProjects: ProjectEntry[] = [
 {slug:"high-life",name:"HIGH LIFE",developer:"PIONEER",area:"Павелецкая",className:"Премиум",sourceUrl:"https://pioneer.ru/",summary:"Высотный жилой проект в сложившемся деловом окружении Москвы.",thesis:"Анализируем долгосрочный спрос на квартиры рядом с деловыми кластерами, транспортную доступность и ценовую конкуренцию.",dueDiligence:["Ликвидность квартир разных площадей","Реальные условия рассрочки","Стоимость отделки и содержания"]},
 {slug:"opus",name:"OPUS",developer:"PIONEER",area:"Дербеневская",className:"Премиум",sourceUrl:"https://pioneer.ru/",summary:"Современный жилой проект с выразительной архитектурой.",thesis:"Оценка потенциала локации и конкурирующего предложения в близлежащих кварталах.",dueDiligence:["Сопоставимые сделки","Видовые характеристики","Сроки передачи квартир"]},
 {slug:"badaevsky",name:"Бадаевский",developer:"Capital Group",area:"Кутузовский",className:"Элитная",sourceUrl:"https://www.capitalgroup.ru/",summary:"Архитектурно выразительный проект в западной части центра Москвы.",thesis:"Проверяем премию за уникальную архитектуру, глубину спроса и ликвидность крупных лотов.",dueDiligence:["Реальные прайсы девелопера","Эксплуатационные расходы","Сценарии выхода"]},
 {slug:"vesper-kutuzovsky",name:"Vesper Кутузовский",developer:"Vesper",area:"Кутузовский",className:"Элитная",sourceUrl:"https://www.vespermoscow.com/",summary:"Проект в сегменте элитной городской недвижимости.",thesis:"Сравнение ограниченного предложения в локации и качества продукта, без предположений о гарантированном росте цены.",dueDiligence:["Наличие конкретных лотов","Формат отделки","Ликвидность при перепродаже"]},
 {slug:"shagal",name:"Шагал",developer:"Группа Эталон",area:"Даниловский",className:"Бизнес+",sourceUrl:"https://etalongroup.ru/",summary:"Масштабный квартальный проект на территории развивающейся городской локации.",thesis:"Сравниваем корпуса и сроки, оцениваем предложение конкурентов и влияние очередности застройки.",dueDiligence:["Корпуса и сроки ввода","Акции по каждому лоту","Сопоставимые предложения"]},
 {slug:"level-yuzhnoportovaya",name:"Level Южнопортовая",developer:"Level Group",area:"Южнопортовый",className:"Бизнес+",sourceUrl:"https://level.ru/",summary:"Многокорпусная жилая застройка с вариативностью квартир.",thesis:"Ищем отклонения в цене сопоставимых планировок с учётом стадии строительства и вида.",dueDiligence:["Различия между корпусами","Фактические цены после акций","Объём предложения по типам лотов"]}
];
