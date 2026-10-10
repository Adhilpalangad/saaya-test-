'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/* Scroll effects: fade-up reveals, points count-up, top progress bar, frosted nav, hero art parallax */
export default function Motion() {
  const path = usePathname();
  useEffect(() => {
    const T = document.querySelectorAll('section>h2,.ev,.row,#about h3,#about p,#about .btn,.mx,.fg>div,.map,.copy');
    T.forEach((el) => {
      if (el.classList.contains('rv')) return;
      el.classList.add('rv');
      const i = [...el.parentNode.children].filter((c) => c.classList.contains('rv') || c === el).indexOf(el);
      el.style.setProperty('--d', Math.min(i * 0.09, 0.6) + 's');
    });
    const count = (el) => {
      const s = el.querySelector('strong'); if (!s) return;
      const n = parseInt(s.textContent), t0 = performance.now();
      (function f(t) { const p = Math.min(1, (t - t0) / 1400); s.textContent = Math.round(n * (1 - Math.pow(1 - p, 3))) + ' PTS'; if (p < 1) requestAnimationFrame(f); })(t0);
    };
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target; io.unobserve(el);
      if (el.classList.contains('abr')) { el.classList.add('in'); return; }
      el.classList.add('in');
      if (el.classList.contains('row')) count(el);
      setTimeout(() => { el.style.setProperty('--d', '0s'); el.classList.add('done'); }, 1700);
    }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    document.querySelectorAll('.rv:not(.in),.abr:not(.in)').forEach((el) => io.observe(el));

    const bar = document.getElementById('bar'), nav = document.querySelector('nav'), art = document.querySelector('.art');
    let tk = false;
    const onScroll = () => {
      if (tk) return; tk = true;
      requestAnimationFrame(() => {
        const y = window.scrollY, m = document.documentElement.scrollHeight - innerHeight;
        bar.style.width = (m > 0 ? (y / m) * 100 : 0) + '%';
        nav.classList.toggle('sc', y > 40);
        if (art && y < innerHeight) art.style.translate = '0 ' + y * 0.18 + 'px';
        tk = false;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { io.disconnect(); window.removeEventListener('scroll', onScroll); };
  }, [path]);
  return null;
}
