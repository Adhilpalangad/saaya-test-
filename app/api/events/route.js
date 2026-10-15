import { NextResponse } from 'next/server';
import { getSupabase } from '../../../lib/supabase';
import { requireAdmin, checked, failure, ApiError } from '../../../lib/api';
import { EV, DAYS } from '../../../lib/data';
import { recordAuditLog } from '../../../lib/audit';

export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const rows = checked(await getSupabase().from('events').select('name,status'));
    const eventStatuses = Object.fromEntries(rows.map(r => [r.name, r.status]));
    for (const list of Object.values(EV)) {
      for (const [name] of list) {
        if (!eventStatuses[name]) {
          if (name.startsWith('Mappila Pattu') && eventStatuses['Mappila Paatu']) {
            eventStatuses[name] = eventStatuses['Mappila Paatu'];
          } else {
            eventStatuses[name] = 'upcoming';
          }
        }
      }
    }
    return NextResponse.json({ success: true, eventStatuses, EV, DAYS });
  } catch (error) { return failure(error); }
}
export async function POST(req) {
  try {
    const db = await requireAdmin(req);
    const { eventName, status } = await req.json();
    const next = status === 'reset' ? 'upcoming' : status;
    if (!['live', 'done', 'upcoming'].includes(next)) throw new ApiError('Invalid event status.');
    let row = checked(await db.from('events').update({ status: next }).eq('name', eventName).select('name').maybeSingle());
    if (!row && (eventName === 'Mappila Pattu Boys' || eventName === 'Mappila Pattu Girls')) {
      const checkOld = await db.from('events').select('name').in('name', ['Mappila Paatu', 'Mappila Pattu']).maybeSingle();
      if (checkOld.data?.name) {
        row = checked(await db.from('events').update({ name: eventName, status: next }).eq('name', checkOld.data.name).select('name').maybeSingle());
      }
    }
    if (!row) {
      let cat = 'Pre Stage', sort_order = 30;
      let order = 0;
      for (const [c, list] of Object.entries(EV)) {
        for (const item of list) {
          if (item[0] === eventName) {
            cat = c;
            sort_order = order;
            break;
          }
          order++;
        }
      }
      row = checked(await db.from('events').insert({ name: eventName, category: cat, sort_order, status: next }).select('name').maybeSingle());
    }
    if (!row) throw new ApiError('Event not found.', 404);

    // Audit log for event status change
    const adminEmail = db.adminUser?.email || 'Admin';
    await recordAuditLog(db, {
      action: 'EVENT_STATUS_CHANGE',
      entityType: 'event',
      entityName: eventName,
      summary: `Changed "${eventName}" status to ${next.toUpperCase()} by ${adminEmail}`,
      details: {
        eventName,
        status: next,
      },
      req,
    });

    const rows = checked(await db.from('events').select('name,status'));
    const eventStatuses = Object.fromEntries(rows.map(r => [r.name, r.status]));
    for (const list of Object.values(EV)) {
      for (const [name] of list) {
        if (!eventStatuses[name]) eventStatuses[name] = 'upcoming';
      }
    }
    return NextResponse.json({ success: true, eventStatuses });
  } catch (error) { return failure(error); }
}

