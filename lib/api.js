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
  if (error || !data.user) throw new ApiError('Your session expired. Please sign in again.', 401);
  const membership = await db.from('admins').select('user_id').eq('user_id', data.user.id).maybeSingle();
  if (membership.error) throw new ApiError('Database setup is incomplete or unavailable.', 503);
  if (!membership.data) throw new ApiError('This account does not have administrator access.', 403);
  return db;
}
export function checked(result) {
  if (result.error) {
    console.error('Supabase operation failed:', result.error.code);
    throw new ApiError('Unable to access saved data. Check the Supabase setup and try again.', 503);
  }
  return result.data;
}
export function failure(error) {
  console.error('API operation failed:', error instanceof ApiError ? error.message : error.name);
  return NextResponse.json({ success: false, error: error instanceof ApiError ? error.message : 'The operation failed. Please try again.' }, { status: error.status || 500 });
}
