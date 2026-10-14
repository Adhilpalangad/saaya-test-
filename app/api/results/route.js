import { NextResponse } from 'next/server';
import { getSupabase } from '../../../lib/supabase';
import { requireAdmin, checked, failure, ApiError } from '../../../lib/api';
import { getLeaderboardData } from '../../../lib/store';
import { EV, SQ, SQN } from '../../../lib/data';

export const dynamic = 'force-dynamic';
async function payload(db) {
  const [events, settings] = await Promise.all([
    db.from('events').select('name,category,winners').order('sort_order'),
    db.from('leaderboard_settings').select('*').eq('id', 1).single(),
  ]);
  const results = checked(events)
    .map(r => {
      const rawWinners = Array.isArray(r.winners) ? r.winners : [];
      const isGroup = Boolean(r.is_group || rawWinners.some(w => w && typeof w === 'object' && w.isGroup));
      const p = [];
      for (let idx = 0; idx < rawWinners.length; idx++) {
        const w = rawWinners[idx];
        if (w && typeof w === 'object' && typeof w.n === 'string' && w.n.trim()) {
          const place = typeof w.place === 'number' && w.place >= 1 && w.place <= 3 ? w.place : Math.min(idx + 1, 3);
          p.push({
            n: w.n.trim(),
            d: w.d,
            s: w.s,
            q: w.q,
            place,
            isGroup,
          });
          if (w.tied && typeof w.tied === 'object' && typeof w.tied.n === 'string' && w.tied.n.trim()) {
            p.push({
              n: w.tied.n.trim(),
              d: w.tied.d,
              s: w.tied.s,
              q: w.tied.q,
              place: typeof w.tied.place === 'number' ? w.tied.place : place,
              isGroup,
            });
          }
        }
      }
      return {
        n: r.name,
        t: r.category,
        isGroup,
        p,
      };
    })
    .filter(r => r.p.length > 0);
  const config = checked(settings);
  const board = getLeaderboardData({ results, isManualLeaderboard: config.is_manual, manualPoints: config.manual_points });
  return { success: true, results, ...board, SQ, SQN };
}
export async function GET() {
  try { return NextResponse.json(await payload(getSupabase())); }
  catch (error) { return failure(error); }
}
export async function POST(req) {
  try {
    const db = await requireAdmin(req);
    const body = await req.json();
    if (body.action === 'set_manual_points') {
      const points = {};
      for (const squad of SQN) {
        const value = Number(body.points?.[squad]);
        if (!Number.isSafeInteger(value) || value < 0 || value > 1000000) throw new ApiError('Points must be whole numbers between 0 and 1,000,000.');
        points[squad] = value;
      }
      checked(await db.from('leaderboard_settings').update({ manual_points: points, is_manual: true }).eq('id', 1).select().single());
    } else if (['reset_to_auto', 'recalculate', 'toggle_mode'].includes(body.action)) {
      checked(await db.from('leaderboard_settings').update({ is_manual: body.action === 'toggle_mode' ? body.isManual === true : false }).eq('id', 1).select().single());
    } else {
      if (body.action) throw new ApiError('Unknown action.');
      if (!Array.isArray(body.winners) || body.winners.length === 0 || body.winners.length > 6) {
        throw new ApiError('Provide winners for the event (1st place is mandatory).');
      }
      const isGroup = Boolean(body.isGroup);
      const firstCandidate = body.winners.find(w => w?.place === 1) || body.winners[0];
      if (!firstCandidate || typeof firstCandidate !== 'object' || typeof firstCandidate.n !== 'string' || !firstCandidate.n.trim()) {
        throw new ApiError('1st place winner is mandatory.');
      }
      const winners = [];
      for (let idx = 0; idx < body.winners.length; idx++) {
        const w = body.winners[idx];
        const place = typeof w?.place === 'number' && w.place >= 1 && w.place <= 3 ? w.place : Math.min(idx + 1, 3);
        if (!w || typeof w !== 'object') {
          if (place === 1) throw new ApiError('1st place winner is mandatory.');
          continue;
        }
        const name = typeof w.n === 'string' ? w.n.trim() : '';
        if (place === 1 && !name) {
          throw new ApiError('1st place winner is mandatory.');
        }
        if (!name) {
          continue;
        }
        if (name.length > 120) {
          throw new ApiError('Check winner names, departments, and semesters.');
        }
        const q = SQN.find(sq => SQ[sq].d.includes(w.d));
        const s = Number(w.s);
        if (!q || !Number.isInteger(s) || s < 1 || s > (w.d === 'MCA' ? 4 : 8)) {
          throw new ApiError('Check winner names, departments, and semesters.');
        }
        winners.push({ n: name, d: w.d, s, q, place, isGroup });
      }
      if (winners.length === 0 || !winners.some(w => w.place === 1)) {
        throw new ApiError('1st place winner is mandatory.');
      }

      const formatWinnersForDb = (arr) => {
        if (!Array.isArray(arr) || arr.length === 0) return [];
        const p1 = arr.find(w => w && w.place === 1) || arr[0];
        const p2 = arr.find(w => w && w.place === 2) || null;
        const p3List = arr.filter(w => w && w.place === 3);
        const p3 = p3List[0] || (arr.length >= 3 && arr[2]?.place !== 1 && arr[2]?.place !== 2 ? arr[2] : null);
        const tied = p3List.length > 1 ? p3List[1] : null;

        const result = [];
        if (p1 && p1.n?.trim()) result.push(p1);
        if (p2 && p2.n?.trim()) result.push(p2);
        if (p3 && p3.n?.trim()) {
          result.push(tied && tied.n?.trim() ? { ...p3, tied } : p3);
        }
        return result;
      };

      const targetName = typeof body.eventName === 'string' ? body.eventName.trim() : '';
      if (!targetName) throw new ApiError('Event name is required.');

      const dbWinners = formatWinnersForDb(winners);

      let updateRes = await db.from('events').update({ winners: dbWinners }).eq('name', targetName).select('name').maybeSingle();
      if (updateRes.error) {
        updateRes = await db.from('events').update({ winners: dbWinners.slice(0, 3) }).eq('name', targetName).select('name').maybeSingle();
      }
      let row = updateRes.data;

      if (!row && (targetName === 'Mappila Pattu Boys' || targetName === 'Mappila Pattu Girls')) {
        const oldCheck = await db.from('events').select('name').in('name', ['Mappila Paatu', 'Mappila Pattu']).maybeSingle();
        if (oldCheck.data?.name) {
          const renRes = await db.from('events').update({ name: targetName, winners: dbWinners }).eq('name', oldCheck.data.name).select('name').maybeSingle();
          row = renRes.data;
        }
      }

      if (!row) {
        let cat = 'Pre Stage', sort_order = 30;
        let order = 0;
        for (const [c, list] of Object.entries(EV)) {
          for (const item of list) {
            if (item[0] === targetName) {
              cat = c;
              sort_order = order;
              break;
            }
            order++;
          }
        }
        let insRes = await db.from('events').insert({ name: targetName, category: cat, sort_order, winners: dbWinners }).select('name').maybeSingle();
        if (insRes.error) {
          insRes = await db.from('events').insert({ name: targetName, category: cat, sort_order, winners: dbWinners.slice(0, 3) }).select('name').maybeSingle();
        }
        row = checked(insRes);
      }
      if (!row) {
        if (updateRes.error) checked(updateRes);
        throw new ApiError('Event not found: ' + targetName, 404);
      }
    }
    return NextResponse.json(await payload(db));
  } catch (error) { return failure(error); }
}
