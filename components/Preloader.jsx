'use client';
import { useEffect, useRef, useState } from 'react';

/* Loading screen. MIN = shortest time (ms) it stays, MAX = longest wait */
export default function Preloader() {
  const [gone, setGone] = useState(false);
  const pre = useRef(null), g = useRef(null), b = useRef(null), n = useRef(null);
  useEffect(() => {
    const R = matchMedia('(prefers-reduced-motion: reduce)').matches, MIN = R ? 300 : 2200, MAX = 5500, t0 = performance.now();
    let p = 0, ready = false, raf, alive = true;
    const ok = () => { ready = true; };
    Promise.all([document.fonts ? document.fonts.ready : 0, new Promise((r) => (document.readyState === 'complete' ? r() : window.addEventListener('load', r)))]).then(ok);
    const mx = setTimeout(ok, MAX);
    const f = (t) => {
      if (!alive) return;
      const el = t - t0, tg = ready && el >= MIN ? 100 : Math.min(90, (el / MIN) * 90);
      p += (tg - p) * 0.1; if (tg === 100 && p > 99.4) p = 100;
      if (g.current) g.current.style.setProperty('--p', p + '%');
      if (b.current) b.current.style.width = p + '%';
      if (n.current) n.current.textContent = Math.round(p) + '%';
      if (p < 100) { raf = requestAnimationFrame(f); return; }
      setTimeout(() => {
        pre.current && pre.current.classList.add('out');
        setTimeout(() => document.documentElement.classList.remove('loading'), 350);
        setTimeout(() => setGone(true), 1100);
      }, 250);
    };
    raf = requestAnimationFrame(f);
    return () => { alive = false; cancelAnimationFrame(raf); clearTimeout(mx); };
  }, []);
  if (gone) return null;
  return (
    <div id="pre" ref={pre} aria-label="Loading">
      <div className="prl">
        <div className="plg" ref={g} />
        <div className="plp"><i ref={b} /></div>
        <span id="pln" ref={n}>0%</span>
        <small>AWH ENGINEERING COLLEGE</small>
      </div>
    </div>
  );
}
