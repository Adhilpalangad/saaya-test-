'use client';
import { useState, useEffect } from 'react';
import { FEST, BOARD } from '../lib/data';

export default function HomeLeaderboard() {
  const [board, setBoard] = useState(BOARD);

  useEffect(() => {
    fetch('/api/results')
      .then((res) => res.json())
      .then((data) => {
        if (data.board && Array.isArray(data.board) && data.board.length) {
          setBoard(data.board);
        }
      })
      .catch((err) => console.error('Error fetching leaderboard:', err));
  }, []);

  return (
    <section id="results">
      <h2 id="lbt">
        {FEST.name.charAt(0) + FEST.name.slice(1).toLowerCase() + ' ' + String(FEST.year).slice(2) + ' Leaderboard'}
      </h2>
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
