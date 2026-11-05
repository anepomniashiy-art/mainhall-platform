import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {team} from '../src/lib/team.mjs';
import {researchItems} from '../src/lib/research-recovery.mjs';

const legacy = readFileSync('public/legacy-mainhall/index.html', 'utf8');

test('every team member matches a card on the legacy site', () => {
  assert.equal(team.length, 3);
  for (const m of team) {
    const asset = m.photoSource.replace('public', '');
    assert.ok(legacy.includes(`src="${asset}" alt="${m.name}"`), `photo+name card for ${m.name}`);
    assert.ok(legacy.includes(`<h3>${m.name}</h3> <div class="role">${m.role}</div>`), `role for ${m.name}`);
    assert.ok(legacy.includes(m.bio), `bio for ${m.name}`);
  }
});

test('team photos exist and carry no EXIF segment', () => {
  for (const m of team) {
    const file = `public${m.photo}`;
    assert.ok(existsSync(file), file);
    const d = readFileSync(file);
    assert.equal(d.readUInt16BE(0), 0xffd8);
    assert.equal(d.indexOf(Buffer.from('Exif\0')), -1, `${file} has EXIF`);
  }
});

test('team data exposes no contact details', () => {
  const s = JSON.stringify(team);
  assert.doesNotMatch(s, /\+7|@|t\.me|wa\.me|tel:/);
});

test('unrecovered research carries no facts, prices or scenarios', () => {
  for (const r of researchItems) {
    if (r.status !== 'recovered') {
      assert.deepEqual(r.facts, []);
      assert.deepEqual(r.scenarios, []);
    } else {
      assert.ok(r.sourceUrls.length && r.originalDate, `${r.slug} needs sources and date`);
    }
  }
});
