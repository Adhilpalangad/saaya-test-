import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { requireAdmin, failure } from '../../../../lib/api';
import { getCloudinary } from '../../../../lib/cloudinary';

export async function POST(req) {
  try {
    await requireAdmin(req);
    const cloud = getCloudinary();
    const params = { timestamp: Math.floor(Date.now() / 1000), public_id: `saaya/gallery/${randomUUID()}`, overwrite: false, allowed_formats: 'jpg,png,webp,avif,heic' };
    return NextResponse.json({ ...params, signature: cloud.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET), api_key: process.env.CLOUDINARY_API_KEY, cloud_name: process.env.CLOUDINARY_CLOUD_NAME });
  } catch (error) { return failure(error); }
}
