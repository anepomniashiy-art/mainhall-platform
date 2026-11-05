import {chromium} from "playwright";
import {mkdir} from "node:fs/promises";
import assert from "node:assert/strict";
await mkdir("design-proof",{recursive:true});
const browser=await chromium.launch({headless:true});
try {
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:"reduce"});
  for(const slug of ["high-life","stone-blik","stone-sokolniki","enigmia"]){
   await page.goto("http://127.0.0.1:8091/projects/"+slug+"/",{waitUntil:"domcontentloaded"});
   const cards=page.locator("[data-market-unit]");
   const count=await cards.count();
   assert.ok(slug==="enigmia"?count===0:count>0,slug+" inventory visibility");
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),slug+" horizontal overflow");
   const gallery=page.locator("[data-project-gallery]");
   assert.equal(await gallery.count(),1,slug+" gallery");
   for(const img of await gallery.locator("img").all())await img.evaluate(image=>image.decode());
   if(count){
    for(const card of await cards.all()){
     const img=card.locator("img");await img.evaluate(image=>image.decode());
     const href=await card.getAttribute("href");
     assert.ok(href.startsWith("/units/"),"Every apartment opens its MAINHALL detail page");
    }
    await cards.first().screenshot({path:"design-proof/catalogue-"+slug+"-"+width+".png"});
   }else await gallery.screenshot({path:"design-proof/catalogue-"+slug+"-"+width+".png"});
  }
  await page.goto("http://127.0.0.1:8091/units/",{waitUntil:"networkidle"});
  const groups=page.locator("article").filter({has:page.locator(".mh-unit-matches")});
  assert.ok(await groups.count()>1,"Apartment search starts with multiple project groups");
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),"Apartment results horizontal overflow");
  await page.getByLabel("Жилой комплекс",{exact:true}).selectOption("high-life");
  assert.equal(await groups.count(),1,"Filters retain the selected project");
  await page.getByLabel("Цена до, млн ₽").fill("1");
  await page.getByText("Найдено квартир: 0 · ЖК: 0",{exact:true}).waitFor();
  await page.getByRole("button",{name:"Сбросить"}).click();
  await groups.nth(1).waitFor();
  await page.getByText("Дополнительные параметры",{exact:true}).click();
  await page.getByLabel("Площадь от, м²").fill("100");
  await page.getByLabel("Площадь до, м²").fill("50");
  await page.getByText("Найдено квартир: 0 · ЖК: 0",{exact:true}).waitFor();
  await page.getByRole("button",{name:"Сбросить"}).click();
  await groups.nth(1).waitFor();
  const cover=groups.first().locator(".mh-commercial-photo img");
  await cover.evaluate(image=>image.decode());
  assert.ok(await groups.first().locator(".mh-commercial-photo a").getAttribute("href"),"Project cover opens the project");
  const href=await groups.first().locator(".mh-unit-matches a").first().getAttribute("href");
  await page.goto("http://127.0.0.1:8091"+href,{waitUntil:"domcontentloaded"});
  await page.getByRole("heading",{level:1}).waitFor();
  assert.equal(await page.locator("#floor-plan").count(),1,"A real plan is available separately from the project image");
  assert.ok(await page.getByRole("link",{name:"Обсудить задачу ↗",exact:true}).getAttribute("href").then(h=>h.startsWith("https://wa.me/79269179901")));
  await page.close();
 }
} finally {await browser.close();}
console.log("Catalogue cards, plans, galleries and lead destinations verified");
