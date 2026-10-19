// Intake primitives for the event-driven MAINHALL coordinator
// (see docs/INFRASTRUCTURE_DISCOVERY.md §5). Dependency-free so it can run on
// any Node 20+ host once real server access exists. Nothing here is deployed.
import {createHmac,timingSafeEqual} from 'node:crypto';

// Verify a GitHub-style `X-Hub-Signature-256: sha256=<hex>` header over the raw body.
export function verifySignature(rawBody,signatureHeader,secret){
 if(!secret) throw new Error('webhook secret is required');
 if(typeof signatureHeader!=='string'||!signatureHeader.startsWith('sha256=')) return false;
 const expected=Buffer.from('sha256='+createHmac('sha256',secret).update(rawBody).digest('hex'));
 const given=Buffer.from(signatureHeader);
 return given.length===expected.length&&timingSafeEqual(given,expected);
}

// In-memory delivery-ID dedup with TTL and bounded size (persist in SQLite/Redis in production).
export function createDeduper({ttlMs=24*3600e3,maxEntries=10000,now=Date.now}={}){
 const seen=new Map();
 return {
  // true = first time this id is seen (process it); false = duplicate (ack and drop).
  accept(id){
   if(!id) return false;
   const t=now();
   for(const [k,exp] of seen){if(exp>t&&seen.size<maxEntries) break; seen.delete(k);}
   const exp=seen.get(id);
   if(exp&&exp>t) return false;
   seen.delete(id);
   seen.set(id,t+ttlMs);
   return true;
  },
  size:()=>seen.size,
 };
}

// Bounded exponential backoff: returns delay in ms for attempt n (1-based), or null when exhausted.
export function retryDelay(attempt,{baseMs=1000,maxMs=60e3,maxAttempts=5}={}){
 if(!Number.isInteger(attempt)||attempt<1||attempt>maxAttempts) return null;
 return Math.min(maxMs,baseMs*2**(attempt-1));
}

// Loop guard: only act on trusted human actors and explicit triggers, never on bot/automation output.
export function shouldDispatch({actor,actorType,body},{trustedActors=[],triggers=['[EXECUTE]','@claude']}={}){
 if(!actor||actorType==='Bot'||actor.endsWith('[bot]')) return false;
 if(!trustedActors.includes(actor)) return false;
 if(typeof body!=='string'||body.startsWith('[AUTOMATION')) return false;
 return triggers.some(t=>body.includes(t));
}
