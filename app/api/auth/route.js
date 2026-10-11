import { NextResponse } from 'next/server';
import { requireAdmin, failure } from '../../../lib/api';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try { await requireAdmin(req); return NextResponse.json({ success: true }); }
  catch (error) { return failure(error); }
}
