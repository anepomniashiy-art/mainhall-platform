import {chromium} from "playwright";
import {mkdir} from "node:fs/promises";
import assert from "node:assert/strict";
await mkdir("design-proof",{recursive:true});
const browser=await chromium.launch({headless:true});
try {
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:"reduce"});
  for(const [slug,count] of [["high-life",1],["stone-blik",1],["stone-sokolniki",2],["enigmia",0]]){
   await page.goto("http://127.0.0.1:8091/projects/"+slug+"/",{waitUntil:"domcontentloaded"});
   const cards=page.locator("[data-market-unit]");
   assert.equal(await cards.count(),count,slug+" inventory count");
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),slug+" horizontal overflow");
   const gallery=page.locator("[data-project-gallery]");
   assert.equal(await gallery.count(),1,slug+" gallery");
   for(const img of await gallery.locator("img").all())await img.evaluate(image=>image.decode());
   if(count){
    for(const card of await cards.all()){
     const img=card.locator("img");await img.evaluate(image=>image.decode());
     const link=card.locator("a.mh-text-link");
     const href=await link.getAttribute("href");
     assert.ok(href.includes("wa.me/"),"Lead must go to MAINHALL WhatsApp");
     assert.ok(decodeURIComponent(href).includes("квартира №"),"Lead must identify selected apartment");
    }
    await cards.first().screenshot({path:"design-proof/catalogue-"+slug+"-"+width+".png"});
   }else await gallery.screenshot({path:"design-proof/catalogue-"+slug+"-"+width+".png"});
  }
  await page.goto("http://127.0.0.1:8091/units/",{waitUntil:"networkidle"});
  const groups=page.locator("article").filter({has:page.locator(".mh-unit-matches")});
  assert.ok(await groups.count()>1,"Apartment search starts with multiple project groups");
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),"Apartment results horizontal overflow");
  await page.getByLabel("Жилой комплекс").selectOption("high-life");
  await page.getByLabel("Комнат").selectOption("3");
  await page.getByLabel("Площадь от, м²").fill("140");
  await page.getByLabel("Цена до, млн ₽").fill("150");
  await page.getByText("Найдено квартир: 1 · ЖК: 1",{exact:true}).waitFor();
  assert.equal(await groups.locator(".mh-unit-matches a").getAttribute("href"),"/units/public-high-life-405/");
  await page.getByLabel("Цена до, млн ₽").fill("140");
  await page.getByText("Найдено квартир: 0 · ЖК: 0",{exact:true}).waitFor();
  await page.getByRole("button",{name:"Сбросить"}).click();
  await groups.nth(1).waitFor();
  await page.close();
 }
} finally {await browser.close();}
console.log("Catalogue cards, plans, galleries and lead destinations verified");
