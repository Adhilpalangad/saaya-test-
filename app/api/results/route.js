import { NextResponse } from 'next/server';
import { getStore, saveStore, getLeaderboardData, calculateAutoPoints } from '../../../lib/store';
import { SQ, SQN } from '../../../lib/data';

export async function GET() {
  try {
    const store = getStore();
    const results = store.results || [];
    const lbData = getLeaderboardData(store);

    return NextResponse.json({
      success: true,
      results,
      points: lbData.points,
      board: lbData.board,
      isManual: lbData.isManual,
      manualPoints: lbData.manualPoints,
      autoPoints: lbData.autoPoints,
      SQ,
      SQN,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const store = getStore();

    // Action 1: Set Manual Points for Squads
    if (body.action === 'set_manual_points') {
      const incoming = body.points || {};
      const newManual = {};
      SQN.forEach((squad) => {
        newManual[squad] = Math.max(0, parseInt(incoming[squad], 10) || 0);
      });

      store.manualPoints = newManual;
      store.isManualLeaderboard = true;
      saveStore(store);

      const lbData = getLeaderboardData(store);
      return NextResponse.json({
        success: true,
        message: 'Leaderboard points manually updated',
        results: store.results || [],
        points: lbData.points,
        board: lbData.board,
        isManual: lbData.isManual,
        manualPoints: lbData.manualPoints,
        autoPoints: lbData.autoPoints,
      });
    }

    // Action 2: Reset / Recalculate to Auto Points from Event Results
    if (body.action === 'reset_to_auto' || body.action === 'recalculate') {
      const autoPoints = calculateAutoPoints(store.results || []);
      store.manualPoints = { ...autoPoints };
      store.isManualLeaderboard = false;
      saveStore(store);

      const lbData = getLeaderboardData(store);
      return NextResponse.json({
        success: true,
        message: 'Leaderboard reset to auto-calculated event results',
        results: store.results || [],
        points: lbData.points,
        board: lbData.board,
        isManual: lbData.isManual,
        manualPoints: lbData.manualPoints,
        autoPoints: lbData.autoPoints,
      });
    }

    // Action 3: Mode Toggle
    if (body.action === 'toggle_mode') {
      store.isManualLeaderboard = Boolean(body.isManual);
      saveStore(store);

      const lbData = getLeaderboardData(store);
      return NextResponse.json({
        success: true,
        results: store.results || [],
        points: lbData.points,
        board: lbData.board,
        isManual: lbData.isManual,
        manualPoints: lbData.manualPoints,
        autoPoints: lbData.autoPoints,
      });
    }

    // Action 4: Save Winners for an Event
    const { eventName, winners } = body;
    if (!eventName || !Array.isArray(winners)) {
      return NextResponse.json({ success: false, error: 'Invalid eventName or winners format' }, { status: 400 });
    }

    let results = store.results || [];
    const existingIdx = results.findIndex((r) => r.n === eventName);
    if (existingIdx >= 0) {
      results[existingIdx].p = winners;
    } else {
      results.push({
        t: 'On Stage',
        n: eventName,
        p: winners,
      });
    }

    store.results = results;
    saveStore(store);

    const lbData = getLeaderboardData(store);
    return NextResponse.json({
      success: true,
      message: `Results saved for ${eventName}`,
      results,
      points: lbData.points,
      board: lbData.board,
      isManual: lbData.isManual,
      manualPoints: lbData.manualPoints,
      autoPoints: lbData.autoPoints,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
