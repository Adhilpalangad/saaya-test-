'use client';
import { useEffect, useState } from 'react';
import { FEST } from '../lib/data';

const pad = (n) => String(Math.floor(n)).padStart(2, '0');

export default function Hero() {
  const [left, setLeft] = useState([0, 0, 0, 0]);
  const [petals, setPetals] = useState([]);
  useEffect(() => {
    const tick = () => {
      const t = Math.max(0, new Date(FEST.date) - Date.now()) / 1000;
      setLeft([t / 86400, (t / 3600) % 24, (t / 60) % 60, t % 60]);
    };
    tick();
    const id = setInterval(tick, 1000);
    setPetals(Array.from({ length: 14 }, () => ({ l: 30 + Math.random() * 70, d: 9 + Math.random() * 9, w: -Math.random() * 14, s: 0.5 + Math.random() * 0.7 })));
    return () => clearInterval(id);
  }, []);
  const labels = ['DAYS', 'HOURS', 'MINS', 'SECS'];
  return (
    <section id="home">
      <div className="art" />
      <div id="petals">
        {petals.map((p, i) => <i key={i} className="petal" style={{ left: p.l + '%', animationDuration: p.d + 's', animationDelay: p.w + 's', transform: `scale(${p.s})` }} />)}
      </div>
      <h1 id="fest" role="img" aria-label={`${FEST.name} ${String(FEST.year).slice(2)}`} />
      <div className="count">{left.map((v, i) => <div key={i}>{pad(v)}<small>{labels[i]}</small></div>)}</div>
      <p className="dates">23 | 24 OCT 2026</p>
      <p className="college">AWH Engineering College</p>
    </section>
  );
}
