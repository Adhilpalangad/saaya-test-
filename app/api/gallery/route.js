import { NextResponse } from 'next/server';
import { getSupabase } from '../../../lib/supabase';
import { requireAdmin, checked, failure, ApiError } from '../../../lib/api';
import { getCloudinary } from '../../../lib/cloudinary';

export const dynamic = 'force-dynamic';
async function gallery(db) { return checked(await db.from('gallery').select('*').order('created_at', { ascending: false })); }
export async function GET() {
  try { return NextResponse.json({ success: true, gallery: await gallery(getSupabase()) }); }
  catch (error) { return failure(error); }
}
export async function POST(req) {
  try {
    const db = await requireAdmin(req);
    const body = await req.json();
    const year = Number(body.y);
    if (!Number.isInteger(year) || year < 2000 || year > 2100 || typeof body.cap !== 'string' || body.cap.trim().length > 300) throw new ApiError('Check the photo caption and year.');
    if (typeof body.public_id !== 'string' || !body.public_id.startsWith('saaya/gallery/')) throw new ApiError('Invalid uploaded photo.');
    const cloud = getCloudinary();
    let asset;
    try { asset = await cloud.api.resource(body.public_id, { resource_type: 'image' }); }
    catch { throw new ApiError('Uploaded photo could not be verified.'); }
    if (!['jpg', 'png', 'webp', 'avif', 'heic'].includes(asset.format) || asset.bytes > 10000000) throw new ApiError('Use a supported photo under 10 MB.');
    const item = checked(await db.from('gallery').insert({ src: asset.secure_url, public_id: asset.public_id, cap: body.cap.trim() || 'Saaya Art Fest', y: year }).select().single());
    return NextResponse.json({ success: true, item, gallery: await gallery(db) });
  } catch (error) { return failure(error); }
}
export async function DELETE(req) {
  try {
    const db = await requireAdmin(req);
    const { id } = await req.json();
    if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id)) throw new ApiError('Invalid photo ID.');
    // Remove the archive entry. Keep the media asset to allow recovery.
    checked(await db.from('gallery').delete().eq('id', id));
    return NextResponse.json({ success: true, gallery: await gallery(db) });
  } catch (error) { return failure(error); }
}
