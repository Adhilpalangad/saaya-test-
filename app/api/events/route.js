import { NextResponse } from 'next/server';
import { getStore, saveStore } from '../../../lib/store';
import { EV, DAYS } from '../../../lib/data';

export async function GET() {
  try {
    const store = getStore();
    return NextResponse.json({
      success: true,
      eventStatuses: store.eventStatuses || {},
      EV,
      DAYS,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { eventName, status } = await req.json();
    if (!eventName) {
      return NextResponse.json({ success: false, error: 'Missing eventName' }, { status: 400 });
    }

    const store = getStore();
    if (!store.eventStatuses) {
      store.eventStatuses = {};
    }

    // Normalized status: 'live' | 'done' | 'upcoming'
    const newStatus = status === 'reset' ? 'upcoming' : status;
    store.eventStatuses[eventName] = newStatus;

    saveStore(store);

    return NextResponse.json({
      success: true,
      eventStatuses: store.eventStatuses,
      updated: { eventName, status: newStatus },
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
