const assert=require('node:assert/strict');
const fs=require('node:fs');const vm=require('node:vm');const ts=require('typescript');
const compiled=ts.transpileModule(fs.readFileSync('src/components/InvestmentCase.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const moduleBox={exports:{}};
vm.runInNewContext(compiled,{exports:moduleBox.exports,module:moduleBox,require:name=>name.endsWith('.css')?{}:require(name)});
const calc=moduleBox.exports.calculateInvestmentScenario;
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
// No growth and no costs must preserve capital.
let r=calc(30,10,0,4,0,0);near(r.profit,0);near(r.equityAfterExit,10);near(r.roi,0);near(r.annual,0);
// Selling at a higher price can still lose money after costs.
r=calc(30,10,4,4,3,10);near(r.profit,-1.32);assert.ok(r.roi<0);
// Other expenses are paid from own funds and included in total cash invested.
near(r.investedCapital,13);near(r.roi,-1.32/13*100);near(r.equityAfterExit-r.investedCapital,r.profit);
// Leverage can produce losses larger than the own capital.
r=calc(30,3,4,4,0,-10);near(r.equityAfterExit,-1.08);assert.ok(r.roi<-100);
// Archived arithmetic does not become a price forecast.
r=calc(30.33,8.19,4,1,0,(37/30.33-1)*100);near(r.profit,5.19);near(r.equityAfterExit,13.38);
// Zero proceeds after costs do not admit an annualized return.
r=calc(30,10,100,1,1,0);assert.equal(r.annual,null);
console.log('PASS investment model: cash reconciliation, expenses, leverage, archive arithmetic, annual edge case');
