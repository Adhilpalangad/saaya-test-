import fs from 'fs';
import path from 'path';
import { EV, ROWS, GAL, POINTS, SQ, SQN } from './data';

const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'store.json');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Default initial state
function getDefaultStore() {
  const defaultEventStatuses = {};
  // Let Thiruvathirakali start as live so the showcase card renders immediately like the user mock
  defaultEventStatuses['Thiruvathirakali'] = 'live';

  const defaultResults = ROWS;
  const auto = calculateAutoPoints(defaultResults);

  return {
    adminPass: 'saaya2026',
    eventStatuses: defaultEventStatuses,
    gallery: GAL.map((g, i) => ({
      id: 'gal_' + (i + 1),
      y: g.y,
      src: g.src || '',
      cap: g.cap,
    })),
    results: defaultResults,
    isManualLeaderboard: false,
    manualPoints: { ...auto },
  };
}

export function getStore() {
  try {
    if (!fs.existsSync(STORE_PATH)) {
      const def = getDefaultStore();
      fs.writeFileSync(STORE_PATH, JSON.stringify(def, null, 2), 'utf-8');
      return def;
    }
    const raw = fs.readFileSync(STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);

    // Merge missing fields if any
    let changed = false;
    if (!parsed.eventStatuses) {
      parsed.eventStatuses = { Thiruvathirakali: 'live' };
      changed = true;
    }
    if (!parsed.gallery) {
      parsed.gallery = getDefaultStore().gallery;
      changed = true;
    }
    if (!parsed.results) {
      parsed.results = ROWS;
      changed = true;
    }
    if (!parsed.adminPass) {
      parsed.adminPass = 'saaya2026';
      changed = true;
    }
    if (parsed.manualPoints === undefined) {
      const auto = calculateAutoPoints(parsed.results || ROWS);
      parsed.manualPoints = { ...auto };
      changed = true;
    }
    if (parsed.isManualLeaderboard === undefined) {
      parsed.isManualLeaderboard = false;
      changed = true;
    }
    if (changed) {
      fs.writeFileSync(STORE_PATH, JSON.stringify(parsed, null, 2), 'utf-8');
    }
    return parsed;
  } catch (err) {
    console.error('Error reading store:', err);
    return getDefaultStore();
  }
}

export function saveStore(store) {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error saving store:', err);
    return false;
  }
}

// Calculate auto points from event results (1st: 5 pts, 2nd: 3 pts, 3rd: 1 pt)
export function calculateAutoPoints(resultsList = []) {
  const points = Object.fromEntries(SQN.map((q) => [q, 0]));
  const PT = [5, 3, 1];

  resultsList.forEach((r) => {
    if (Array.isArray(r.p)) {
      r.p.forEach((p, idx) => {
        if (p && p.q && points[p.q] !== undefined) {
          points[p.q] += PT[idx] || 0;
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
