import { NextResponse } from 'next/server';
import { getSupabase } from '../../../../lib/supabase';
import { requireAdmin, requireSuperAdmin, failure } from '../../../../lib/api';
import { recordAuditLog } from '../../../../lib/audit';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getSupabase();
    let isLockedDown = false;
    let reason = null;

    try {
      const res = await db.from('system_settings').select('*').eq('id', 1).maybeSingle();
      if (res?.data) {
        isLockedDown = Boolean(res.data.is_locked_down);
        reason = res.data.lockdown_reason || null;
      }
    } catch {}

    return NextResponse.json({
      success: true,
      isLockedDown,
      reason,
    });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(req) {
  try {
    const db = await requireSuperAdmin(req);
    const body = await req.json();
    const isLockedDown = Boolean(body.isLockedDown);
    const reason = typeof body.reason === 'string' ? body.reason.trim() : null;

    try {
      await db.from('system_settings').upsert({
        id: 1,
        is_locked_down: isLockedDown,
        lockdown_reason: reason,
        updated_at: new Date().toISOString(),
      });
    } catch {}

    await recordAuditLog(db, {
      action: 'LOCKDOWN_TOGGLED',
      entityType: 'system',
      entityName: 'Emergency Lockdown',
      summary: `${isLockedDown ? 'ACTIVATED Emergency Lockdown' : 'DEACTIVATED Emergency Lockdown'} by Super Admin ${db.adminUser.email}`,
      details: { isLockedDown, reason },
      req,
    });

    return NextResponse.json({
      success: true,
      isLockedDown,
      reason,
      message: isLockedDown ? 'Emergency Lockdown activated.' : 'System restored to normal mode.',
    });
  } catch (error) {
    return failure(error);
  }
}
