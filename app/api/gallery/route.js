import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getStore, saveStore } from '../../../lib/store';

export async function GET() {
  try {
    const store = getStore();
    return NextResponse.json({
      success: true,
      gallery: store.gallery || [],
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const contentType = req.headers.get('content-type') || '';
    const store = getStore();
    if (!Array.isArray(store.gallery)) {
      store.gallery = [];
    }

    let src = '';
    let cap = '';
    let y = 2026;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file');
      cap = (formData.get('cap') || '').toString().trim() || 'Saaya Art Fest';
      const yearStr = (formData.get('y') || '').toString().trim();
      y = parseInt(yearStr, 10) || 2026;

      if (!file || typeof file === 'string') {
        return NextResponse.json({ success: false, error: 'No image file uploaded' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const ext = path.extname(file.name) || '.jpg';
      const safeName = file.name.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `gal_${Date.now()}_${safeName}${ext.startsWith('.') ? '' : '.' + ext}`;
      const uploadDir = path.join(process.cwd(), 'public', 'images', 'gallery');

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const targetPath = path.join(uploadDir, filename);
      fs.writeFileSync(targetPath, buffer);
      src = `/images/gallery/${filename}`;
    } else {
      const body = await req.json();
      src = body.src || '';
      cap = body.cap || 'Saaya Art Fest';
      y = parseInt(body.y, 10) || 2026;
    }

    if (!src) {
      return NextResponse.json({ success: false, error: 'Missing image source or file' }, { status: 400 });
    }

    const newItem = {
      id: 'gal_' + Date.now(),
      y,
      src,
      cap,
    };

    // Prepend to gallery so latest added photos appear first
    store.gallery.unshift(newItem);
    saveStore(store);

    return NextResponse.json({
      success: true,
      gallery: store.gallery,
      item: newItem,
    });
  } catch (err) {
    console.error('Gallery upload error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing item id' }, { status: 400 });
    }

    const store = getStore();
    const prevLen = store.gallery.length;
    store.gallery = (store.gallery || []).filter((item) => item.id !== id);

    if (store.gallery.length !== prevLen) {
      saveStore(store);
    }

    return NextResponse.json({
      success: true,
      gallery: store.gallery,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
