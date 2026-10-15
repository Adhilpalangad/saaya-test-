import { NextResponse } from 'next/server';
import { requireAdmin, requireSuperAdmin, failure } from '../../../lib/api';
import { getAuditLogs, purgeAuditLogs, computeAuditStats, recordAuditLog } from '../../../lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const db = await requireAdmin(req);
    const parsedUrl = new URL(req.url || '/api/logs', 'http://localhost');
    const category = parsedUrl.searchParams.get('category') || 'all';
    const adminEmail = parsedUrl.searchParams.get('admin') || null;
    const search = parsedUrl.searchParams.get('search') || null;
    const limit = Math.min(Math.max(1, parseInt(parsedUrl.searchParams.get('limit') || '100', 10)), 500);
    const offset = Math.max(0, parseInt(parsedUrl.searchParams.get('offset') || '0', 10));


    const { logs, total } = await getAuditLogs(db, {
      category,
      adminEmail,
      search,
      limit,
      offset,
    });

    const stats = computeAuditStats(logs);

    return NextResponse.json({
      success: true,
      logs,
      total,
      stats,
      currentUser: {
        email: db.adminUser.email,
        role: db.adminUser.role,
        isSuperAdmin: db.adminUser.isSuperAdmin,
      },
    });
  } catch (error) {
    return failure(error);
  }
}

export async function DELETE(req) {
  try {
    const db = await requireSuperAdmin(req);
    await purgeAuditLogs(db);

    await recordAuditLog(db, {
      action: 'LOGS_PURGED',
      entityType: 'system',
      entityName: 'Audit Trail',
      summary: `Audit history cleared by Super Admin ${db.adminUser.email}`,
      details: { purgedBy: db.adminUser.email },
      req,
    });

    return NextResponse.json({
      success: true,
      message: 'Audit history purged successfully.',
    });
  } catch (error) {
    return failure(error);
  }
}
