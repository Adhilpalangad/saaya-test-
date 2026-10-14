import { SQ, SQN } from './data';

// Calculate auto points from event results (1st: 5 pts, 2nd: 3 pts, 3rd: 1 pt)
export function calculateAutoPoints(resultsList = []) {
  const points = Object.fromEntries(SQN.map((q) => [q, 0]));
  const PT = [5, 3, 1];

  resultsList.forEach((r) => {
    if (Array.isArray(r.p)) {
      r.p.forEach((p, idx) => {
        if (p && p.q && points[p.q] !== undefined) {
          const ptIdx = typeof p.place === 'number' && p.place >= 1 && p.place <= 3 ? p.place - 1 : idx;
          points[p.q] += PT[ptIdx] || 0;
        }
      });
    }
  });
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
