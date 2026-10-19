import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {verifySignature,createDeduper,retryDelay,shouldDispatch} from '../src/lib/coordinator-intake.mjs';
const secret='test-only-secret';
const sign=b=>'sha256='+createHmac('sha256',secret).update(b).digest('hex');
test('accepts valid signature, rejects tampered/missing',()=>{
 const body='{"action":"created"}';
 assert.equal(verifySignature(body,sign(body),secret),true);
 assert.equal(verifySignature(body+' ',sign(body),secret),false);
 assert.equal(verifySignature(body,undefined,secret),false);
 assert.equal(verifySignature(body,'sha1=abc',secret),false);
 assert.throws(()=>verifySignature(body,sign(body),''));
});
test('dedups delivery ids within TTL and bounds memory',()=>{
 let t=0;const d=createDeduper({ttlMs:1000,maxEntries:3,now:()=>t});
 assert.equal(d.accept('a'),true);
 assert.equal(d.accept('a'),false);
 assert.equal(d.accept(''),false);
 t=1500;assert.equal(d.accept('a'),true);
 for(const id of ['b','c','d','e']) d.accept(id);
 assert.ok(d.size()<=3);
});
test('bounded exponential retry',()=>{
 assert.deepEqual([1,2,3,4,5].map(n=>retryDelay(n)),[1000,2000,4000,8000,16000]);
 assert.equal(retryDelay(6),null);
 assert.equal(retryDelay(0),null);
 assert.equal(retryDelay(10,{maxAttempts:20,maxMs:30000}),30000);
});
test('loop guard ignores bots and automation output',()=>{
 const o={trustedActors:['owner']};
 assert.equal(shouldDispatch({actor:'owner',actorType:'User',body:'[EXECUTE] do x'},o),true);
 assert.equal(shouldDispatch({actor:'github-actions[bot]',actorType:'Bot',body:'[EXECUTE]'},o),false);
 assert.equal(shouldDispatch({actor:'stranger',actorType:'User',body:'@claude'},o),false);
 assert.equal(shouldDispatch({actor:'owner',actorType:'User',body:'[AUTOMATION REPORT] @claude'},o),false);
 assert.equal(shouldDispatch({actor:'owner',actorType:'User',body:'just a note'},o),false);
});
