import { SQ, SQN } from './data';

// Calculate auto points from event results
// Individual: 1st = 5 pts, 2nd = 3 pts, 3rd = 2 pts (full points for each winner, no division on ties)
// Group: 1st = 10 pts, 2nd = 5 pts, 3rd = 3 pts (full points for each winner, no division on ties)
export function calculateAutoPoints(resultsList = []) {
  const points = Object.fromEntries(SQN.map((q) => [q, 0]));

  resultsList.forEach((r) => {
    const isGroup = Boolean(r.isGroup);
    const PT = isGroup ? { 1: 10, 2: 5, 3: 3 } : { 1: 5, 2: 3, 3: 2 };

    if (Array.isArray(r.p)) {
      const valid = r.p.filter(p => p && p.q && points[p.q] !== undefined);

      valid.forEach((p, idx) => {
        const place = typeof p.place === 'number' && p.place >= 1 && p.place <= 3 ? p.place : Math.min(idx + 1, 3);
        const awarded = PT[place] || 0;
        points[p.q] += awarded;
      });
    }
  });

  for (const q of SQN) {
    points[q] = Math.round(points[q] * 10) / 10;
  }
  return points;
}

// Sort squads descending by points and format as [name, depts, pts]
export function buildBoardFromPoints(points = {}) {
  return SQN.slice()
    .sort((a, b) => (Number(points[b]) || 0) - (Number(points[a]) || 0))
    .map((q) => [q, SQ[q].d.join(', '), Number(points[q]) || 0]);
}

// Get unified leaderboard data reflecting manual override or auto results
export function getLeaderboardData(store) {
  const autoPoints = calculateAutoPoints(store.results || []);
  const autoBoard = buildBoardFromPoints(autoPoints);

  const isManual = Boolean(store.isManualLeaderboard);
  const activePoints = isManual && store.manualPoints ? store.manualPoints : autoPoints;
  const activeBoard = buildBoardFromPoints(activePoints);

  return {
    points: activePoints,
    board: activeBoard,
    autoPoints,
    autoBoard,
    isManual,
    manualPoints: store.manualPoints || autoPoints,
  };
}

// Backward-compatible calculation
export function calculateLeaderboard(resultsList) {
  const points = calculateAutoPoints(resultsList);
  const board = buildBoardFromPoints(points);
  return { points, board };
}
