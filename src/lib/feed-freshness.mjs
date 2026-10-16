// Freshness gate for authorised official developer feeds.
// Refuse stale or future-dated snapshots BEFORE any database writes.
// A feed being fresh does not prove its permission evidence or unit completeness.
export function assertFeedFreshness(generatedAt, options = {}) {
  const {now = new Date(), maxAgeHours = 72, futureSkewMinutes = 10} = options;
  const received = generatedAt instanceof Date ? generatedAt : new Date(generatedAt);
  const clock = now instanceof Date ? now : new Date(now);
  if (!Number.isFinite(received.getTime()) || !Number.isFinite(clock.getTime()))
    throw Error('Invalid feed timestamp or reference clock');
  if (!Number.isFinite(maxAgeHours) || maxAgeHours <= 0 || maxAgeHours > 168)
    throw Error('maxAgeHours must be > 0 and <= 168');
  if (!Number.isFinite(futureSkewMinutes) || futureSkewMinutes < 0 || futureSkewMinutes > 60)
    throw Error('futureSkewMinutes must be between 0 and 60');
  const ageMs = clock.getTime() - received.getTime();
  if (ageMs < -futureSkewMinutes * 60_000)
    throw Error('Feed generatedAt is in the future');
  if (ageMs > maxAgeHours * 3_600_000)
    throw Error('Feed generatedAt is stale');
  return {
    generatedAt: received.toISOString(),
    ageHours: Math.max(0, ageMs / 3_600_000),
    maxAgeHours
  };
}
