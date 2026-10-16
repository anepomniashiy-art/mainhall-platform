// Standalone pre-import audit; no DB writes and no proof of media rights.
import {normalizeOfficialFeed, coverageSummary} from './official-feed.mjs';
import {assertFeedFreshness} from './feed-freshness.mjs';
export function auditOfficialFeed(input, options={}) {
  const feed=normalizeOfficialFeed(input);
  const freshness=assertFeedFreshness(feed.generatedAt,options);
  const summary=coverageSummary(feed);
  const statusCounts={AVAILABLE:0,RESERVED:0,SOLD:0,BLOCKED:0,UNKNOWN:0};
  const buildingNames=new Set();
  for(const u of feed.units){
    statusCounts[u.salesStatus]++;
    if(typeof u.buildingName==='string' && u.buildingName.trim()) buildingNames.add(u.buildingName.trim());
  }
  const ratio=n=>feed.units.length===0?null:Math.round(10000*n/feed.units.length)/100;
  return {...summary,projectsInFeed:1,buildingsNamedInFeed:buildingNames.size,
    priceCoveragePct:ratio(summary.unitsWithPrice),statusCoveragePct:ratio(summary.unitsWithKnownStatus),
    statusCounts,freshness,sourcePermissionEvidenceProvided:!!feed.permissionEvidence,
    mediaRightsIndependentlyVerified:false,persisted:false};
}
