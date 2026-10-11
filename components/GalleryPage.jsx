'use client';
import { useEffect, useState } from 'react';
import { GAL } from '../lib/data';

const COL = [
  ['#7a1c1c', '#240c0a'],
  ['#2a1a18', '#6e1616'],
  ['#5e1414', '#1c1412'],
  ['#3a1210', '#8b2a1e'],
  ['#1c1412', '#5c1512'],
  ['#4a1a14', '#17120e'],
];
const SH = ['big', '', 'tall', 'wide', '', '', 'tall', '', 'wide', '', 'big', '', '', 'tall', 'wide', '', '', ''];
const col = (i) => ({ '--a': COL[i % COL.length][0], '--b': COL[i % COL.length][1] });

export default function GalleryPage() {
  const [items, setItems] = useState(GAL);
  const [flt, setFlt] = useState('All');
  const [open, setOpen] = useState(null); // index inside `vis`

  useEffect(() => {
    fetch('/api/gallery')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.gallery && data.gallery.length) {
          setItems(data.gallery);
        }
      })
      .catch(() => {});
  }, []);

  const years = ['All', ...new Set(items.map((g) => g.y))];
  const vis = items.map((g, i) => i).filter((i) => flt === 'All' || String(items[i].y) === flt);
  const show = (k) => setOpen((k + vis.length) % vis.length);

  useEffect(() => {
    if (open === null) return;
    document.body.style.overflow = 'hidden';
    const key = (e) => {
      if (e.key === 'Escape') setOpen(null);
      if (e.key === 'ArrowLeft') show(open - 1);
      if (e.key === 'ArrowRight') show(open + 1);
    };
    window.addEventListener('keydown', key);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', key);
    };
  });

  const cur = open === null ? null : vis[open];

  return (
    <>
      <div id="galpage">
        <div className="gw">
          <h1>The Saaya Archive</h1>
          <p>A visual journey through the years. Witness the creativity, energy, and spirit of AWH Engineering College.</p>
          <h2>Previous Editions</h2>
          <div className="gch" id="gch">
            {years.map((y) => (
              <button
                key={y}
                className={'gc' + (String(y) === flt ? ' on' : '')}
                onClick={() => setFlt(String(y))}
              >
                {y}
              </button>
            ))}
          </div>
          <div id="gg">
            {vis.map((i, k) => (
              <figure
                key={items[i].id || i}
                className={'gi ' + SH[i % SH.length]}
                tabIndex={0}
                style={{ ...col(i), animationDelay: k * 0.04 + 's' }}
                onClick={() => setOpen(k)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setOpen(k);
                  }
                }}
              >
                {items[i].src ? (
                  <img src={items[i].src} alt={items[i].cap} loading="lazy" />
                ) : (
                  <span className="gn">{String(i + 1).padStart(2, '0')}</span>
                )}
                <figcaption>{items[i].cap}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
      <div className={'glb' + (cur !== null ? ' on' : '')} onClick={(e) => { if (e.target === e.currentTarget) setOpen(null); }}>
        <button className="gx" onClick={() => setOpen(null)} aria-label="Close">&times;</button>
        <button className="gpv" onClick={() => show(open - 1)} aria-label="Previous">&#8249;</button>
        {cur !== null && (
          <div
            className={`gstage ${items[cur].src ? 'has-img' : ''}`}
            key={cur}
            style={items[cur].src ? undefined : col(cur)}
          >
            {items[cur].src ? (
              <img src={items[cur].src} alt={items[cur].cap} />
            ) : (
              <span>{String(cur + 1).padStart(2, '0')}</span>
            )}
          </div>
        )}
        <button className="gnx" onClick={() => show(open + 1)} aria-label="Next">&#8250;</button>
        {cur !== null && <div className="gcap">{items[cur].cap} &nbsp;&middot;&nbsp; {open + 1} / {vis.length}</div>}
      </div>
    </>
  );
}
