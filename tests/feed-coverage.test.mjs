import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeOfficialFeed,coverageSummary} from '../src/lib/official-feed.mjs';
function feed(units) { return normalizeOfficialFeed({
  permission:{dataProcessingAllowed:true,evidence:'TEST ONLY, not a real licence'},
  generatedAt:new Date().toISOString(),
  developer:{slug:'test-dev',name:'Test',officialUrl:'https://example.test'},
  project:{slug:'test-project',name:'Test',officialUrl:'https://example.test/project'},
  units
}); }
const row=(id,price,status,building)=>({sourceId:id,sourceUrl:`https://example.test/${id}`,
  areaSqm:50,priceRub:price,salesStatus:status,buildingName:building});
test('reports exact counts and price/status completeness without treating UNKNOWN as available',()=>{
  const c=coverageSummary(feed([row('1','30000000','AVAILABLE','Tower A'),
    row('2',null,'UNKNOWN','Tower A'),row('3','20000000','SOLD','Tower B')]));
  assert.equal(c.projectsInFeed,1);
  assert.equal(c.buildingsNamedInFeed,2);
  assert.equal(c.units,3);
  assert.equal(c.unitsWithPrice,2);
  assert.equal(c.unitsWithKnownStatus,2);
  assert.equal(c.priceCoveragePct,66.67);
  assert.equal(c.statusCoveragePct,66.67);
  assert.equal(c.unitsAboveThreshold,1);
  assert.equal(c.statusCounts.UNKNOWN,1);
  assert.equal(c.statusCounts.AVAILABLE,1);
  assert.equal(c.statusCounts.SOLD,1);
});
test('preserves below-threshold units in coverage',()=>{
  const c=coverageSummary(feed([row('below','15000000','RESERVED','Block 1')]));
  assert.equal(c.units,1);
  assert.equal(c.unitsAboveThreshold,0);
  assert.equal(c.statusCounts.RESERVED,1);
});
test('empty feed reports null completeness instead of a fabricated percentage',()=>{
  const c=coverageSummary(feed([]));
  assert.equal(c.units,0);
  assert.equal(c.priceCoveragePct,null);
  assert.equal(c.statusCoveragePct,null);
  assert.equal(c.buildingsNamedInFeed,0);
});
test('unnamed buildings are not counted as verified building identities',()=>{
  const c=coverageSummary(feed([row('x',null,'UNKNOWN',null),row('y',null,'UNKNOWN','')]));
  assert.equal(c.buildingsNamedInFeed,0);
  assert.equal(c.unitsWithoutBuilding,2);
});
