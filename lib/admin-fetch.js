import { getSupabase } from './supabase';

export async function adminFetch(url, options = {}) {
  const { data: { session } } = await getSupabase().auth.getSession();
  if (!session) throw new Error('Please sign in again.');
  const response = await fetch(url, { ...options, headers: { ...options.headers, Authorization: `Bearer ${session.access_token}` } });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || 'The operation failed. Please try again.');
  }
  return response;
}
