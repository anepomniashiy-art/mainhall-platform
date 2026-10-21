import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { chromium } from 'playwright';
await mkdir('design-proof', { recursive: true });
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
  await page.getByRole('heading',{level:1}).waitFor({state:'visible'});
  await page.waitForTimeout(1800);
  assert.equal(await page.locator('.hero-image.is-active').evaluate(el=>el.complete && el.naturalWidth>0),true);
  await page.screenshot({path:'design-proof/top-'+viewport.width+'.png'});
  await page.screenshot({path:'design-proof/layout-'+viewport.width+'.png',fullPage:true});
  const overflow = await page.evaluate(()=>Array.from(document.querySelectorAll('body *')).filter(el=>el.getBoundingClientRect().right>innerWidth+1 && getComputedStyle(el).position!=='absolute').slice(0,10).map(el=>({tag:el.tagName,cls:el.className,right:el.getBoundingClientRect().right})));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth),true,JSON.stringify(overflow));
  await page.getByRole('button',{name:'02 OPUS',exact:true}).click();
  assert.equal(await page.locator('.hero-image.is-active').getAttribute('src'),'/images/projects/opus.jpg');
  await page.getByRole('button',{name:'01 Николь',exact:true}).click();
  await page.locator('.mh-approach-signature').scrollIntoViewIfNeeded();
  await page.locator('.mh-motion-player svg').waitFor({state:'visible'});
  await page.getByRole('tab',{name:'Павелецкая',exact:true}).click();
  assert.match(await page.locator('.mh-district-visual img').getAttribute('src'),/opus/);
  await page.getByRole('tab',{name:'Китай-город',exact:true}).click();
  assert.match(await page.locator('.mh-district-visual img').getAttribute('src'),/lumin/);
  for(const person of ['pavel','evgeny']){
   const frame=page.locator('.mh-team-portrait-'+person);
   await frame.scrollIntoViewIfNeeded();
   await frame.locator('img').evaluate(async img=>{await img.decode();});
   const geometry=await frame.evaluate(el=>{
    const img=el.querySelector('img'),a=el.getBoundingClientRect(),b=img.getBoundingClientRect();
    return {loaded:img.complete&&img.naturalWidth>0,ratio:b.width/b.height,natural:img.naturalWidth/img.naturalHeight,covers:b.left<=a.left+1&&b.top<=a.top+1&&b.right>=a.right-1&&b.bottom>=a.bottom-1};
   });
   assert.equal(geometry.loaded,true,person+' loaded');
   assert.equal(geometry.covers,true,person+' fills portrait frame '+JSON.stringify(geometry));
   assert.ok(Math.abs(geometry.ratio-geometry.natural)<.005,person+' preserves source proportions');
  }
  await page.locator('.mh-team-grid').screenshot({path:'design-proof/team-'+viewport.width+'.png'});
  await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
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
  for(const route of ['/districts/paveletskaya/','/analytics/rassrochka-ot-zastroishchika/','/collections/u-vody/','/about/','/installments/']){
   await page.goto('http://127.0.0.1:8091'+route,{waitUntil:'networkidle'});
   assert.equal(await page.getByRole('heading',{level:1}).count(),1);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth),true,'overflow '+route+' '+viewport.width);
   await page.screenshot({path:'design-proof/'+route.split('/')[1]+'-'+viewport.width+'.png',fullPage:true});
  }
  assert.deepEqual(errors,[]);
  await page.close();
  console.log('PASS layout/menu/catalogue/project '+viewport.width);
 }
 const page=await browser.newPage({reducedMotion:'reduce',viewport:{width:390,height:844}});
 await page.goto('http://127.0.0.1:8091/',{waitUntil:'networkidle'});
 assert.equal(await page.getByRole('heading',{level:1}).isVisible(),true);
 assert.equal(await page.locator('.hero-line span').first().evaluate(el=>getComputedStyle(el).transform),'none');
 assert.equal(await page.locator('.mh-motion-player svg').count(),0);
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
