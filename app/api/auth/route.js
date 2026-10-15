import { NextResponse } from 'next/server';
import { requireAdmin, failure } from '../../../lib/api';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const db = await requireAdmin(req);
    return NextResponse.json({
      success: true,
      user: {
        id: db.adminUser.id,
        email: db.adminUser.email,
        role: db.adminUser.role,
        isSuperAdmin: db.adminUser.isSuperAdmin,
      },
    });
  } catch (error) { return failure(error); }
}

