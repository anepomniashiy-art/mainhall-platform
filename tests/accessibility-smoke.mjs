import {chromium} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
await mkdir('design-proof',{recursive:true});
const browser=await chromium.launch({headless:true});
const results=[];
try{
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'});
  for(const path of ['/','/projects/','/projects/high-life/','/units/','/commercial/','/contacts/','/privacy/','/investment-rating/']){
   await page.goto('http://127.0.0.1:8091'+path,{waitUntil:'networkidle'});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Horizontal overflow '+path+' '+width);
   const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
   const violations=audit.violations.filter(v=>v.impact==='critical'||v.impact==='serious');
   results.push({path,width,violations:violations.map(v=>({id:v.id,impact:v.impact,description:v.description,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))});
   await page.screenshot({path:'design-proof/audit-'+(path==='/'?'home':path.replaceAll('/','-'))+'-'+width+'.png',fullPage:true});
  }
  await page.close();
 }
}finally{await browser.close();}
await writeFile('design-proof/accessibility.json',JSON.stringify(results,null,2));
const failures=results.filter(r=>r.violations.length);
assert.equal(failures.length,0,JSON.stringify(failures));
console.log('PASS: critical/serious automated accessibility rules and horizontal layouts on mobile and desktop');
