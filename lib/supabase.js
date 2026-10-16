import { createClient } from '@supabase/supabase-js';

let browserClient;
export function getSupabase(token) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('Supabase environment settings are missing.');
  if (typeof window !== 'undefined') {
    if (!browserClient) browserClient = createClient(url, key);
    return browserClient;
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: token ? { Authorization: `Bearer ${token}` } : {}, fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }) },
  });
}

