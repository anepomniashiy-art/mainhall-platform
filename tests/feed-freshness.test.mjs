import test from 'node:test';
import assert from 'node:assert/strict';
import {assertFeedFreshness} from '../src/lib/feed-freshness.mjs';
const now = new Date('2026-10-16T12:00:00Z');
test('recent source snapshot passes',()=>{
  assert.equal(assertFeedFreshness('2026-10-16T10:00:00Z',{now}).ageHours,2);
});
test('stale source snapshot fails',()=>{
  assert.throws(()=>assertFeedFreshness('2026-10-12T12:00:00Z',{now}),/stale/);
});
test('future source snapshot fails',()=>{
  assert.throws(()=>assertFeedFreshness('2026-10-16T12:11:00Z',{now}),/future/);
});
test('small clock skew is allowed',()=>{
  assert.equal(assertFeedFreshness('2026-10-16T12:05:00Z',{now}).ageHours,0);
});
test('invalid timestamp or max age fails',()=>{
  assert.throws(()=>assertFeedFreshness('not a date',{now}),/Invalid/);
  assert.throws(()=>assertFeedFreshness(now,{now,maxAgeHours:999}),/maxAgeHours/);
});
