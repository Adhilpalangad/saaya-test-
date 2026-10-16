import { NextResponse } from 'next/server';
import { getSupabase } from './supabase';

export class ApiError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

export async function requireAdmin(req) {
  const token = req.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) throw new ApiError('Please sign in as an administrator.', 401);
  const db = getSupabase(token);
  const { data, error } = await db.auth.getUser(token);
  if (error || !data?.user) {
    console.error('requireAdmin: getUser failed:', error?.message || error);
    throw new ApiError(error?.message || 'Your session expired. Please sign in again.', 401);
  }
  const membership = await db.from('admins').select('*').eq('user_id', data.user.id).maybeSingle();
  if (membership.error) {
    console.error('requireAdmin: admins table query error:', membership.error.code, membership.error.message);
    throw new ApiError(membership.error.message || 'Database setup is incomplete or unavailable.', 503);
  }
  if (!membership.data) throw new ApiError('This account does not have administrator access.', 403);

  // Check role: explicit 'super_admin' or configured via SUPER_ADMIN_EMAILS
  const email = data.user.email || membership.data.email || 'admin@saaya.fest';
  const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
  const isSuper = membership.data.role === 'super_admin' || superAdminEmails.includes(email.toLowerCase());
  const role = isSuper ? 'super_admin' : (membership.data.role || 'admin');

  db.adminUser = {
    id: data.user.id,
    email,
    role,
    isSuperAdmin: role === 'super_admin',
  };

  return db;
}


export async function requireSuperAdmin(req) {
  const db = await requireAdmin(req);
  if (!db.adminUser?.isSuperAdmin) {
    throw new ApiError('Super Administrator privileges are required for this action.', 403);
  }
  return db;
}

export function checked(result) {
  if (result.error) {
    console.error('Supabase operation failed:', result.error.code, result.error.message);
    throw new ApiError(result.error.message || 'Unable to access saved data. Check the Supabase setup and try again.', 503);
  }
  return result.data;
}

export function failure(error) {
  const message = error instanceof ApiError ? error.message : (error?.message || 'The operation failed. Please try again.');
  console.error('API operation failed:', message);
  return NextResponse.json({ success: false, error: message }, { status: error.status || 500 });
}

