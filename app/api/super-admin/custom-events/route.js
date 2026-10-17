import { NextResponse } from 'next/server';
import { requireSuperAdmin, checked, failure, ApiError } from '../../../../lib/api';
import { SQ, SQN } from '../../../../lib/data';
import { recordAuditLog } from '../../../../lib/audit';

export const dynamic = 'force-dynamic';

const VALID_DEPTS = ['ME', 'AD', 'ECE', 'EEE', 'CE', 'MCA', 'CSE'];
const DEPT_TO_SQUAD = {
  ME: 'Targaryen', AD: 'Targaryen', ECE: 'Targaryen',
  EEE: 'Stark', CE: 'Stark', MCA: 'Stark',
  CSE: 'Lannister',
};

async function getCustomEventsList(db) {
  const customEventsMap = {};

  // Source 1: Check leaderboard_settings._custom_events fallback
  try {
    const settingsRes = await db.from('leaderboard_settings').select('manual_points').eq('id', 1).maybeSingle();
    const curPoints = settingsRes?.data?.manual_points || {};
    const stored = curPoints._custom_events || {};
    for (const [name, data] of Object.entries(stored)) {
      if (data && typeof data === 'object') {
        customEventsMap[name] = {
          name,
          category: data.category || 'Special Event',
          isGroup: Boolean(data.isGroup ?? data.is_group),
          status: data.status || 'done',
          venue: data.venue || '',
          time: data.time || '',
          day: data.day ?? null,
          winners: Array.isArray(data.winners) ? data.winners : [],
          createdBy: data.created_by || data.createdBy || '',
          createdAt: data.created_at || data.createdAt || null,
          updatedAt: data.updated_at || data.updatedAt || null,
        };
      }
    }
  } catch (err) {
    console.warn('Failed to query leaderboard_settings._custom_events:', err?.message);
  }

  // Source 2: Query public.custom_events table if it exists
  try {
    const res = await db.from('custom_events').select('*').order('created_at', { ascending: false });
    if (res?.data && Array.isArray(res.data)) {
      for (const row of res.data) {
        customEventsMap[row.name] = {
          name: row.name,
          category: row.category || 'Special Event',
          isGroup: Boolean(row.is_group),
          status: row.status || 'done',
          venue: row.venue || '',
          time: row.time || '',
          day: row.day ?? null,
          winners: Array.isArray(row.winners) ? row.winners : [],
          createdBy: row.created_by || '',
          createdAt: row.created_at || null,
          updatedAt: row.updated_at || null,
        };
      }
    }
  } catch {
    // Table may not yet be migrated; fallback map is preserved
  }

  return Object.values(customEventsMap);
}

function formatWinnersForStorage(rawWinners, isGroup) {
  if (!Array.isArray(rawWinners) || rawWinners.length === 0) {
    throw new ApiError('Winners data is required for the custom event.');
  }

  const defaultPts = isGroup ? { 1: 10, 2: 5, 3: 3 } : { 1: 5, 2: 3, 3: 2 };
  const validatedWinners = [];

  for (let idx = 0; idx < rawWinners.length; idx++) {
    const w = rawWinners[idx];
    if (!w || typeof w !== 'object') continue;

    const place = typeof w.place === 'number' && w.place >= 1 && w.place <= 3 ? w.place : Math.min(idx + 1, 3);
    const name = typeof w.n === 'string' ? w.n.trim() : (typeof w.name === 'string' ? w.name.trim() : '');

    // 1st place candidate (non-tied or first) must not be empty
    if (place === 1 && !w.isTied && !name) {
      throw new ApiError('1st Place party / winner is mandatory.');
    }

    // Skip empty optional 2nd or 3rd place entries
    if (!name) continue;

    const dept = String(w.d || w.dept || 'CSE').trim();
    if (!VALID_DEPTS.includes(dept)) {
      throw new ApiError(`Invalid department "${dept}". Must be one of: ${VALID_DEPTS.join(', ')}`);
    }

    const maxSem = dept === 'MCA' ? 4 : 8;
    const sem = Number(w.s ?? w.sem ?? 4);
    if (!Number.isInteger(sem) || sem < 1 || sem > maxSem) {
      throw new ApiError(`Invalid semester S${sem} for department ${dept}. Allowed: S1-S${maxSem}`);
    }

    const squad = DEPT_TO_SQUAD[dept] || 'Targaryen';
    const pts = typeof w.pts === 'number' && !isNaN(w.pts) && w.pts >= 0 ? w.pts : (defaultPts[place] || 0);

    validatedWinners.push({
      n: name,
      d: dept,
      s: sem,
      q: squad,
      place,
      isGroup,
      pts,
      isTied: Boolean(w.isTied),
    });
  }

  // Ensure at least one 1st place winner is present
  if (!validatedWinners.some(w => w.place === 1)) {
    throw new ApiError('1st Place party / winner is mandatory.');
  }

  // Group winners by place with tied structure for backward-compatible db layout
  const p1List = validatedWinners.filter(w => w.place === 1);
  const p2List = validatedWinners.filter(w => w.place === 2);
  const p3List = validatedWinners.filter(w => w.place === 3);

  const p1 = p1List[0];
  const p1Tied = p1List.length > 2 ? p1List.slice(1) : (p1List.length > 1 ? p1List[1] : null);

  const p2 = p2List[0] || null;
  const p2Tied = p2List.length > 2 ? p2List.slice(1) : (p2List.length > 1 ? p2List[1] : null);

  const p3 = p3List[0] || null;
  const p3Tied = p3List.length > 2 ? p3List.slice(1) : (p3List.length > 1 ? p3List[1] : null);

  const dbWinners = [];
  if (p1) dbWinners.push(p1Tied ? { ...p1, tied: p1Tied } : p1);
  if (p2) dbWinners.push(p2Tied ? { ...p2, tied: p2Tied } : p2);
  if (p3) dbWinners.push(p3Tied ? { ...p3, tied: p3Tied } : p3);

  return { dbWinners, validatedWinners };
}

export async function GET(req) {
  try {
    const db = await requireSuperAdmin(req);
    const customEvents = await getCustomEventsList(db);
    return NextResponse.json({
      success: true,
      customEvents,
      departments: VALID_DEPTS,
      squadMap: DEPT_TO_SQUAD,
      squads: SQ,
      squadNames: SQN,
    });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(req) {
  try {
    const db = await requireSuperAdmin(req);
    const body = await req.json();
    const action = body.action || 'save';

    // 1. DELETE ACTION
    if (action === 'delete') {
      const eventName = typeof body.name === 'string' ? body.name.trim() : '';
      if (!eventName) throw new ApiError('Custom event name is required for deletion.');

      // Remove from public.custom_events table if table exists
      try {
        await db.from('custom_events').delete().eq('name', eventName);
      } catch {}

      // Remove from public.events table
      try {
        await db.from('events').delete().eq('name', eventName);
      } catch {}

      // Remove from leaderboard_settings._custom_events & _extra_events
      try {
        const cur = await db.from('leaderboard_settings').select('manual_points').eq('id', 1).single();
        if (cur?.data?.manual_points) {
          const currentPoints = cur.data.manual_points;
          const nextCustom = { ...(currentPoints._custom_events || {}) };
          const nextExtra = { ...(currentPoints._extra_events || {}) };
          delete nextCustom[eventName];
          delete nextExtra[eventName];
          await db.from('leaderboard_settings').update({
            manual_points: {
              ...currentPoints,
              _custom_events: nextCustom,
              _extra_events: nextExtra,
            },
          }).eq('id', 1);
        }
      } catch (err) {
        console.warn('Failed to clean leaderboard fallback for deleted custom event:', err?.message);
      }

      // Record Audit Log
      const adminEmail = db.adminUser?.email || 'Super Admin';
      await recordAuditLog(db, {
        action: 'CUSTOM_EVENT_DELETED',
        entityType: 'custom_event',
        entityName: eventName,
        summary: `Deleted custom event "${eventName}" by Super Admin ${adminEmail}`,
        details: { eventName },
        req,
      });

      const updatedList = await getCustomEventsList(db);
      return NextResponse.json({
        success: true,
        message: `Custom event "${eventName}" removed successfully.`,
        customEvents: updatedList,
      });
    }

    // 2. CREATE / UPDATE ACTION
    if (action === 'save' || action === 'create' || action === 'update') {
      const eventName = typeof body.name === 'string' ? body.name.trim() : '';
      if (!eventName) throw new ApiError('Event name is required.');
      if (eventName.length > 120) throw new ApiError('Event name must be 120 characters or fewer.');

      const category = typeof body.category === 'string' && body.category.trim() ? body.category.trim() : 'Special Event';
      const isGroup = Boolean(body.isGroup);
      const status = ['live', 'done', 'upcoming'].includes(body.status) ? body.status : 'done';
      const venue = typeof body.venue === 'string' ? body.venue.trim() : '';
      const time = typeof body.time === 'string' ? body.time.trim() : '';
      const day = typeof body.day === 'number' && body.day >= 0 && body.day <= 4 ? body.day : null;

      const { dbWinners, validatedWinners } = formatWinnersForStorage(body.winners, isGroup);

      const eventData = {
        name: eventName,
        category,
        sort_order: 999,
        is_group: isGroup,
        status,
        time: time || null,
        venue: venue || null,
        day,
        winners: dbWinners,
        created_by: db.adminUser.email,
        updated_at: new Date().toISOString(),
      };

      // Check if event already exists in custom list
      const existingList = await getCustomEventsList(db);
      const isExisting = existingList.some(e => e.name === eventName);

      // Attempt A: Save to public.custom_events table
      try {
        await db.from('custom_events').upsert({
          ...eventData,
          created_at: new Date().toISOString(),
        }, { onConflict: 'name' });
      } catch (err) {
        console.warn('Upsert to public.custom_events skipped/failed:', err?.message);
      }

      // Attempt B: Upsert to public.events so it appears across Results & Hall of Fame
      let eventsTableSuccess = false;
      try {
        const evRes = await db.from('events').upsert({
          name: eventName,
          category,
          sort_order: 999,
          status,
          winners: dbWinners,
          is_group: isGroup,
        }, { onConflict: 'name' }).select('name').maybeSingle();
        if (!evRes?.error && evRes?.data) {
          eventsTableSuccess = true;
        }
      } catch (err) {
        console.warn('Upsert to public.events table skipped/failed:', err?.message);
      }

      // Attempt C: Always mirror in leaderboard_settings._custom_events and _extra_events
      try {
        const cur = await db.from('leaderboard_settings').select('manual_points').eq('id', 1).single();
        if (cur?.data) {
          const curPoints = cur.data.manual_points || {};
          const currentCustom = { ...(curPoints._custom_events || {}) };
          const currentExtra = { ...(curPoints._extra_events || {}) };

          currentCustom[eventName] = eventData;
          currentExtra[eventName] = {
            name: eventName,
            category,
            sort_order: 999,
            isGroup,
            winners: dbWinners,
          };

          await db.from('leaderboard_settings').update({
            manual_points: {
              ...curPoints,
              _custom_events: currentCustom,
              _extra_events: currentExtra,
            },
          }).eq('id', 1);
        }
      } catch (err) {
        console.warn('Mirroring in leaderboard_settings skipped:', err?.message);
      }

      // Record Audit Log
      const adminEmail = db.adminUser?.email || 'Super Admin';
      const winnerSummaryList = validatedWinners.map(w => `#${w.place} ${w.n} (${w.d} - ${w.q}, ${w.pts} pts)`).join(', ');

      await recordAuditLog(db, {
        action: isExisting ? 'CUSTOM_EVENT_UPDATED' : 'CUSTOM_EVENT_CREATED',
        entityType: 'custom_event',
        entityName: eventName,
        summary: `${isExisting ? 'Updated' : 'Created'} custom event "${eventName}" (${isGroup ? 'Group' : 'Individual'}) by Super Admin ${adminEmail}: ${winnerSummaryList}`,
        details: {
          eventName,
          category,
          isGroup,
          status,
          venue,
          time,
          day,
          winners: validatedWinners.map(w => ({
            place: w.place,
            name: w.n,
            dept: w.d,
            sem: w.s,
            squad: w.q,
            pts: w.pts,
            isTied: w.isTied,
          })),
        },
        req,
      });

      const updatedList = await getCustomEventsList(db);
      return NextResponse.json({
        success: true,
        message: `Custom event "${eventName}" ${isExisting ? 'updated' : 'created'} successfully!`,
        customEvents: updatedList,
      });
    }

    throw new ApiError('Invalid custom event action requested.');
  } catch (error) {
    return failure(error);
  }
}
