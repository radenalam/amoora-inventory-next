import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { getAuthUser } from '@/lib/auth';
import { getCached, setCache, invalidateCache } from '@/lib/cache';
import { serializeTimestamps } from '@/lib/firestore';

const SETTINGS_CACHE_KEY = 'settings:general';
const LOGO_CACHE_KEY = 'cache:logo';
const SIGNATURE_CACHE_KEY = 'cache:signature';

export async function GET(request: NextRequest) {
  const authUser = getAuthUser(request.headers);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const asset = searchParams.get('asset'); // 'logo' | 'signature'

  // Serve cached logo/signature as image
  if (asset === 'logo' || asset === 'signature') {
    const cacheKey = asset === 'logo' ? LOGO_CACHE_KEY : SIGNATURE_CACHE_KEY;
    const cached = getCached<{ data: string; contentType: string }>(cacheKey);
    if (cached) {
      const base64Data = cached.data.split(',')[1];
      return new NextResponse(Buffer.from(base64Data, 'base64'), {
        headers: { 'Content-Type': cached.contentType, 'Cache-Control': 'public, max-age=31536000, immutable' },
      });
    }
    // Fallback: fetch from settings
    const doc = await db.collection('settings').doc('general').get();
    const data = doc.exists ? doc.data() as Record<string, any> : null;
    const url = data?.[asset === 'logo' ? 'logoUrl' : 'signatureUrl'];
    if (!url) return new NextResponse('Not found', { status: 404 });
    setCache(cacheKey, { data: url, contentType: url.split(';')[0].split(':')[1] || 'image/png' });
    const base64Data = url.split(',')[1];
    return new NextResponse(Buffer.from(base64Data, 'base64'), {
      headers: { 'Content-Type': url.split(';')[0].split(':')[1] || 'image/png', 'Cache-Control': 'public, max-age=31536000, immutable' },
    });
  }

  // Serve settings (with cache)
  const cached = getCached(SETTINGS_CACHE_KEY);
  if (cached) return NextResponse.json(cached);

  const doc = await db.collection('settings').doc('general').get();

  if (!doc.exists) {
    const defaults = {
      name: 'Amoora Couture',
      address: 'Jl. Kaliurang, Tambakan, Sinduharjo, Kec. Sleman, Kabupaten Sleman, DIY 55581',
      phone: '0813-9201-3855',
      email: 'hello@amooracouture.com',
      signerName: 'Amoora Admin',
      defaultNotes: 'Pembayaran dapat ditransfer ke rekening BCA 1234567890 a.n Amoora Couture.',
      logoUrl: '',
      signatureUrl: '',
      updatedAt: new Date().toISOString(),
    };
    await db.collection('settings').doc('general').set(defaults);
    const result = { id: 'general', ...defaults };
    setCache(SETTINGS_CACHE_KEY, result);
    return NextResponse.json(result);
  }

  const data = serializeTimestamps({ id: doc.id, ...doc.data() });

  // Cache logo/signature separately
  const rawData = doc.data() as Record<string, any>;
  if (rawData.logoUrl) setCache(LOGO_CACHE_KEY, { data: rawData.logoUrl, contentType: rawData.logoUrl.split(';')[0].split(':')[1] || 'image/png' });
  if (rawData.signatureUrl) setCache(SIGNATURE_CACHE_KEY, { data: rawData.signatureUrl, contentType: rawData.signatureUrl.split(';')[0].split(':')[1] || 'image/png' });

  setCache(SETTINGS_CACHE_KEY, data);
  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const authUser = getAuthUser(request.headers);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  const updates: Record<string, any> = { updatedAt: new Date() };
  const fieldMap = ['name', 'address', 'phone', 'email', 'signerName', 'defaultNotes', 'logoUrl', 'signatureUrl'];
  for (const field of fieldMap) {
    if (body[field] !== undefined) updates[field] = body[field];
  }

  const doc = await db.collection('settings').doc('general').get();

  if (doc.exists) {
    await db.collection('settings').doc('general').update(updates);
  } else {
    await db.collection('settings').doc('general').set(updates);
  }

  // Invalidate all caches
  invalidateCache(SETTINGS_CACHE_KEY);
  if (body.logoUrl !== undefined) invalidateCache(LOGO_CACHE_KEY);
  if (body.signatureUrl !== undefined) invalidateCache(SIGNATURE_CACHE_KEY);

  const updated = await db.collection('settings').doc('general').get();
  const data = serializeTimestamps({ id: updated.id, ...updated.data() });

  // Re-cache logo/signature if updated
  if (body.logoUrl) setCache(LOGO_CACHE_KEY, { data: body.logoUrl, contentType: body.logoUrl.split(';')[0].split(':')[1] || 'image/png' });
  if (body.signatureUrl) setCache(SIGNATURE_CACHE_KEY, { data: body.signatureUrl, contentType: body.signatureUrl.split(';')[0].split(':')[1] || 'image/png' });

  setCache(SETTINGS_CACHE_KEY, data);
  return NextResponse.json(data);
}
