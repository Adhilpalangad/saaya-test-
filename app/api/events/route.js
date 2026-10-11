import { NextResponse } from 'next/server';
import { getSupabase } from '../../../lib/supabase';
import { requireAdmin, checked, failure, ApiError } from '../../../lib/api';
import { EV, DAYS } from '../../../lib/data';

export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const rows = checked(await getSupabase().from('events').select('name,status'));
    return NextResponse.json({ success: true, eventStatuses: Object.fromEntries(rows.map(r => [r.name, r.status])), EV, DAYS });
  } catch (error) { return failure(error); }
}
export async function POST(req) {
  try {
    const db = await requireAdmin(req);
    const { eventName, status } = await req.json();
    const next = status === 'reset' ? 'upcoming' : status;
    if (!['live', 'done', 'upcoming'].includes(next)) throw new ApiError('Invalid event status.');
    const row = checked(await db.from('events').update({ status: next }).eq('name', eventName).select('name').maybeSingle());
    if (!row) throw new ApiError('Event not found.', 404);
    const rows = checked(await db.from('events').select('name,status'));
    return NextResponse.json({ success: true, eventStatuses: Object.fromEntries(rows.map(r => [r.name, r.status])) });
  } catch (error) { return failure(error); }
}
