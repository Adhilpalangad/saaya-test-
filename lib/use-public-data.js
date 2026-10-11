'use client';
import { useEffect, useState } from 'react';

export function usePublicData(url) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true, busy = false;
    const controller = new AbortController();
    async function refresh() {
      if (busy || document.hidden) return;
      busy = true;
      try {
        const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Data is temporarily unavailable.');
        if (active) { setData(body); setError(''); }
      } catch (err) {
        if (active && err.name !== 'AbortError') setError('Updates are temporarily unavailable. Please try again shortly.');
      } finally { busy = false; }
    }
    refresh();
    const timer = setInterval(refresh, 15000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => { active = false; controller.abort(); clearInterval(timer); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, [url]);
  return { data, error };
}
