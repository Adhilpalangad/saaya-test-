'use client';
import { useState, useEffect } from 'react';
import { FEST, SQ, SQN } from '../lib/data';

import { usePublicData } from '../lib/use-public-data';

export default function HomeLeaderboard() {
  const { data, error } = usePublicData('/api/results');
  const board = data?.board || SQN.map(n => [n, SQ[n].d.join(', '), 0]);

  return (
    <section id="results">
      <h2 id="lbt">
        {FEST.name.charAt(0) + FEST.name.slice(1).toLowerCase() + ' ' + String(FEST.year).slice(2) + ' Leaderboard'}
      </h2>
      {error && <p role="status">{error}</p>}
      <div className="lb" id="lb">
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
