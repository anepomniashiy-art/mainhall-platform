import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
await mkdir('design-proof', { recursive: true });
const browser = await chromium.launch();
try {
 for (const viewport of [{width:1440,height:1000},{width:390,height:844},{width:320,height:740}]) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://127.0.0.1:8091/',{waitUntil:'networkidle'});
  await page.getByRole('heading',{level:1}).waitFor({state:'visible'});
  await page.waitForTimeout(1800);
  assert.equal(await page.locator('.hero-image').evaluate(el=>el.complete && el.naturalWidth>0),true);
  await page.screenshot({path:'design-proof/layout-'+viewport.width+'.png',fullPage:true});
  const overflow = await page.evaluate(()=>Array.from(document.querySelectorAll('body *')).filter(el=>el.getBoundingClientRect().right>innerWidth+1 && getComputedStyle(el).position!=='absolute').slice(0,10).map(el=>({tag:el.tagName,cls:el.className,right:el.getBoundingClientRect().right})));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth),true,JSON.stringify(overflow));
  if(viewport.width<768){
   await page.getByRole('button',{name:'Открыть меню'}).click();
   assert.equal(await page.getByRole('navigation',{name:'Мобильная навигация'}).isVisible(),true);
   await page.getByRole('button',{name:'Закрыть меню'}).click();
  }
  await page.screenshot({path:'design-proof/home-'+viewport.width+'.png',fullPage:true});
  await page.goto('http://127.0.0.1:8091/projects/',{waitUntil:'networkidle'});
  assert.equal(await page.locator('.mh-project-row').count(),17);
  await page.getByRole('textbox',{name:'Поиск проектов'}).fill('HIGH LIFE');
  assert.equal(await page.locator('.mh-project-row').count(),1);
  await page.locator('.mh-project-row').click();
  await page.getByRole('heading',{level:1,name:'HIGH LIFE'}).waitFor();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth),true);
  await page.screenshot({path:'design-proof/project-'+viewport.width+'.png',fullPage:true});
  assert.deepEqual(errors,[]);
  await page.close();
  console.log('PASS layout/menu/catalogue/project '+viewport.width);
 }
 const page=await browser.newPage({reducedMotion:'reduce',viewport:{width:390,height:844}});
 await page.goto('http://127.0.0.1:8091/',{waitUntil:'networkidle'});
 assert.equal(await page.getByRole('heading',{level:1}).isVisible(),true);
 assert.equal(await page.locator('.hero-line span').first().evaluate(el=>getComputedStyle(el).transform),'none');
 console.log('PASS reduced motion');
} finally { await browser.close(); }
