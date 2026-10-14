'use client';
import { useEffect, useState, useMemo } from 'react';
import { SQ, SQN } from '../lib/data';
import { usePublicData } from '../lib/use-public-data';
import {
  Trophy,
  Crown,
  Medal,
  Award,
  Flame,
  Clock,
  Maximize2,
  Minimize2,
} from './Icons';

export default function ScreenLeaderboard() {
  const { data } = usePublicData('/api/results');

  // Falling petals identical to hero section
  const [petals, setPetals] = useState([]);
  useEffect(() => {
    setPetals(
      Array.from({ length: 14 }, () => ({
        l: 5 + Math.random() * 90,
        d: 9 + Math.random() * 9,
        w: -Math.random() * 14,
        s: 0.5 + Math.random() * 0.7,
      }))
    );
  }, []);

  // Live real-time clock
  const [timeStr, setTimeStr] = useState('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fullscreen support for the 1080x1920 LED operator
  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Standings computation
  const board = useMemo(() => {
    if (data && Array.isArray(data.board) && data.board.length > 0) {
      return data.board;
    }
    // Fallback based on SQN
    return SQN.map((n) => [n, SQ[n].d.join(', '), 0]);
  }, [data]);

  const maxPoints = useMemo(() => {
    const pts = board.map((item) => Number(item[2]) || 0);
    return Math.max(...pts, 1);
  }, [board]);

  // Latest two published results
  const latestResults = useMemo(() => {
    if (!data || !Array.isArray(data.results)) return [];
    // Filter events that actually have winner placements
    const valid = data.results.filter((r) => Array.isArray(r.p) && r.p.length > 0);
    // Take the two most recently published results
    return valid.slice(-2).reverse();
  }, [data]);

  // Squad styling lookup
  const squadStyles = {
    Targaryen: {
      color: '#e0453b',
      colorLight: '#ff8a80',
      banner: '/images/Targaryen Three-Headed Dragon Banner.png',
      depts: 'ME · AD · ECE',
    },
    Stark: {
      color: '#8fa8c4',
      colorLight: '#c2d8ed',
      banner: '/images/Stark Direwolf Winter Crest.png',
      depts: 'EEE · CE · MCA',
    },
    Lannister: {
      color: '#e0b030',
      colorLight: '#ffe177',
      banner: '/images/Lannister Lion Heraldic Banner.png',
      depts: 'CSE',
    },
  };

  // Rank styling tokens
  const rankStyles = [
    {
      label: '1',
      badgeClass: 'pos-1',
      color: '#ffd700',
      bg: 'rgba(224, 176, 48, 0.22)',
      border: 'rgba(224, 176, 48, 0.7)',
      Icon: Crown,
    },
    {
      label: '2',
      badgeClass: 'pos-2',
      color: '#e2e8f0',
      bg: 'rgba(226, 232, 240, 0.16)',
      border: 'rgba(226, 232, 240, 0.5)',
      Icon: Medal,
    },
    {
      label: '3',
      badgeClass: 'pos-3',
      color: '#e29b68',
      bg: 'rgba(205, 127, 50, 0.18)',
      border: 'rgba(205, 127, 50, 0.5)',
      Icon: Award,
    },
  ];

  const defaultPointsPerRank = ['+5 PTS', '+3 PTS', '+2 PTS'];

  return (
    <main id="screen-view">
      {/* Background Hero visual elements (only ambient visual graphics, no texts) */}
      <div className="screen-art" aria-hidden="true" />
      <div className="screen-petals" aria-hidden="true">
        {petals.map((p, i) => (
          <i
            key={i}
            className="petal"
            style={{
              left: p.l + '%',
              animationDuration: p.d + 's',
              animationDelay: p.w + 's',
              transform: `scale(${p.s})`,
            }}
          />
        ))}
      </div>

      <div className="screen-container">
        {/* TOP BAR: Clean Fest Branding, Live Status & Time Clock */}
        <header className="screen-header">
          <div className="screen-brand">
            <div className="screen-logo-badge">
              <Trophy size={26} color="#ffd700" />
            </div>
            <h1 className="screen-brand-title">SAAYA 2026</h1>
          </div>

          <div className="screen-header-meta">
            <div className="screen-live-pill">
              <span className="screen-live-dot" />
              <span>LIVE</span>
            </div>
            <div className="screen-clock">{timeStr || 'LIVE'}</div>
          </div>
        </header>

        {/* MAIN BODY LAYOUT */}
        <div className="screen-body-layout">
          {/* SECTION 1: TOTAL TEAM POINTS CARD */}
          <section className="screen-standings-card" aria-label="Team Standings">
            <div className="screen-card-header">
              <div className="screen-card-title">
                <Trophy size={24} color="#ffd700" />
                <h2>Team Standings</h2>
              </div>
            </div>

            <div className="screen-squads-list">
              {board.map(([name, depts, pts], index) => {
                const rankInfo = rankStyles[index] || {
                  label: String(index + 1),
                  color: '#eadfd2',
                  bg: 'rgba(255, 255, 255, 0.05)',
                  border: 'rgba(255, 255, 255, 0.1)',
                  Icon: Award,
                };
                const squadInfo = squadStyles[name] || {
                  color: '#eadfd2',
                  colorLight: '#ffffff',
                  banner: SQ[name]?.banner || '/images/logo-nav-white.png',
                  depts: depts || '',
                };
                const percent = Math.min(100, Math.round(((Number(pts) || 0) / maxPoints) * 100));
                const isFirst = index === 0 && (Number(pts) || 0) > 0;
                const RankIcon = rankInfo.Icon;

                return (
                  <div
                    key={name}
                    className={`screen-squad-item ${isFirst ? 'leader' : ''}`}
                    style={{
                      '--sq-color': squadInfo.color,
                      '--sq-color-light': squadInfo.colorLight,
                      '--sq-glow': squadInfo.color + '44',
                      '--sq-border': isFirst ? 'rgba(224, 176, 48, 0.55)' : squadInfo.color + '40',
                      '--rank-color': rankInfo.color,
                      '--rank-bg': rankInfo.bg,
                      '--rank-border': rankInfo.border,
                    }}
                  >
                    <div className="screen-squad-left">
                      {/* Rank Badge */}
                      <div className="screen-rank-badge">
                        <RankIcon size={18} color={rankInfo.color} />
                        <span>#{index + 1}</span>
                      </div>

                      {/* Crest Banner */}
                      <div className="screen-squad-crest">
                        <img
                          src={squadInfo.banner}
                          alt={`${name} Crest`}
                          loading="eager"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>

                      {/* Squad Name and Departments */}
                      <div className="screen-squad-info">
                        <h3 className="screen-squad-name">{name}</h3>
                        <p className="screen-squad-depts">{squadInfo.depts || depts}</p>
                        <div className="screen-squad-bar-wrap">
                          <div className="screen-squad-bar" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Big Visible Points */}
                    <div className="screen-squad-points">
                      <span className="screen-squad-points-val">{pts}</span>
                      <span className="screen-squad-points-label">PTS</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* SECTION 2: LATEST RESULTS (TWO SIDES) */}
          <section className="screen-results-section" aria-label="Latest Results">
            <div className="screen-section-title">
              <div className="screen-section-title-left">
                <Flame size={22} color="#e0453b" />
                <h3>Latest Results</h3>
              </div>
            </div>

            <div className="screen-results-grid">
              {/* CARD 1: Most Recent Result */}
              {latestResults[0] ? (
                <div className="screen-result-card primary">
                  <div className="screen-result-card-top">
                    <h4 className="screen-result-event-name">{latestResults[0].n}</h4>
                    <span className="screen-result-category">
                      {latestResults[0].t || 'Event'}
                    </span>
                  </div>

                  <div className="screen-winners-list">
                    {latestResults[0].p.map((winner, idx) => {
                      const place = typeof winner.place === 'number' && winner.place >= 1 && winner.place <= 3 ? winner.place : Math.min(idx + 1, 3);
                      const isGrp = Boolean(latestResults[0].isGroup || winner.isGroup);
                      const rankLabel = place === 1 ? '1st' : place === 2 ? '2nd' : '3rd';
                      const ptsLabel = isGrp
                        ? (place === 1 ? '+10 PTS' : place === 2 ? '+5 PTS' : '+3 PTS')
                        : (place === 1 ? '+5 PTS' : place === 2 ? '+3 PTS' : '+2 PTS');
                      const squadInfo = squadStyles[winner.q] || { color: '#e0453b' };

                      return (
                        <div key={idx} className={`screen-winner-row p-${place}`}>
                          <div className="screen-winner-left">
                            <span className={`screen-winner-pos-tag pos-${place}`}>
                              {rankLabel}
                            </span>
                            <div className="screen-winner-details">
                              <span className="screen-winner-name" title={winner.n}>
                                {winner.n}
                              </span>
                              <span className="screen-winner-meta">
                                S{winner.s} &middot; {winner.d} &middot;{' '}
                                <strong style={{ color: squadInfo.color }}>{winner.q}</strong>
                              </span>
                            </div>
                          </div>
                          <span className="screen-winner-pts">
                            {ptsLabel}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="screen-result-card screen-empty-card">
                  <Clock size={32} color="var(--muted)" />
                  <h4>Awaiting Result</h4>
                  <p>Scores will display live upon judge verification.</p>
                </div>
              )}

              {/* CARD 2: Second Most Recent Result */}
              {latestResults[1] ? (
                <div className="screen-result-card">
                  <div className="screen-result-card-top">
                    <h4 className="screen-result-event-name">{latestResults[1].n}</h4>
                    <span className="screen-result-category">
                      {latestResults[1].t || 'Event'}
                    </span>
                  </div>

                  <div className="screen-winners-list">
                    {latestResults[1].p.map((winner, idx) => {
                      const place = typeof winner.place === 'number' && winner.place >= 1 && winner.place <= 3 ? winner.place : Math.min(idx + 1, 3);
                      const isGrp = Boolean(latestResults[1].isGroup || winner.isGroup);
                      const rankLabel = place === 1 ? '1st' : place === 2 ? '2nd' : '3rd';
                      const ptsLabel = isGrp
                        ? (place === 1 ? '+10 PTS' : place === 2 ? '+5 PTS' : '+3 PTS')
                        : (place === 1 ? '+5 PTS' : place === 2 ? '+3 PTS' : '+2 PTS');
                      const squadInfo = squadStyles[winner.q] || { color: '#e0453b' };

                      return (
                        <div key={idx} className={`screen-winner-row p-${place}`}>
                          <div className="screen-winner-left">
                            <span className={`screen-winner-pos-tag pos-${place}`}>
                              {rankLabel}
                            </span>
                            <div className="screen-winner-details">
                              <span className="screen-winner-name" title={winner.n}>
                                {winner.n}
                              </span>
                              <span className="screen-winner-meta">
                                S{winner.s} &middot; {winner.d} &middot;{' '}
                                <strong style={{ color: squadInfo.color }}>{winner.q}</strong>
                              </span>
                            </div>
                          </div>
                          <span className="screen-winner-pts">
                            {ptsLabel}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="screen-result-card screen-empty-card">
                  <Clock size={32} color="var(--muted)" />
                  <h4>Next Event In Progress</h4>
                  <p>Next verified competition result will appear here.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Discreet fullscreen control button for stage LED operator */}
      <button
        className="screen-fs-toggle"
        onClick={toggleFullscreen}
        aria-label="Toggle Fullscreen LED Mode"
        title="Toggle Fullscreen"
      >
        {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
      </button>
    </main>
  );
}
