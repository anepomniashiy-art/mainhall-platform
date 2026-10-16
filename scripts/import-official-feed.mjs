#!/usr/bin/env node
// Import developer-authorised JSON feed. Never scrape arbitrary websites.
import {readFile} from 'node:fs/promises';
import {normalizeOfficialFeed,coverageSummary} from '../src/lib/official-feed.mjs';
const filename=process.argv[2];
const dryRun=process.argv.includes('--dry-run');
if (!filename || filename.startsWith('--')) {
  console.error('Usage: node scripts/import-official-feed.mjs <approved-feed.json> [--dry-run]');
  process.exit(2);
}
let prisma,run;
try {
  const feed=normalizeOfficialFeed(JSON.parse(await readFile(filename,'utf8')));
  const coverage=coverageSummary(feed);
  if (dryRun) {
    console.log(JSON.stringify({mode:'dry-run',coverage,persisted:false},null,2));
    process.exit(0);
  }
  if (!process.env.DATABASE_URL) throw Error('DATABASE_URL missing; no import attempted');
  const {PrismaClient}=await import('@prisma/client');
  prisma=new PrismaClient();
  run=await prisma.importRun.create({data:{connectorName:'authorised_partner_feed:'+feed.developer.slug,status:'running'}});
  const developer=await prisma.developer.upsert({where:{slug:feed.developer.slug},
    create:feed.developer,update:{name:feed.developer.name,officialUrl:feed.developer.officialUrl}});
  const project=await prisma.project.upsert({where:{slug:feed.project.slug},
    create:{...feed.project,developerId:developer.id},
    update:{...feed.project,developerId:developer.id}});
  let created=0,updated=0;
  const buildings=new Map();
  for (const row of feed.units) {
    let buildingId=null;
    if (row.buildingName) {
      if (!buildings.has(row.buildingName)) {
        let building=await prisma.building.findFirst({where:{projectId:project.id,name:row.buildingName}});
        if (!building) building=await prisma.building.create({data:{projectId:project.id,name:row.buildingName}});
        buildings.set(row.buildingName,building.id);
      }
      buildingId=buildings.get(row.buildingName);
    }
    const old=await prisma.unit.findUnique({where:{unit_source_unique:{projectId:project.id,sourceId:row.sourceId}}});
    const data={projectId:project.id,sourceId:row.sourceId,buildingId,
      unitNumber:row.unitNumber,floor:row.floor,rooms:row.rooms,
      areaSqm:row.areaSqm,finish:row.finish,priceRub:row.priceRub,
      pricePerSqm:row.pricePerSqm,salesStatus:row.salesStatus,
      sourceUrl:row.sourceUrl,fetchedAt:feed.generatedAt,lastSeenAt:new Date()};
    await prisma.$transaction(async tx=>{
      const unit=old?await tx.unit.update({where:{id:old.id},data}):await tx.unit.create({data});
      if (row.priceRub!==null && (!old || old.priceRub!==row.priceRub)) {
        await tx.priceSnapshot.create({data:{unitId:unit.id,priceRub:row.priceRub,
          pricePerSqm:row.pricePerSqm,source:row.sourceUrl,snapshotAt:feed.generatedAt}});
      }
      if (old && old.salesStatus!==row.salesStatus) {
        await tx.availabilityEvent.create({data:{unitId:unit.id,oldStatus:old.salesStatus,
          newStatus:row.salesStatus,source:row.sourceUrl,eventAt:feed.generatedAt}});
      }
    });
    if (old) updated++; else created++;
  }
  if (feed.units.some(u=>u.pricePerSqm!==null&&u.pricePerSqm>=600000)) {
    await prisma.project.update({where:{id:project.id},data:{meetsThreshold:true}});
  }
  await prisma.sourceRecord.create({data:{projectId:project.id,importRunId:run.id,
    sourceType:'broker_feed',sourceUrl:feed.project.officialUrl,fetchedAt:feed.generatedAt,
    rawData:{permissionEvidence:feed.permissionEvidence,importedFile:filename,unitCount:feed.units.length}}});
  await prisma.importRun.update({where:{id:run.id},data:{status:'completed',
    recordsTotal:feed.units.length,recordsNew:created,recordsUpdated:updated,finishedAt:new Date()}});
  console.log(JSON.stringify({mode:'import',runId:run.id,coverage,created,updated,persisted:true},null,2));
} catch (error) {
  if (prisma&&run) {
    try {await prisma.importRun.update({where:{id:run.id},data:{status:'failed',
      finishedAt:new Date(),errors:{message:String(error.message)}}});}
    catch(e){console.error('Failed to record import error:',e.message);}
  }
  console.error('Import failed:',error.message);
  process.exitCode=1;
} finally {if(prisma)await prisma.$disconnect();}
