export function assertImportFreshness(feed, now = new Date(), maxAgeHours = 72) {
  if (!(feed?.generatedAt instanceof Date)) throw Error('Invalid generatedAt');
  const age = now.getTime() - feed.generatedAt.getTime();
  if (!Number.isFinite(age) || age < -600000 || age > maxAgeHours * 3600000) throw Error('Feed timestamp outside freshness window');
  if (!Array.isArray(feed.units) || feed.units.length === 0) throw Error('Empty feed cannot be imported');
  return { ageHours: Math.max(0, age / 3600000), unitCount: feed.units.length };
}
