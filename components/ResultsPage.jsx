'use client';
import { useEffect, useState } from 'react';
import { SQ, SQN, MED, EV } from '../lib/data';

import { usePublicData } from '../lib/use-public-data';

export default function ResultsPage() {
  const { data, error } = usePublicData('/api/results');
  const pts = data?.points || Object.fromEntries(SQN.map(n => [n, 0]));
  const rows = data?.results || [];
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [sq, setSq] = useState('');
  const [sem, setSem] = useState('');
  const [on, setOn] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setOn(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (!rows.length && !data?.isManual) {
    return (
      <div id="respage">
        <div className="rw">
          <h1>Hall of Fame</h1>
          <p className="rs">CELEBRATING EXCELLENCE</p>
          {error && <p role="status">{error}</p>}
          <p className="rempty" role="status">{!data && !error ? 'Loading results...' : 'No data available.'}</p>
        </div>
      </div>
    );
  }

  const max = Math.max(...Object.values(pts), 1);
  const s = q.trim().toLowerCase();
  const ok = (p) => (!sq || p.q === sq) && (!sem || String(p.s) === sem);
  const list = rows.filter((r) =>
    (!type || r.t === type) &&
    (!s || r.n.toLowerCase().includes(s) || r.p.some((p) => (p.n + ' ' + p.d + ' ' + p.q).toLowerCase().includes(s))) &&
    ((!sq && !sem) || r.p.some(ok)));
  let last = '', k = 0;

  return (
    <div id="respage">
      <div className="rw">
        <h1>Hall of Fame</h1>
        <p className="rs">CELEBRATING EXCELLENCE</p>
        {error && <p role="status">{error}</p>}
        <div className="sqs" id="sqs">
          {SQN.map((n) => {
            const s = SQ[n];
            return (
              <button
                key={n}
                className={'sqc' + (sq === n ? ' on' : '') + (s.banner ? ' has-bn' : '')}
                style={{ '--sq': s.c }}
                onClick={() => setSq(sq === n ? '' : n)}
              >
                {s.banner && (
                  <span
                    className="sqc-bn"
                    style={{ backgroundImage: `url("${encodeURI(s.banner)}")` }}
                    aria-hidden="true"
                  />
                )}
                <small>SQUAD</small>
                <h3>{n}</h3>
                <p>{s.d.join(' \u00b7 ')}</p>
                <b>{pts[n] || 0}<em>PTS</em></b>
                <i style={{ width: on ? (((pts[n] || 0) / max) * 100) + '%' : 0 }} />
              </button>
            );
          })}
        </div>
        <div className="rf">
          <label className="rsb">
            <svg viewBox="0 0 24 24" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
            <input id="rq" type="search" placeholder="Find your event or winner..." aria-label="Search results" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <select aria-label="Event type" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">Event Type</option>{Object.keys(EV).map((t) => <option key={t}>{t}</option>)}
          </select>
          <select aria-label="Squad" value={sq} onChange={(e) => setSq(e.target.value)}>
            <option value="">Squad</option>{SQN.map((n) => <option key={n} value={n}>{n} ({SQ[n].d.join(', ')})</option>)}
          </select>
          <select aria-label="Semester" value={sem} onChange={(e) => setSem(e.target.value)}>
            <option value="">Semester</option>{[1, 2, 3, 4, 5, 6, 7].map((i) => <option key={i} value={i}>S{i}</option>)}
          </select>
        </div>
        <div className="rcount" id="rcount">{list.length} of {rows.length} events</div>
        <div id="rtab">
          {list.length ? (
            <>
              <div className="rh"><span>Event</span><span>1st</span><span>2nd</span><span>3rd</span></div>
              {list.map((r) => {
                const head = r.t !== last ? <div className="rg" key={'g' + r.t}>{(last = r.t)}</div> : null;
                return [head,
                  <div className="rr" key={r.n} style={{ animationDelay: Math.min(k++, 12) * 0.04 + 's' }}>
                    <div className="re"><h3>{r.n}</h3><span className="chip">{r.t}</span></div>
                    {[0, 1, 2].map((i) => {
                      const p = r.p.find((w, idx) => (typeof w.place === 'number' && w.place >= 1 && w.place <= 3 ? w.place === i + 1 : idx === i));
                      if (p) {
                        return (
                          <div key={i} className={`pl r${i}${ok(p) ? '' : ' dim'}`}>
                            <b className="bd">{MED[i]}</b>
                            <div><strong>{p.n}</strong><small>S{p.s} &middot; {p.d}</small></div>
                            <i className="dot" style={{ background: SQ[p.q]?.c }} title={p.q} />
                          </div>
                        );
                      }
                      return (
                        <div key={i} className={`pl pl-empty r${i}`}>
                          <b className="bd">{MED[i]}</b>
                          <div><span className="pl-na">&mdash;</span><small className="pl-na-sub">Not awarded</small></div>
                        </div>
                      );
                    })}
                  </div>];
              })}
            </>
          ) : <p className="rempty">{rows.length ? 'No results match your search.' : 'No data available.'}</p>}
        </div>
      </div>
    </div>
  );
}
