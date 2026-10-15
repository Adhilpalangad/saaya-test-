import { NextResponse } from 'next/server';
import { requireAdmin, requireSuperAdmin, checked, failure, ApiError } from '../../../../lib/api';
import { recordAuditLog } from '../../../../lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const db = await requireAdmin(req);
    let adminsList = [];

    try {
      const res = await db.from('admins').select('*');
      if (res.data && Array.isArray(res.data)) {
        adminsList = res.data;
      }
    } catch {
      adminsList = [{ user_id: db.adminUser.id, role: db.adminUser.role, email: db.adminUser.email }];
    }

    if (adminsList.length === 0 && db.adminUser) {
      adminsList = [{ user_id: db.adminUser.id, role: db.adminUser.role, email: db.adminUser.email }];
    }

    // Attach role / fallback email if missing
    const formatted = adminsList.map(a => ({
      userId: a.user_id,
      email: a.email || (a.user_id === db.adminUser.id ? db.adminUser.email : `admin-${String(a.user_id).slice(0, 8)}@saaya.fest`),
      role: a.role || (a.user_id === db.adminUser.id ? db.adminUser.role : 'admin'),
      createdAt: a.created_at || null,
      isCurrentUser: a.user_id === db.adminUser.id,
    }));

    return NextResponse.json({
      success: true,
      admins: formatted,
      currentUser: {
        id: db.adminUser.id,
        email: db.adminUser.email,
        role: db.adminUser.role,
        isSuperAdmin: db.adminUser.isSuperAdmin,
      },
    });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(req) {
  try {
    const db = await requireSuperAdmin(req);
    const body = await req.json();
    const action = body.action;

    if (action === 'update_role') {
      const { userId, role } = body;
      if (!userId || !['admin', 'super_admin'].includes(role)) {
        throw new ApiError('Invalid admin ID or role specified.');
      }

      // Safeguard: Do not allow demoting the last super admin
      if (role === 'admin') {
        const check = await db.from('admins').select('user_id,role');
        const superCount = (check.data || []).filter(a => a.role === 'super_admin').length;
        if (superCount <= 1 && userId === db.adminUser.id) {
          throw new ApiError('Cannot demote the only remaining Super Administrator.');
        }
      }

      checked(await db.from('admins').update({ role }).eq('user_id', userId));

      await recordAuditLog(db, {
        action: 'ADMIN_ROLE_CHANGE',
        entityType: 'admin_user',
        entityName: userId,
        summary: `Changed role for admin ${userId} to ${role.toUpperCase()} by Super Admin ${db.adminUser.email}`,
        details: { targetUserId: userId, newRole: role },
        req,
      });

      return NextResponse.json({ success: true, message: `Admin role updated to ${role}.` });
    }

    if (action === 'add_admin') {
      const { userId, email, role = 'admin' } = body;
      if (!userId || typeof userId !== 'string') {
        throw new ApiError('A valid Supabase User UUID is required.');
      }
      if (!['admin', 'super_admin'].includes(role)) {
        throw new ApiError('Role must be admin or super_admin.');
      }

      const res = await db.from('admins').insert({
        user_id: userId.trim(),
        role,
        email: email ? String(email).trim() : null,
      }).select().maybeSingle();

      if (res.error && res.error.code !== '23505') {
        checked(res);
      }

      await recordAuditLog(db, {
        action: 'ADMIN_INVITED',
        entityType: 'admin_user',
        entityName: email || userId,
        summary: `Added new ${role.toUpperCase()}: ${email || userId} by Super Admin ${db.adminUser.email}`,
        details: { targetUserId: userId, email, role },
        req,
      });

      return NextResponse.json({ success: true, message: 'Administrator added successfully.' });
    }

    if (action === 'remove_admin') {
      const { userId } = body;
      if (!userId) throw new ApiError('Admin user ID is required.');

      if (userId === db.adminUser.id) {
        throw new ApiError('You cannot remove your own administrator account.');
      }

      // Check if trying to remove the last super admin
      const check = await db.from('admins').select('user_id,role');
      const target = (check.data || []).find(a => a.user_id === userId);
      const superCount = (check.data || []).filter(a => a.role === 'super_admin').length;
      if (target?.role === 'super_admin' && superCount <= 1) {
        throw new ApiError('Cannot remove the only remaining Super Administrator.');
      }

      checked(await db.from('admins').delete().eq('user_id', userId));

      await recordAuditLog(db, {
        action: 'ADMIN_REMOVED',
        entityType: 'admin_user',
        entityName: userId,
        summary: `Removed administrator ${userId} by Super Admin ${db.adminUser.email}`,
        details: { targetUserId: userId },
        req,
      });

      return NextResponse.json({ success: true, message: 'Administrator removed successfully.' });
    }

    throw new ApiError('Unknown admin management action.');
  } catch (error) {
    return failure(error);
  }
}
