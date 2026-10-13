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
  Sparkles,
  Clock,
  Radio,
  TrendingUp,
  Maximize2,
  Minimize2,
} from './Icons';

export default function ScreenLeaderboard() {
  const { data, error } = usePublicData('/api/results');

  // Falling petals identical to hero section
  const [petals, setPetals] = useState([]);
  useEffect(() => {
    setPetals(
      Array.from({ length: 16 }, () => ({
        l: 5 + Math.random() * 90,
        d: 9 + Math.random() * 9,
        w: -Math.random() * 14,
        s: 0.5 + Math.random() * 0.7,
      }))
    );
  }, []);

  // Live real-time clock
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
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
      setDateStr(
        now.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }).toUpperCase()
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
      bg: 'rgba(224, 176, 48, 0.2)',
      border: 'rgba(224, 176, 48, 0.65)',
      glow: 'rgba(224, 176, 48, 0.35)',
      Icon: Crown,
    },
    {
      label: '2',
      badgeClass: 'pos-2',
      color: '#e2e8f0',
      bg: 'rgba(226, 232, 240, 0.14)',
      border: 'rgba(226, 232, 240, 0.4)',
      glow: 'rgba(226, 232, 240, 0.2)',
      Icon: Medal,
    },
    {
      label: '3',
      badgeClass: 'pos-3',
      color: '#e29b68',
      bg: 'rgba(205, 127, 50, 0.16)',
      border: 'rgba(205, 127, 50, 0.45)',
      glow: 'rgba(205, 127, 50, 0.2)',
      Icon: Award,
    },
  ];

  const defaultPointsPerRank = ['+5 PTS', '+3 PTS', '+1 PT'];

  return (
    <main id="screen-view">
      {/* Background Hero elements (only ambient visuals, no texts) */}
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
        {/* TOP BAR: Logo, Title, Live Status & Real-time Clock */}
        <header className="screen-header">
          <div className="screen-brand">
            <div className="screen-logo-badge">
              <Trophy size={32} color="#ffd700" />
            </div>
            <div className="screen-brand-text">
              <h1>SAAYA 2026</h1>
              <p>AWH Engineering College &middot; The Grand Arts Fiesta</p>
            </div>
          </div>

          <div className="screen-header-meta">
            <div className="screen-live-pill">
              <span className="screen-live-dot" />
              <span>Live Standings</span>
            </div>
            <div className="screen-clock" title={dateStr}>
              {timeStr || 'LIVE'}
            </div>
          </div>
        </header>

        {/* SECTION 1 (TOP/MIDDLE): TOTAL TEAMS POINTS CARD */}
        <section className="screen-standings-card" aria-label="Team Standings">
          <div className="screen-card-header">
            <div className="screen-card-title">
              <Trophy size={28} color="#e0b030" />
              <div>
                <h2>Total Team Points</h2>
                <p>Overall Squad Championship Standings</p>
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.82rem',
                color: 'var(--muted)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              <TrendingUp size={16} color="#4ade80" />
              <span>Real-Time Points Tally</span>
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
                    '--sq-border': isFirst ? 'rgba(224, 176, 48, 0.5)' : squadInfo.color + '40',
                    '--rank-color': rankInfo.color,
                    '--rank-bg': rankInfo.bg,
                    '--rank-border': rankInfo.border,
                    '--rank-glow': rankInfo.glow,
                  }}
                >
                  {/* Rank Badge */}
                  <div className="screen-rank-badge" title={`Rank ${index + 1}`}>
                    <RankIcon size={26} color={rankInfo.color} />
                    <span style={{ fontSize: '1rem', marginTop: '2px' }}>#{index + 1}</span>
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

                  {/* Squad Info */}
                  <div className="screen-squad-info">
                    <div className="screen-squad-name-row">
                      <h3 className="screen-squad-name">{name}</h3>
                      {isFirst && (
                        <span className="screen-leader-chip">
                          <Crown size={13} color="#f7d368" />
                          <span>Current Leader</span>
                        </span>
                      )}
                    </div>
                    <p className="screen-squad-depts">{squadInfo.depts || depts}</p>
                    <div className="screen-squad-bar-wrap">
                      <div className="screen-squad-bar" style={{ width: `${percent}%` }} />
                    </div>
                  </div>

                  {/* Big Points Total */}
                  <div className="screen-squad-points">
                    <span className="screen-squad-points-val">{pts}</span>
                    <span className="screen-squad-points-label">POINTS</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 2 (BOTTOM): LATEST TWO RESULTS SIDE BY SIDE */}
        <section className="screen-results-section" aria-label="Latest Results">
          <div className="screen-section-title">
            <div className="screen-section-title-left">
              <Flame size={24} color="#e0453b" />
              <div>
                <h3>Latest Results</h3>
                <p>Recently Announced Event Competitions</p>
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.8rem',
                color: 'var(--muted)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              <Sparkles size={16} color="#e0b030" />
              <span>Official Jury Confirmations</span>
            </div>
          </div>

          <div className="screen-results-grid">
            {/* CARD 1: Latest Result */}
            {latestResults[0] ? (
              <div className="screen-result-card primary">
                <div className="screen-result-card-top">
                  <div>
                    <h4 className="screen-result-event-name">{latestResults[0].n}</h4>
                    <span className="screen-result-category">
                      <Radio size={13} color="#e0453b" />
                      <span>{latestResults[0].t || 'Competition'}</span>
                    </span>
                  </div>
                  <span className="screen-result-badge">
                    <Clock size={12} color="#ff7870" />
                    <span>Latest Update</span>
                  </span>
                </div>

                <div className="screen-winners-list">
                  {latestResults[0].p.map((winner, idx) => {
                    const rankInfo = rankStyles[idx] || rankStyles[2];
                    const squadInfo = squadStyles[winner.q] || { color: '#e0453b' };
                    const RankIcon = rankInfo.Icon;

                    return (
                      <div key={idx} className={`screen-winner-row p-${idx + 1}`}>
                        <div className={`screen-winner-pos ${rankInfo.badgeClass}`}>
                          <RankIcon size={20} color={rankInfo.color} />
                        </div>
                        <div className="screen-winner-details">
                          <p className="screen-winner-name" title={winner.n}>
                            {winner.n}
                          </p>
                          <div className="screen-winner-meta">
                            <span>
                              S{winner.s} &middot; {winner.d}
                            </span>
                            <span
                              className="screen-winner-squad-tag"
                              style={{
                                color: squadInfo.color,
                                border: `1px solid ${squadInfo.color}55`,
                              }}
                            >
                              {winner.q}
                            </span>
                          </div>
                        </div>
                        <div className="screen-winner-pts">
                          {defaultPointsPerRank[idx] || '+1 PT'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="screen-result-card screen-empty-card">
                <Clock size={36} color="var(--muted)" />
                <h4>Awaiting First Result</h4>
                <p>Scores will display in real time as judges finalize the event results.</p>
              </div>
            )}

            {/* CARD 2: Second Latest Result */}
            {latestResults[1] ? (
              <div className="screen-result-card">
                <div className="screen-result-card-top">
                  <div>
                    <h4 className="screen-result-event-name">{latestResults[1].n}</h4>
                    <span className="screen-result-category">
                      <Radio size={13} color="#e0453b" />
                      <span>{latestResults[1].t || 'Competition'}</span>
                    </span>
                  </div>
                  <span
                    className="screen-result-badge"
                    style={{
                      background: 'rgba(255, 255, 255, 0.06)',
                      borderColor: 'rgba(255, 255, 255, 0.15)',
                      color: 'var(--muted)',
                    }}
                  >
                    <span>Previous Result</span>
                  </span>
                </div>

                <div className="screen-winners-list">
                  {latestResults[1].p.map((winner, idx) => {
                    const rankInfo = rankStyles[idx] || rankStyles[2];
                    const squadInfo = squadStyles[winner.q] || { color: '#e0453b' };
                    const RankIcon = rankInfo.Icon;

                    return (
                      <div key={idx} className={`screen-winner-row p-${idx + 1}`}>
                        <div className={`screen-winner-pos ${rankInfo.badgeClass}`}>
                          <RankIcon size={20} color={rankInfo.color} />
                        </div>
                        <div className="screen-winner-details">
                          <p className="screen-winner-name" title={winner.n}>
                            {winner.n}
                          </p>
                          <div className="screen-winner-meta">
                            <span>
                              S{winner.s} &middot; {winner.d}
                            </span>
                            <span
                              className="screen-winner-squad-tag"
                              style={{
                                color: squadInfo.color,
                                border: `1px solid ${squadInfo.color}55`,
                              }}
                            >
                              {winner.q}
                            </span>
                          </div>
                        </div>
                        <div className="screen-winner-pts">
                          {defaultPointsPerRank[idx] || '+1 PT'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="screen-result-card screen-empty-card">
                <Sparkles size={36} color="var(--muted)" />
                <h4>Next Event In Progress</h4>
                <p>Second recent result will automatically display here on verification.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Discreet fullscreen control button for stage LED operator */}
      <button
        className="screen-fs-toggle"
        onClick={toggleFullscreen}
        aria-label="Toggle Fullscreen LED Mode"
        title="Toggle Fullscreen"
      >
        {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
      </button>
    </main>
  );
}
