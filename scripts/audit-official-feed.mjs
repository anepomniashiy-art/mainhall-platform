#!/usr/bin/env node
// Validate an authorised JSON feed before import. Never writes to the database.
import {readFile} from 'node:fs/promises';
import {auditOfficialFeed} from '../src/lib/feed-audit.mjs';
const filename=process.argv[2];
if(!filename || filename.startsWith('--')){
  console.error('Usage: node scripts/audit-official-feed.mjs <approved-feed.json>');
  process.exit(2);
}
try{
  const result=auditOfficialFeed(JSON.parse(await readFile(filename,'utf8')));
  console.log(JSON.stringify(result,null,2));
}catch(e){
  console.error('Audit failed:',e.message);
  process.exitCode=1;
}
