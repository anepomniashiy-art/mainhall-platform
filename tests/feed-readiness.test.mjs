import test from 'node:test';
import assert from 'node:assert/strict';
import {assertImportFreshness} from '../src/lib/feed-readiness.mjs';
const now = new Date('2026-10-16T10:00:00Z');
const feed = generatedAt => ({generatedAt:new Date(generatedAt),units:[{sourceId:'one'}]});
test('accepts a recent nonempty feed',()=>{
 const result=assertImportFreshness(feed('2026-10-16T09:00:00Z'),now);
 assert.equal(result.unitCount,1);
 assert.equal(result.ageHours,1);
});
test('rejects stale feed before database writes',()=>{
 assert.throws(()=>assertImportFreshness(feed('2026-10-12T09:00:00Z'),now),/freshness/);
});
test('rejects future feed',()=>{
 assert.throws(()=>assertImportFreshness(feed('2026-10-16T11:00:00Z'),now),/freshness/);
});
test('rejects empty feed to avoid false sold-out inference',()=>{
 assert.throws(()=>assertImportFreshness({generatedAt:now,units:[]},now),/Empty feed/);
});
