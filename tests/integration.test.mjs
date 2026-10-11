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

test('leaderboard calculates 5/3/1 points and handles no published results', async () => {
  const { calculateAutoPoints, getLeaderboardData } = await exportsOf('lib/store.js');
  assert.deepEqual(JSON.parse(JSON.stringify(calculateAutoPoints([{ p: [{ q: 'Stark' }, { q: 'Stark' }, { q: 'Targaryen' }] }]))), { Targaryen: 1, Stark: 8, Lannister: 0 });
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
    events: [{ name: 'Oppana', category: 'On Stage', status: 'upcoming', sort_order: 0, winners: [] }],
    leaderboard_settings: [{ id: 1, is_manual: false, manual_points: { Targaryen: 0, Stark: 0, Lannister: 0 } }],
    gallery: [],
  };
  return {
    auth: { getUser: async () => ({ data: { user: { id: 'admin-id' } }, error: null }) },
    from(table) {
      let values, filter;
      const execute = () => {
        const rows = records[table].filter(row => !filter || row[filter[0]] === filter[1]);
        if (values) for (const row of rows) Object.assign(row, values);
        return { data: rows, error: null };
      };
      const query = {
        select: () => query,
        update: next => { values = next; return query; },
        eq: (column, value) => { filter = [column, value]; return query; },
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
  assert.deepEqual(body.points, { Targaryen: 1, Stark: 5, Lannister: 3 });
  body = await (await POST(request({ action: 'set_manual_points', points: { Targaryen: 50, Stark: 40, Lannister: 30 } }))).json();
  assert.equal(body.isManual, true);
  assert.equal(body.points.Targaryen, 50);
  body = await (await POST(request({ action: 'reset_to_auto' }))).json();
  assert.equal(body.isManual, false);
  assert.deepEqual(body.points, { Targaryen: 1, Stark: 5, Lannister: 3 });
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
