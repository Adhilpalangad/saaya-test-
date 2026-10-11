'use client';
import { FEST } from '../lib/data';

import { usePublicData } from '../lib/use-public-data';

export default function HomeLeaderboard() {
  const { data, error } = usePublicData('/api/results');
  const hasStandings = data && (data.isManual || data.results?.length > 0);
  const board = hasStandings ? data.board || [] : [];

  return (
    <section id="results">
      <h2 id="lbt">
        {FEST.name.charAt(0) + FEST.name.slice(1).toLowerCase() + ' ' + String(FEST.year).slice(2) + ' Leaderboard'}
      </h2>
      {error && <p role="status">{error}</p>}
      <div className="lb" id="lb">
        {!board.length && <p className="rempty" role="status">{!data && !error ? 'Loading leaderboard...' : 'No data available.'}</p>}
        {board.map(([name, depts, pts], i) => (
          <div className="row" key={name}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span className="rank">{i < 3 ? ['\u{1F947}', '\u{1F948}', '\u{1F949}'][i] : '#' + (i + 1)}</span>
              <div>
                <h3>{name}</h3>
                <span>{depts}</span>
              </div>
            </div>
            <strong>{pts} PTS</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
