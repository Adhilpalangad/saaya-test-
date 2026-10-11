'use client';
import { useState, useEffect } from 'react';
import { EV, DAYS, FEST } from '../lib/data';

const Ic = ({ d }) => <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">{d}</svg>;
const cal = <Ic d={<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>} />;
const clk = <Ic d={<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>} />;
const pin = <Ic d={<><path d="M12 21s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z" /><circle cx="12" cy="9" r="2.5" /></>} />;
const go = <Ic d={<path d="M5 12h14M13 6l6 6-6 6" />} />;

export default function EventsPage() {
  const [cur, setCur] = useState('On Stage');
  const [statuses, setStatuses] = useState({ Thiruvathirakali: 'live' });
  const [search, setSearch] = useState('');

  // Poll for live event updates from admin every 3 seconds
  useEffect(() => {
    let active = true;
    const fetchStatuses = async () => {
      try {
        const res = await fetch('/api/events');
        if (res.ok) {
          const data = await res.json();
          if (data.eventStatuses && active) {
            setStatuses(data.eventStatuses);
          }
        }
      } catch (err) {
        // Fallback silently
      }
    };

    fetchStatuses();
    const interval = setInterval(fetchStatuses, 3000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // Find all currently live events across all categories
  const liveEvents = [];
  Object.entries(EV).forEach(([cat, list]) => {
    list.forEach((e) => {
      if (statuses[e[0]] === 'live') {
        liveEvents.push({
          name: e[0],
          day: e[1],
          time: e[2],
          venue: e[3] || (cat === 'On Stage' ? 'Main Stage' : 'Seminar Hall'),
          category: cat,
        });
      }
    });
  });

  // Filter events by tab and search
  const rawList = EV[cur] || [];
  const s = search.trim().toLowerCase();
  const list = rawList.filter((e) => !s || e[0].toLowerCase().includes(s) || (e[3] || '').toLowerCase().includes(s));

  return (
    <div id="evpage">
      <div className="evw">
        <h1>Events</h1>
        <p id="evsub">Discover the rhythm of Saaya {FEST.year}</p>

        {/* LIVE NOW Showcase Banner (displays automatically when admin sets an event to Live) */}
        {liveEvents.length > 0 && (
          <section className="live-now-container" aria-label="Ongoing Live Events">
            <div className="live-now-header">
              <div className="live-now-badge-title">
                <span className="live-pulse-dot" />
                <span>LIVE NOW</span>
              </div>
              <div className="live-now-count">
                {liveEvents.length} EVENT{liveEvents.length > 1 ? 'S' : ''} ONGOING
              </div>
            </div>

            <div className="live-now-cards">
              {liveEvents.map((ev) => (
                <div className="live-card" key={ev.name}>
                  <div className="live-card-top">
                    <span className="live-card-cat">{ev.category}</span>
                    <span className="live-pill-badge">ONGOING</span>
                  </div>
                  <h3 className="live-card-title">{ev.name}</h3>
                  <div className="live-card-meta">
                    <p>{pin} {ev.venue}</p>
                    <p>{clk} {ev.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Category tabs */}
        <div className="evtabs" id="evtabs">
          {Object.keys(EV).map((k) => {
            const isCatLive = (EV[k] || []).some(([name]) => statuses[name] === 'live');
            return (
              <button
                key={k}
                className={'evtab' + (k === cur ? ' on' : '')}
                onClick={() => setCur(k)}
              >
                {k} {isCatLive && <span className="tab-live-dot" title="Live event ongoing" />}
              </button>
            );
          })}
        </div>

        {/* Search bar */}
        <div className="ev-search-wrap">
          <div className="ev-search-box">
            <svg viewBox="0 0 24 24" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-4-4" />
            </svg>
            <input
              type="search"
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search events"
            />
          </div>
        </div>

        {/* Event Cards Grid */}
        <div id="evgrid" key={cur}>
          {list.length ? (
            list.map((e, i) => {
              const st = statuses[e[0]] || 'upcoming';
              return (
                <div
                  className={`ec ${st === 'live' ? 'is-live' : ''} ${st === 'done' ? 'is-done' : ''}`}
                  key={e[0]}
                  style={{ animationDelay: i * 0.04 + 's' }}
                >
                  <div className="ec-top-status">
                    {st === 'live' && <span className="ec-tag live">● LIVE NOW</span>}
                    {st === 'done' && <span className="ec-tag done">&#10003; COMPLETED</span>}
                  </div>

                  <h3>{e[0]}</h3>
                  <p>{cal}{DAYS[e[1]]}</p>
                  <p>{clk}{e[2]}</p>
                  <p>{pin}{e[3] || 'Main Stage'}</p>

                  <a className="rg" href="#">
                    <span>Register</span>
                    {go}
                  </a>
                </div>
              );
            })
          ) : (
            <p className="evempty">No events matching your search.</p>
          )}
        </div>
      </div>
    </div>
  );
}
