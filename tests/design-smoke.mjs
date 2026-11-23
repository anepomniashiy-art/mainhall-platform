import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { chromium } from 'playwright';
await mkdir('design-proof', { recursive: true });
const sitemap=await readFile('out/sitemap.xml','utf8');
const expectedProjects=[...sitemap.matchAll(/https:\/\/main-hall\.ru\/projects\/[^/<>]+\//g)].length;
for(const person of ['pavel','evgeny']) {
 const jpeg=await readFile('public/images/team/'+person+'.jpg');
 assert.equal(jpeg.subarray(-2).toString('hex'),'ffd9',person+' JPEG is complete');
}
const browser = await chromium.launch();
try {
 for (const viewport of [{width:1440,height:1000},{width:390,height:844},{width:320,height:740}]) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://127.0.0.1:8091/',{waitUntil:'networkidle'});
  await page.getByRole('heading',{level:1,name:'Новостройки Москвы.'}).waitFor({state:'visible'});
  const hero = page.locator('#cinema-hero');
  const heroImage = hero.locator('.cinema-frame.is-active img');
  await heroImage.evaluate(image => image.decode());
  assert.ok((await hero.boundingBox()).height >= viewport.height, 'home hero fills the viewport');
  assert.match(await heroImage.evaluate(image => image.currentSrc), viewport.width < 761 ? /-portrait\.webp$/ : /-1920\.webp$/);
  if (viewport.width === 1440) {
   await hero.getByRole('button', {name:'Приостановить смену кадров'}).click();
   await hero.getByRole('button', {name:/Кадр 2 из 4/}).click();
   await hero.locator('[data-scene="lavrushinsky"].is-active').waitFor();
   assert.equal(await hero.getByRole('button', {name:/Кадр 2 из 4/}).getAttribute('aria-pressed'), 'true');
   assert.equal(await hero.getByRole('button', {name:'Продолжить смену кадров'}).isVisible(), true);
   await hero.getByRole('button', {name:/Кадр 1 из 4/}).click();
   await hero.locator('[data-scene="level"].is-active').waitFor();
  }
  await page.locator('#project-results [data-project-card]').first().waitFor();
  assert.equal(await page.locator("#investment-overview-list, [data-quick=ratedOnly]").count(), 0);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.screenshot({path:'design-proof/top-'+viewport.width+'.png'});
  await page.screenshot({path:'design-proof/layout-'+viewport.width+'.png',fullPage:true});
  if (viewport.width < 768) {
    const menu = page.locator('.mobile-navigation');
    await menu.locator('summary').click();
    await menu.getByRole('link', {name:'Квартиры'}).click();
    assert.equal(await menu.getAttribute('open'), null);
  }
  const project = await page.locator('#project-results [data-project-card]').first().getAttribute('data-project-card');
  assert.ok(project);
  await page.evaluate(slug => { location.hash = 'project/' + encodeURIComponent(slug); }, project);
  await page.locator('#project-investment').waitFor({state:'visible'});
  assert.equal(await page.locator('.factor-card, .decision-score').count(), 0);
  await page.locator('.header [data-action="home"]').click();
  await page.locator('#cinema-hero').waitFor({state:'visible'});
  assert.equal(await page.locator('footer').getByRole('link',{name:'О Mainhall',exact:true}).count(),1);
  await page.evaluate(() => scrollTo({top:0,behavior:'instant'}));
  await page.screenshot({path:'design-proof/home-'+viewport.width+'.png',fullPage:true});
  await page.goto('http://127.0.0.1:8091/projects/',{waitUntil:'networkidle'});
  assert.equal(await page.locator('.mh-project-row').count(),expectedProjects);
  await page.getByRole('textbox',{name:'Поиск проектов'}).fill('HIGH LIFE');
  assert.equal(await page.locator('.mh-project-row').count(),1);
  await page.locator('.mh-project-row').click();
  await page.getByRole('heading',{level:1,name:'HIGH LIFE'}).waitFor();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth),true);
  await page.screenshot({path:'design-proof/project-'+viewport.width+'.png',fullPage:true});
  await page.goto('http://127.0.0.1:8091/units/',{waitUntil:'networkidle'});
  assert.match(await page.getByRole('status').innerText(),new RegExp('ещё \\d+ ЖК доступны для подбора'));
  assert.equal(await page.locator('.mh-project-result').count(),Math.min(expectedProjects,24));
  await page.getByLabel('Жилой комплекс').selectOption('opus');
  assert.equal(await page.locator('.mh-project-result').count(),1);
  assert.match(await page.locator('.mh-project-result').innerText(),/Подбор по запросу/);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth),true,'units overflow '+viewport.width);
  await page.screenshot({path:'design-proof/units-'+viewport.width+'.png',fullPage:true});
  for(const route of ['/districts/paveletskaya/','/analytics/rassrochka-ot-zastroishchika/','/collections/u-vody/','/about/','/installments/','/investments/','/projects/level-yuzhnoportovaya/','/projects/kvartal-serebryany-bor/']){
   await page.goto('http://127.0.0.1:8091'+route,{waitUntil:'networkidle'});
   assert.equal(await page.getByRole('heading',{level:1}).count(),1);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth),true,'overflow '+route+' '+viewport.width);
   await page.screenshot({path:'design-proof/'+route.split('/')[1]+'-'+viewport.width+'.png',fullPage:true});
  }
  await page.goto('http://127.0.0.1:8091/projects/level-yuzhnoportovaya/',{waitUntil:'networkidle'});
  await page.getByLabel('Цена покупки, млн ₽',{exact:true}).fill('30');
  await page.getByLabel('Взнос в цену, млн ₽',{exact:true}).fill('3');
  await page.getByLabel('Прочие расходы, млн ₽',{exact:true}).fill('2');
  await page.waitForTimeout(100);
  assert.match(await page.locator('.mh-invest-scenario').first().innerText(),/121,6%/);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth),true,'investment calculation overflow '+viewport.width);
  await page.locator('.mh-invest-calculator').screenshot({path:'design-proof/investment-calculator-'+viewport.width+'.png'});
  assert.deepEqual(errors,[]);
  await page.close();
  console.log('PASS layout/menu/catalogue/project '+viewport.width);
 }
 const page=await browser.newPage({reducedMotion:'reduce',viewport:{width:390,height:844}});
 await page.goto('http://127.0.0.1:8091/',{waitUntil:'networkidle'});
 assert.equal(await page.getByRole('heading',{level:1}).isVisible(),true);
 assert.equal(await page.locator('body').evaluate(el => el.classList.contains('cinema-reveal-ready')),false);
 assert.equal(await page.locator('#cinema-hero').evaluate(el => el.style.getPropertyValue('--hero-image-y')), '0px');
 assert.equal(await page.locator('[data-cinema-pause]').isVisible(), false);
 await page.getByRole('button', {name:/Кадр 4 из 4/}).click();
 await page.locator('[data-scene="badaevsky"].is-active').waitFor();
 assert.equal(await page.locator('.cinema-frame.is-outgoing').count(), 0);
 console.log('PASS reduced motion');
 if(process.env.LOTTIE_STUDIO_URL){
  const studio=await browser.newPage({viewport:{width:1200,height:900}});
  for(const frame of [0,45,90,179]){
   await studio.goto(process.env.LOTTIE_STUDIO_URL+'/mainhall/scene-1?frame='+frame,{waitUntil:'networkidle'});
   const canvas=studio.locator('#main-canvas');await canvas.waitFor({state:'visible'});
   await studio.waitForTimeout(1200);
   await canvas.screenshot({path:'design-proof/lottie-frame-'+frame+'.png'});
   assert.equal(await canvas.evaluate(el=>el.width>0 && el.height>0),true);
  }
  console.log('PASS official Skottie player pinned frames');
 }
} finally { await browser.close(); }
