import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { randomUUID } from 'node:crypto';

const context = vm.createContext({ console, process, fetch, Response });
const modules = new Map();
let currentDb;
const synthetic = (exports) => new vm.SyntheticModule(Object.keys(exports), function () {
  for (const [key, value] of Object.entries(exports)) this.setExport(key, value);
}, { context });
modules.set('crypto', synthetic({ randomUUID }));
modules.set('next/server', synthetic({ NextResponse: { json: (body, options = {}) => new Response(JSON.stringify(body), { status: options.status || 200 }) } }));
modules.set(path.resolve('lib/supabase.js'), synthetic({ getSupabase: () => currentDb }));
modules.set(path.resolve('lib/cloudinary.js'), synthetic({ getCloudinary: () => { throw new Error('Unexpected Cloudinary call'); } }));
async function load(filename) {
  const id = path.resolve(filename);
  if (modules.has(id)) return modules.get(id);
  const module = new vm.SourceTextModule(await fs.readFile(id, 'utf8'), { context, identifier: id });
  modules.set(id, module);
  await module.link(async (specifier, referencing) => {
    if (modules.has(specifier)) return modules.get(specifier);
    return load(path.resolve(path.dirname(referencing.identifier), specifier + (path.extname(specifier) ? '' : '.js')));
  });
  return module;
}
async function exportsOf(filename) {
  const module = await load(filename);
  if (module.status !== 'evaluated') await module.evaluate();
  return module.namespace;
}
function adminDb(member = true) {
  return {
    auth: { getUser: async () => ({ data: { user: { id: 'admin-id' } }, error: null }) },
    from(table) {
      assert.equal(table, 'admins', 'invalid payload must fail before any mutation');
      return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: member ? { user_id: 'admin-id' } : null, error: null }) }) }) };
    },
  };
}
const request = body => new Request('http://localhost/api/test', { method: 'POST', headers: { Authorization: 'Bearer test', 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

test('leaderboard calculates 5/3/2 (individual) and 10/5/3 (group) points with tied 3rd split', async () => {
  const { calculateAutoPoints, getLeaderboardData } = await exportsOf('lib/store.js');
  // Individual: 1st (Stark: 5), 2nd (Stark: 3), 3rd (Targaryen: 2) -> Stark: 8, Targaryen: 2
  assert.deepEqual(JSON.parse(JSON.stringify(calculateAutoPoints([{ p: [{ q: 'Stark' }, { q: 'Stark' }, { q: 'Targaryen' }] }]))), { Targaryen: 2, Stark: 8, Lannister: 0 });
  // Group: 1st (Stark: 10), 2nd (Lannister: 5), 3rd (Targaryen: 3)
  assert.deepEqual(JSON.parse(JSON.stringify(calculateAutoPoints([{ isGroup: true, p: [{ q: 'Stark' }, { q: 'Lannister' }, { q: 'Targaryen' }] }]))), { Targaryen: 3, Stark: 10, Lannister: 5 });
  // Tied 3rd place for Individual: 2 pts split equally -> 1 pt each
  assert.deepEqual(JSON.parse(JSON.stringify(calculateAutoPoints([{
    p: [
      { q: 'Stark', place: 1 },
      { q: 'Lannister', place: 2 },
      { q: 'Targaryen', place: 3 },
      { q: 'Stark', place: 3 },
    ],
  }]))), { Targaryen: 1, Stark: 6, Lannister: 3 });
  // Tied 3rd place for Group: 3 pts split equally -> 1.5 pts each
  assert.deepEqual(JSON.parse(JSON.stringify(calculateAutoPoints([{
    isGroup: true,
    p: [
      { q: 'Stark', place: 1 },
      { q: 'Lannister', place: 2 },
      { q: 'Targaryen', place: 3 },
      { q: 'Lannister', place: 3 },
    ],
  }]))), { Targaryen: 1.5, Stark: 10, Lannister: 6.5 });

  const empty = getLeaderboardData({ results: [] });
  assert.equal(empty.board.length, 3);
  assert.ok(empty.board.every(row => row[2] === 0));
  const manual = getLeaderboardData({ results: [], isManualLeaderboard: true, manualPoints: { Stark: 25 } });
  assert.equal(manual.board[0][0], 'Stark');
  assert.equal(manual.autoPoints.Stark, 0);
});
test('gallery uses optimized thumbnails and larger lightbox images', async () => {
  const { galleryImage } = await exportsOf('lib/images.js');
  const image = { src: 'https://res.cloudinary.com/demo/image/upload/v1/a.jpg', public_id: 'saaya/gallery/photo' };
  assert.match(galleryImage(image), /f_auto,q_auto,w_700,c_limit/);
  assert.match(galleryImage(image, 1800), /w_1800/);
  assert.equal(galleryImage({ src: '/images/local.jpg' }), '/images/local.jpg');
});
for (const [route, methods] of [['events', ['POST']], ['results', ['POST']], ['gallery', ['POST', 'DELETE']], ['gallery/sign', ['POST']], ['auth', ['GET']]]) {
  for (const method of methods) test(`${method} ${route} rejects unauthenticated requests`, async () => {
    currentDb = undefined;
    const handlers = await exportsOf(`app/api/${route}/route.js`);
    assert.equal((await handlers[method](new Request('http://localhost', { method }))).status, 401);
  });
}
test('authenticated non-admin cannot edit events', async () => {
  currentDb = adminDb(false);
  const { POST } = await exportsOf('app/api/events/route.js');
  assert.equal((await POST(request({ eventName: 'Oppana', status: 'live' }))).status, 403);
});
test('event status rejects unexpected values before writing', async () => {
  currentDb = adminDb();
  const { POST } = await exportsOf('app/api/events/route.js');
  assert.equal((await POST(request({ eventName: 'Oppana', status: 'invalid' }))).status, 400);
});
test('winner validation rejects malformed or missing winners', async () => {
  currentDb = adminDb();
  const { POST } = await exportsOf('app/api/results/route.js');
  for (const winners of [[], [null, null, null], [{ n: 'Student', d: 'UNKNOWN', s: 4 }, {}, {}]]) {
    const response = await POST(request({ eventName: 'Oppana', winners }));
    assert.equal(response.status, 400);
  }
});
test('manual points reject negatives and fractional points', async () => {
  currentDb = adminDb();
  const { POST } = await exportsOf('app/api/results/route.js');
  for (const value of [-1, 1.5, 1000001]) {
    assert.equal((await POST(request({ action: 'set_manual_points', points: { Targaryen: value, Stark: 0, Lannister: 0 } }))).status, 400);
  }
});
test('gallery rejects arbitrary assets before contacting Cloudinary', async () => {
  currentDb = adminDb();
  const { POST } = await exportsOf('app/api/gallery/route.js');
  assert.equal((await POST(request({ public_id: 'other/photo', cap: 'Photo', y: 2026 }))).status, 400);
});

function savedDataDb() {
  const records = {
    admins: [{ user_id: 'admin-id' }],
    events: [
      { name: 'Oppana', category: 'On Stage', status: 'upcoming', sort_order: 0, winners: [] },
      { name: 'Mappila Paatu', category: 'Pre Stage', status: 'upcoming', sort_order: 30, winners: [] },
    ],
    leaderboard_settings: [{ id: 1, is_manual: false, manual_points: { Targaryen: 0, Stark: 0, Lannister: 0 } }],
    gallery: [],
  };
  return {
    auth: { getUser: async () => ({ data: { user: { id: 'admin-id' } }, error: null }) },
    from(table) {
      let values, filter;
      const execute = () => {
        const rows = records[table].filter(row => {
          if (!filter) return true;
          if (filter.type === 'eq') return row[filter.col] === filter.val;
          if (filter.type === 'in') return filter.val.includes(row[filter.col]);
          return true;
        });
        if (values) for (const row of rows) Object.assign(row, values);
        return { data: rows, error: null };
      };
      const query = {
        select: () => query,
        update: next => { values = next; return query; },
        insert: next => { records[table].push(next); return query; },
        eq: (col, val) => { filter = { type: 'eq', col, val }; return query; },
        in: (col, val) => { filter = { type: 'in', col, val }; return query; },
        order: async () => execute(),
        single: async () => ({ data: execute().data[0], error: null }),
        maybeSingle: async () => ({ data: execute().data[0] || null, error: null }),
        then: (resolve, reject) => Promise.resolve(execute()).then(resolve, reject),
      };
      return query;
    },
  };
}
test('published winners update the public leaderboard; manual override and reset remain consistent', async () => {
  currentDb = savedDataDb();
  const { GET, POST } = await exportsOf('app/api/results/route.js');
  let body = await (await GET()).json();
  assert.deepEqual(body.results, []);
  assert.equal(body.points.Stark, 0);
  const winners = [{ n: 'First', d: 'EEE', s: 4, q: 'Lannister' }, { n: 'Second', d: 'CSE', s: 3 }, { n: 'Third', d: 'ME', s: 2 }];
  const saved = await POST(request({ eventName: 'Oppana', winners }));
  assert.equal(saved.status, 200);
  body = await saved.json();
  assert.equal(body.results[0].p[0].q, 'Stark', 'squad derives from department, ignoring an injected squad');
  assert.deepEqual(body.points, { Targaryen: 2, Stark: 5, Lannister: 3 });
  body = await (await POST(request({ action: 'set_manual_points', points: { Targaryen: 50, Stark: 40, Lannister: 30 } }))).json();
  assert.equal(body.isManual, true);
  assert.equal(body.points.Targaryen, 50);
  body = await (await POST(request({ action: 'reset_to_auto' }))).json();
  assert.equal(body.isManual, false);
  assert.deepEqual(body.points, { Targaryen: 2, Stark: 5, Lannister: 3 });
});
test('an admin event status save is visible in the next public read', async () => {
  currentDb = savedDataDb();
  const { GET, POST } = await exportsOf('app/api/events/route.js');
  assert.equal((await POST(request({ eventName: 'Oppana', status: 'live' }))).status, 200);
  assert.equal((await (await GET()).json()).eventStatuses.Oppana, 'live');
  assert.equal((await POST(request({ eventName: 'Oppana', status: 'reset' }))).status, 200);
  assert.equal((await (await GET()).json()).eventStatuses.Oppana, 'upcoming');
});
test('empty gallery data is a valid success response', async () => {
  currentDb = savedDataDb();
  const { GET } = await exportsOf('app/api/gallery/route.js');
  const response = await GET();
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).gallery, []);
});
test('winner upload requires only 1st place; 2nd and 3rd optional for disqualification', async () => {
  currentDb = savedDataDb();
  const { POST } = await exportsOf('app/api/results/route.js');

  // Saving only 1st place succeeds and calculates 5 pts
  const singleRes = await POST(request({ eventName: 'Oppana', winners: [{ n: 'Solo Champion', d: 'CSE', s: 4 }] }));
  assert.equal(singleRes.status, 200);
  const singleBody = await singleRes.json();
  assert.equal(singleBody.results[0].p.length, 1);
  assert.equal(singleBody.results[0].p[0].n, 'Solo Champion');
  assert.equal(singleBody.points.Lannister, 5);
  assert.equal(singleBody.points.Stark, 0);

  // Saving 1st and 3rd place (2nd disqualified) awards 5 pts and 2 pts for individual
  const sparseRes = await POST(request({
    eventName: 'Oppana',
    winners: [
      { n: 'First Place', d: 'EEE', s: 4, place: 1 },
      { n: '', d: 'ME', s: 4, place: 2 },
      { n: 'Third Place', d: 'AD', s: 2, place: 3 },
    ],
  }));
  assert.equal(sparseRes.status, 200);
  const sparseBody = await sparseRes.json();
  assert.equal(sparseBody.results[0].p.length, 2);
  assert.equal(sparseBody.points.Stark, 5);
  assert.equal(sparseBody.points.Targaryen, 2);

  // Reject when 1st place is blank or missing
  const noFirstRes = await POST(request({
    eventName: 'Oppana',
    winners: [
      { n: '', d: 'EEE', s: 4, place: 1 },
      { n: 'Second Place', d: 'CSE', s: 2, place: 2 },
    ],
  }));
  assert.equal(noFirstRes.status, 400);
});
test('group program awards 10/5/3 points and splits tied 3rd place (1.5 pts each)', async () => {
  currentDb = savedDataDb();
  const { POST } = await exportsOf('app/api/results/route.js');

  const groupRes = await POST(request({
    eventName: 'Duffmuttu',
    isGroup: true,
    winners: [
      { n: 'Duff Team A', d: 'EEE', s: 4, place: 1 },       // Stark -> 10 pts
      { n: 'Duff Team B', d: 'CSE', s: 4, place: 2 },       // Lannister -> 5 pts
      { n: 'Duff Team C1', d: 'ME', s: 4, place: 3 },       // Targaryen -> 1.5 pts
      { n: 'Duff Team C2', d: 'AD', s: 2, place: 3 },       // Targaryen -> 1.5 pts
    ],
  }));
  assert.equal(groupRes.status, 200);
  const groupBody = await groupRes.json();
  const duff = groupBody.results.find(r => r.n === 'Duffmuttu');
  assert.ok(duff);
  assert.equal(duff.isGroup, true);
  assert.equal(duff.p.length, 4);
  assert.equal(groupBody.points.Stark, 10);
  assert.equal(groupBody.points.Lannister, 5);
  assert.equal(groupBody.points.Targaryen, 3); // 1.5 + 1.5 = 3
});
test('saving 3 places succeeds for existing events, aliases, and supports S8', async () => {
  currentDb = savedDataDb();
  const { POST } = await exportsOf('app/api/results/route.js');

  // Saving 3 places including an S8 winner succeeds
  const res3 = await POST(request({
    eventName: 'Oppana',
    winners: [
      { n: 'Gold Winner', d: 'CSE', s: 8, place: 1 },
      { n: 'Silver Winner', d: 'ME', s: 6, place: 2 },
      { n: 'Bronze Winner', d: 'EEE', s: 4, place: 3 },
    ],
  }));
  assert.equal(res3.status, 200);
  const body3 = await res3.json();
  const oppana = body3.results.find(r => r.n === 'Oppana');
  assert.equal(oppana.p.length, 3);
  assert.equal(oppana.p[0].s, 8);
  assert.equal(oppana.p[0].n, 'Gold Winner');

  // Saving 3 places for Mappila Pattu Boys renames old Mappila Paatu row
  const mappilaRes = await POST(request({
    eventName: 'Mappila Pattu Boys',
    winners: [
      { n: 'Boy 1', d: 'ME', s: 4, place: 1 },
      { n: 'Boy 2', d: 'CSE', s: 2, place: 2 },
      { n: 'Boy 3', d: 'AD', s: 6, place: 3 },
    ],
  }));
  assert.equal(mappilaRes.status, 200);
  const mappilaBody = await mappilaRes.json();
  const mappilaEvent = mappilaBody.results.find(r => r.n === 'Mappila Pattu Boys');
  assert.ok(mappilaEvent, 'Mappila Pattu Boys should be present in results');
  assert.equal(mappilaEvent.p.length, 3);

  // Saving 3 places for unseeded event inserts it dynamically
  const unseededRes = await POST(request({
    eventName: 'Vattapattu',
    winners: [
      { n: 'Lead 1', d: 'CE', s: 2, place: 1 },
      { n: 'Lead 2', d: 'MCA', s: 4, place: 2 },
      { n: 'Lead 3', d: 'ECE', s: 6, place: 3 },
    ],
  }));
  assert.equal(unseededRes.status, 200);
  const unseededBody = await unseededRes.json();
  const vattaEvent = unseededBody.results.find(r => r.n === 'Vattapattu');
  assert.ok(vattaEvent, 'Vattapattu should be inserted and present in results');
  assert.equal(vattaEvent.p.length, 3);
});


