'use client';
import { useEffect, useState } from 'react';
import { MAIN } from '../lib/data';

/* Main Events spotlight: hover/tap an event, it also rotates by itself every 4.5s */
export default function MainEvents() {
  const [cur, setCur] = useState(0);
  const [hold, setHold] = useState(false);
  useEffect(() => {
    if (hold) return;
    const t = setTimeout(() => setCur((c) => (c + 1) % MAIN.length), 4500);
    return () => clearTimeout(t);
  }, [cur, hold]);
  const m = MAIN[cur];
  return (
    <section id="main">
      <h2>Main Events</h2>
      <div className="mx" id="mx" onMouseLeave={() => setHold(false)}>
        <div className="ml">
          {MAIN.map((e, i) => (
            <button key={e[0]} className={'mi' + (i === cur ? ' on' : '')} onMouseEnter={() => { setHold(true); setCur(i); }} onClick={() => setCur(i)}>
              <span className="n">0{i + 1}</span><span className="t">{e[0]}</span><span className="ar">&rarr;</span>
            </button>
          ))}
        </div>
        <div className="spot" style={{ '--g': m[2] }}>
          <i className="pg" key={'p' + cur} />
          <div className="sp swap" key={cur}>
            <span className="big">0{cur + 1}</span><small>{m[3] || 'Main Event'}</small><h3>{m[0]}</h3>
            <p>{m[1] || 'Details coming soon.'}</p><a className="btn" href="#">Register</a>
          </div>
        </div>
      </div>
    </section>
  );
}
