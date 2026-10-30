import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
await mkdir('investment-proof',{recursive:true});
const browser=await chromium.launch();const checks=[];
try{
 for(const width of [1440,390,320]){
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
  // The existing map integration is outside this calculation/layout test.
  await page.route('**/maps.google.com/**',route=>route.abort());
  for(const slug of ['level-yuzhnoportovaya','kvartal-serebryany-bor','high-life']){
   const path='/projects/'+slug+'/';
   await page.goto('http://127.0.0.1:8091'+path,{waitUntil:'domcontentloaded'});
   const calculator=page.locator('.mh-invest-calculator-disclosure');
   await calculator.waitFor();
   assert.equal(await calculator.getAttribute('open'),null,'calculator must be secondary and collapsed');
   assert.equal(await page.locator('.mh-invest-inputs input').first().isVisible(),false);
   await calculator.locator(':scope > summary').click();
   await page.locator('.mh-invest-inputs input').first().waitFor();
   await page.waitForTimeout(700);
   assert.equal(await page.locator('h1').count(),1);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,'layout overflow '+width+path);
   await page.getByLabel('Цена покупки, млн ₽',{exact:true}).fill('30');
   await page.getByLabel('Взнос в цену, млн ₽',{exact:true}).fill('3');
   await page.getByLabel('Прочие расходы, млн ₽',{exact:true}).fill('2');
   await page.waitForTimeout(100);
   assert.match(await page.locator('.mh-invest-scenario').first().innerText(),/121,6%/);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,'calculation overflow '+width+path);
   if(slug==='level-yuzhnoportovaya')await page.locator('.mh-invest-calculator').screenshot({path:`investment-proof/calculator-${width}.png`});
   if(slug!=='high-life')await page.locator('.mh-invest-restored').screenshot({path:`investment-proof/${slug}-${width}.png`});
   checks.push({width,path,status:'pass'});
  }
  await page.goto('http://127.0.0.1:8091/investments/',{waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('.mh-invest-selection-card').count(),10);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,'selection overflow '+width);
  await page.locator('[data-compare-add="level-yuzhnoportovaya"]').click();
  await page.locator('[data-compare-add="high-life"]').click();
  await page.locator('[data-compare-open]').click();
  await page.locator('[data-project-comparison]').waitFor({state:'visible'});
  assert.match(await page.locator('[data-project-comparison]').innerText(),/16,73/);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,'comparison document overflow '+width);
  await page.locator('[data-project-comparison]').screenshot({path:`investment-proof/comparison-${width}.png`});
  await page.screenshot({path:`investment-proof/selection-${width}.png`});
  checks.push({width,path:'/investments/',status:'pass'});await page.close();
 }
}finally{await browser.close();await writeFile('investment-proof/results.json',JSON.stringify(checks,null,2));}
console.log('PASS investment browser checks',JSON.stringify(checks));
