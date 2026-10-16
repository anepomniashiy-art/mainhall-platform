import test from 'node:test';
import assert from 'node:assert/strict';
import {assertFeedFreshness} from '../src/lib/feed-freshness.mjs';

const now = new Date('2026-10-16T09:00:00Z');

test('accepts a recent feed and returns its measured age', () => {
  const result = assertFeedFreshness('2026-10-16T08:00:00Z', {now});
  assert.equal(result.ageHours, 1);
  assert.equal(result.maxAgeHours, 72);
});
test('rejects stale feeds', () => {
  assert.throws(() => assertFeedFreshness('2026-10-12T00:00:00Z', {now}), /stale/);
});
test('rejects timestamps too far in the future', () => {
  assert.throws(() => assertFeedFreshness('2026-10-16T10:00:00Z', {now}), /future/);
});
test('allows small source clock skew', () => {
  assert.equal(assertFeedFreshness('2026-10-16T09:05:00Z', {now}).ageHours, 0);
});
test('rejects invalid timestamps and unsafe age configuration', () => {
  assert.throws(() => assertFeedFreshness('not-a-date', {now}), /Invalid/);
  assert.throws(() => assertFeedFreshness(now, {now, maxAgeHours: 0}), /maxAgeHours/);
  assert.throws(() => assertFeedFreshness(now, {now, maxAgeHours: 1000}), /maxAgeHours/);
});
