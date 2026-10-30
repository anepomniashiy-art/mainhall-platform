const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');
const data=JSON.parse(fs.readFileSync('data/catalogue/research-projects-2026-10-26.json','utf8'));
const source=JSON.parse(fs.readFileSync('data/catalogue/research-handoff-2026-10-29.json','utf8'));
test('research handoff retains all 44 source table rows with unique canonical slugs',()=>{
 const rows=source.body.replaceAll('\\n','\n').split('\n').filter(x=>x.startsWith('| ')).slice(1);
 assert.equal(rows.length,44);assert.equal(data.projects.length,rows.length);assert.equal(new Set(data.projects.map(x=>x.slug)).size,44);
 for(let i=0;i<rows.length;i++){const c=rows[i].split('|').map(x=>x.trim()).slice(1,-1);const p=data.projects[i];assert.equal(p.name,c[0]);assert.equal(p.priceThousandPerSqm,Number(c[5]));assert.equal(p.score,Number(c[14]));assert.equal(p.maximumAdvertisedDiscountPercent,Number(c[9]));}
});
test('archive date and price meaning remain explicit and do not become forward returns',()=>{
 assert.equal(data.priceDate,'2026-10-26');assert.ok(data.methodology.includes('Прайс не равен цене сделки'));assert.ok(data.methodology.includes('не является процентом роста'));
 for(const p of data.projects){assert.ok(p.score>=0&&p.score<=100);assert.ok(p.priceThousandPerSqm>0);assert.ok(!('forecastPercent' in p));}
});
