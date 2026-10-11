import { NextResponse } from 'next/server';
import { getStore } from '../../../lib/store';

export async function POST(req) {
  try {
    const { pass } = await req.json();
    const store = getStore();

    if (pass === store.adminPass) {
      return NextResponse.json({ success: true, token: 'saaya_admin_auth_valid' });
    }
    return NextResponse.json({ success: false, error: 'Incorrect passcode' }, { status: 401 });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
