import { NextResponse } from 'next/server';
import { getSupabase } from '../../../lib/supabase';
import { requireAdmin, checked, failure, ApiError } from '../../../lib/api';
import { getLeaderboardData } from '../../../lib/store';
import { SQ, SQN } from '../../../lib/data';

export const dynamic = 'force-dynamic';
async function payload(db) {
  const [events, settings] = await Promise.all([
    db.from('events').select('name,category,winners').order('sort_order'),
    db.from('leaderboard_settings').select('*').eq('id', 1).single(),
  ]);
  const results = checked(events).filter(r => r.winners.length).map(r => ({ n: r.name, t: r.category, p: r.winners }));
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
      if (!Array.isArray(body.winners) || body.winners.length !== 3) throw new ApiError('Enter three winners.');
      const winners = body.winners.map(w => {
        if (!w || typeof w !== 'object') throw new ApiError('Check winner names, departments, and semesters.');
        const q = SQN.find(q => SQ[q].d.includes(w.d));
        const s = Number(w.s);
        if (typeof w.n !== 'string' || !w.n.trim() || w.n.trim().length > 120 || !q || !Number.isInteger(s) || s < 1 || s > (w.d === 'MCA' ? 4 : 7)) throw new ApiError('Check winner names, departments, and semesters.');
        return { n: w.n.trim(), d: w.d, s, q };
      });
      const row = checked(await db.from('events').update({ winners }).eq('name', body.eventName).select('name').maybeSingle());
      if (!row) throw new ApiError('Event not found.', 404);
    }
    return NextResponse.json(await payload(db));
  } catch (error) { return failure(error); }
}
