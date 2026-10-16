import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeOfficialFeed,coverageSummary} from '../src/lib/official-feed.mjs';
const fixture=()=>({permission:{dataProcessingAllowed:true,evidence:'Test-only approval reference'},
 generatedAt:'2026-10-15T12:00:00Z',
 developer:{slug:'example-dev',name:'Test developer',officialUrl:'https://example.test'},
 project:{slug:'example-project',name:'Test project',officialUrl:'https://example.test/project'},
 units:[{sourceId:'unit-1',sourceUrl:'https://example.test/u1',areaSqm:50,
 priceRub:'30000000',salesStatus:'UNKNOWN'},
 {sourceId:'unit-2',sourceUrl:'https://example.test/u2',areaSqm:55,
 priceRub:null,salesStatus:'AVAILABLE'}]});
test('preserves unknown price/status and threshold',()=>{
 const f=normalizeOfficialFeed(fixture());
 assert.equal(f.units[0].pricePerSqm,600000);
 assert.equal(f.units[1].priceRub,null);
 assert.equal(f.units[0].salesStatus,'UNKNOWN');
 assert.equal(coverageSummary(f).unitsWithPrice,1);
});
test('requires written permission',()=>{
 const f=fixture();delete f.permission;
 assert.throws(()=>normalizeOfficialFeed(f),/permission/);
});
test('rejects duplicate source IDs',()=>{
 const f=fixture();f.units[1].sourceId='unit-1';
 assert.throws(()=>normalizeOfficialFeed(f),/duplicate/);
});
test('rejects insecure URLs',()=>{
 const f=fixture();f.units[0].sourceUrl='http://example.test/u1';
 assert.throws(()=>normalizeOfficialFeed(f),/HTTPS/);
});
test('rejects invented statuses and unsafe prices',()=>{
 const f=fixture();f.units[0].salesStatus='MAYBE';
 assert.throws(()=>normalizeOfficialFeed(f),/salesStatus/);
 f.units[0].salesStatus='UNKNOWN';f.units[0].priceRub='999999999999999999999';
 assert.throws(()=>normalizeOfficialFeed(f),/priceRub/);
});
