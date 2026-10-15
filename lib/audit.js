import { SQN } from './data';

/**
 * Record an audit log entry.
 * Safely inserts into public.audit_logs or falls back to leaderboard_settings._audit_logs.
 * Ensures an error in audit logging NEVER blocks the primary operation.
 */
export async function recordAuditLog(db, {
  action,
  entityType = null,
  entityName = null,
  summary = '',
  details = {},
  req = null,
}) {
  try {
    if (!db || !db.from) return null;

    const adminUser = db.adminUser || {};
    const adminId = adminUser.id || null;
    const adminEmail = adminUser.email || 'admin@saaya.fest';
    const adminRole = adminUser.role || 'admin';

    let ip = null;
    let userAgent = null;
    if (req && req.headers) {
      ip = req.headers.get?.('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get?.('x-real-ip') || null;
      userAgent = req.headers.get?.('user-agent') || null;
    }

    const logEntry = {
      admin_id: adminId,
      admin_email: adminEmail,
      admin_role: adminRole,
      action_type: action,
      entity_type: entityType,
      entity_name: entityName ? String(entityName).slice(0, 200) : null,
      summary: summary || `${adminEmail} performed ${action}`,
      details: {
        ...details,
        ...(ip ? { ip } : {}),
        ...(userAgent ? { userAgent: userAgent.slice(0, 250) } : {}),
      },
      created_at: new Date().toISOString(),
    };

    // Attempt 1: Direct insert into public.audit_logs
    try {
      const res = await db.from('audit_logs').insert(logEntry).select().maybeSingle();
      if (!res?.error && res?.data) {
        return res.data;
      }
    } catch {
      // Table may not exist or mock db doesn't define it; proceed to fallback
    }

    // Attempt 2: Fallback in leaderboard_settings.manual_points._audit_logs
    try {
      const cur = await db.from('leaderboard_settings').select('manual_points').eq('id', 1).maybeSingle();
      if (cur?.data) {
        const curPoints = cur.data.manual_points || {};
        const existingLogs = Array.isArray(curPoints._audit_logs) ? curPoints._audit_logs : [];
        const fallbackItem = {
          ...logEntry,
          id: 'fallback-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
        };
        const nextLogs = [fallbackItem, ...existingLogs.slice(0, 99)];
        await db.from('leaderboard_settings').update({
          manual_points: {
            ...curPoints,
            _audit_logs: nextLogs,
          },
        }).eq('id', 1);
        return fallbackItem;
      }
    } catch {
      // Ignore if fallback is also unavailable
    }

    return logEntry;
  } catch (err) {
    console.warn('Audit log write skipped:', err?.message);
    return null;
  }
}

/**
 * Retrieve audit logs with filtering and pagination.
 */
export async function getAuditLogs(db, {
  category = 'all',
  adminEmail = null,
  search = null,
  limit = 100,
  offset = 0,
} = {}) {
  let logs = [];

  // Attempt 1: Query public.audit_logs
  try {
    let query = db.from('audit_logs').select('*').order('created_at', { ascending: false });
    if (adminEmail) {
      query = query.eq('admin_email', adminEmail);
    }
    const res = await query;
    if (res?.data && Array.isArray(res.data)) {
      logs = [...res.data];
    }
  } catch {
    // If table doesn't exist, logs array remains empty
  }

  // Attempt 2: Retrieve from fallback in leaderboard_settings
  try {
    const cur = await db.from('leaderboard_settings').select('manual_points').eq('id', 1).maybeSingle();
    const fallbackLogs = cur?.data?.manual_points?._audit_logs;
    if (Array.isArray(fallbackLogs) && fallbackLogs.length > 0) {
      const seen = new Set(logs.map(l => (l.id || '') + (l.created_at || '') + (l.summary || '')));
      for (const fl of fallbackLogs) {
        const key = (fl.id || '') + (fl.created_at || '') + (fl.summary || '');
        if (!seen.has(key)) {
          seen.add(key);
          logs.push(fl);
        }
      }
    }
  } catch {
    // Ignore fallback errors
  }

  // Apply category filtering
  if (category && category !== 'all') {
    const actionMap = {
      points: ['POINTS_MANUAL_OVERRIDE', 'POINTS_RESET_AUTO'],
      events: ['EVENT_STATUS_CHANGE'],
      results: ['EVENT_WINNERS_SAVED'],
      gallery: ['GALLERY_UPLOAD', 'GALLERY_DELETE'],
      admins: ['ADMIN_ROLE_CHANGE', 'ADMIN_INVITED', 'ADMIN_REMOVED'],
      system: ['LOCKDOWN_TOGGLED', 'LOGS_PURGED'],
    };
    const allowed = actionMap[category];
    if (allowed) {
      logs = logs.filter(l => allowed.includes(l.action_type));
    }
  }

  // Apply admin email filter if not applied at SQL level
  if (adminEmail) {
    logs = logs.filter(l => l.admin_email?.toLowerCase() === adminEmail.toLowerCase());
  }

  // Apply text search
  if (search) {
    const q = search.toLowerCase();
    logs = logs.filter(l =>
      (l.summary && l.summary.toLowerCase().includes(q)) ||
      (l.admin_email && l.admin_email.toLowerCase().includes(q)) ||
      (l.entity_name && l.entity_name.toLowerCase().includes(q)) ||
      (l.action_type && l.action_type.toLowerCase().includes(q))
    );
  }

  // Sort descending by created_at
  logs.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

  const total = logs.length;
  const paged = logs.slice(offset, offset + limit);

  return {
    logs: paged,
    total,
  };
}

/**
 * Retrieve specialized logs for the Point Table.
 */
export async function getPointTableLogs(db, limit = 25) {
  const result = await getAuditLogs(db, { category: 'points', limit });
  return result.logs.map(l => ({
    id: l.id,
    admin_email: l.admin_email,
    admin_role: l.admin_role,
    action_type: l.action_type,
    summary: l.summary,
    details: l.details || {},
    created_at: l.created_at,
  }));
}

/**
 * Clear audit logs (Super Admin action).
 */
export async function purgeAuditLogs(db) {
  try {
    await db.from('audit_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  } catch {}

  try {
    const cur = await db.from('leaderboard_settings').select('manual_points').eq('id', 1).maybeSingle();
    if (cur?.data) {
      const curPoints = cur.data.manual_points || {};
      const { _audit_logs, ...rest } = curPoints;
      await db.from('leaderboard_settings').update({ manual_points: rest }).eq('id', 1);
    }
  } catch {}
}

/**
 * Compute aggregate statistics from logs.
 */
export function computeAuditStats(logs = []) {
  const adminCounts = {};
  const actionCounts = {
    points: 0,
    events: 0,
    results: 0,
    gallery: 0,
    admins: 0,
    other: 0,
  };

  for (const log of logs) {
    const email = log.admin_email || 'Unknown';
    adminCounts[email] = (adminCounts[email] || 0) + 1;

    if (log.action_type?.startsWith('POINTS_')) actionCounts.points++;
    else if (log.action_type?.startsWith('EVENT_STATUS')) actionCounts.events++;
    else if (log.action_type?.startsWith('EVENT_WINNERS')) actionCounts.results++;
    else if (log.action_type?.startsWith('GALLERY_')) actionCounts.gallery++;
    else if (log.action_type?.startsWith('ADMIN_')) actionCounts.admins++;
    else actionCounts.other++;
  }

  const topAdmins = Object.entries(adminCounts)
    .map(([email, count]) => ({ email, count }))
    .sort((a, b) => b.count - a.count);

  return {
    total: logs.length,
    actionCounts,
    topAdmins,
  };
}
