const test=require('node:test');const assert=require('node:assert/strict');
const {selectRequest}=require('../scripts/agent-contact.cjs');
const r={id:'check-28',issue:28};const now=Date.parse('2026-10-29T12:00:00Z');
test('unanswered issue body enters queue even with no comments',()=>assert.deepEqual(selectRequest([r],{},now),r));
test('terminal result is not run again',()=>assert.equal(selectRequest([r],{28:[{body:'<!-- agent-contact:check-28:finished -->'}]},now),null));
test('active receipt prevents duplicate paid run',()=>assert.equal(selectRequest([r],{28:[{body:'<!-- agent-contact:check-28:received -->',created_at:'2026-10-29T11:55:00Z'}]},now),null));
test('stale receipt recovers after runner failure',()=>assert.deepEqual(selectRequest([r],{28:[{body:'<!-- agent-contact:check-28:received -->',created_at:'2026-10-29T11:00:00Z'}]},now),r));
test('two abandoned runs cap automatic retries',()=>assert.equal(selectRequest([r],{28:[1,2].map(()=>({body:'<!-- agent-contact:check-28:received -->',created_at:'2026-10-29T10:00:00Z'}))},now),null));
test('unsafe request is rejected',()=>assert.throws(()=>selectRequest([{id:'x\n',issue:28}],{},now)));
