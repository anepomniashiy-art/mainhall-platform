// Import contract for an explicitly authorised first-party/partner feed.
// No scraping, login, CAPTCHA bypass or inferred sale status.
const STATUSES = new Set(['AVAILABLE','RESERVED','SOLD','BLOCKED','UNKNOWN']);
function str(x,name) {
  if (typeof x !== 'string' || !x.trim()) throw Error(name + ' required');
  return x.trim();
}
function url(x,name) {
  const v = str(x,name);
  let u;
  try { u = new URL(v); } catch { throw Error(name + ' invalid URL'); }
  if (u.protocol !== 'https:') throw Error(name + ' requires HTTPS');
  return u.toString();
}
function slug(x,name) {
  const v = str(x,name);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v)) throw Error(name + ' invalid slug');
  return v;
}
export function normalizeOfficialFeed(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw Error('Invalid feed');
  if (input.permission?.dataProcessingAllowed !== true ||
      typeof input.permission?.evidence !== 'string' ||
      input.permission.evidence.trim().length < 8) throw Error('Written permission evidence required');
  const generatedAt = new Date(str(input.generatedAt,'generatedAt'));
  if (!Number.isFinite(generatedAt.getTime()) || generatedAt.getTime() > Date.now()+600000)
    throw Error('Invalid generatedAt');
  const developer = {slug:slug(input.developer?.slug,'developer.slug'),
    name:str(input.developer?.name,'developer.name'),
    officialUrl:url(input.developer?.officialUrl,'developer.officialUrl')};
  const project = {slug:slug(input.project?.slug,'project.slug'),
    name:str(input.project?.name,'project.name'),
    officialUrl:url(input.project?.officialUrl,'project.officialUrl'),
    district:input.project?.district || null,
    projectClass:input.project?.projectClass || null};
  if (!Array.isArray(input.units)) throw Error('units must be an array');
  const seen = new Set();
  const units = input.units.map((row,i)=>{
    const key = 'units['+i+']';
    const sourceId = str(row?.sourceId,key+'.sourceId');
    if (seen.has(sourceId)) throw Error('duplicate sourceId '+sourceId);
    seen.add(sourceId);
    const areaSqm = Number(row.areaSqm);
    if (!Number.isFinite(areaSqm) || areaSqm < 1 || areaSqm > 10000) throw Error(key+' invalid areaSqm');
    const salesStatus = row.salesStatus ?? 'UNKNOWN';
    if (!STATUSES.has(salesStatus)) throw Error(key+' invalid salesStatus');
    let priceRub = null;
    if (row.priceRub !== null && row.priceRub !== undefined && row.priceRub !== '') {
      const p = String(row.priceRub);
      if (!/^[1-9]\d*$/.test(p) || BigInt(p)>BigInt(Number.MAX_SAFE_INTEGER)) throw Error(key+' invalid priceRub');
      priceRub = BigInt(p);
    }
    const floor = row.floor == null ? null : Number(row.floor);
    const rooms = row.rooms == null ? null : Number(row.rooms);
    if (floor!==null && (!Number.isInteger(floor)||floor< -5||floor>250)) throw Error(key+' invalid floor');
    if (rooms!==null && (!Number.isInteger(rooms)||rooms<0||rooms>30)) throw Error(key+' invalid rooms');
    return {sourceId,sourceUrl:url(row.sourceUrl,key+'.sourceUrl'),
      buildingName:row.buildingName||null,unitNumber:row.unitNumber==null?null:String(row.unitNumber),
      floor,rooms,areaSqm,priceRub,salesStatus,
      pricePerSqm:priceRub===null?null:Math.round(Number(priceRub)/areaSqm),
      finish:row.finish||null};
  });
  return {developer,project,generatedAt,units,permissionEvidence:input.permission.evidence.trim()};
}
export function coverageSummary(feed) {
  return {developer:feed.developer.slug,project:feed.project.slug,units:feed.units.length,
    unitsWithPrice:feed.units.filter(u=>u.priceRub!==null).length,
    unitsWithKnownStatus:feed.units.filter(u=>u.salesStatus!=='UNKNOWN').length,
    unitsAboveThreshold:feed.units.filter(u=>u.pricePerSqm!==null&&u.pricePerSqm>=600000).length,
    generatedAt:feed.generatedAt.toISOString()};
}
