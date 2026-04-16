import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const authUser = getAuthUser(request.headers);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const doc = await db.collection('settings').doc('general').get();

  if (!doc.exists) {
    // Create default settings
    await db.collection('settings').doc('general').set({
      name: 'Amoora Couture',
      address: 'Jl. Kaliurang, Tambakan, Sinduharjo, Kec. Sleman, Kabupaten Sleman, DIY 55581',
      phone: '0813-9201-3855',
      email: 'hello@amooracouture.com',
      signerName: 'Amoora Admin',
      defaultNotes: 'Pembayaran dapat ditransfer ke rekening BCA 1234567890 a.n Amoora Couture. Terima kasih atas kepercayaan Anda.',
      logoUrl: '',
      signatureUrl: '',
      updatedAt: new Date(),
    });
    const created = await db.collection('settings').doc('general').get();
    return NextResponse.json({ id: 'general', ...created.data() });
  }

  return NextResponse.json({ id: doc.id, ...doc.data() });
}

export async function PUT(request: NextRequest) {
  const authUser = getAuthUser(request.headers);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  const doc = await db.collection('settings').doc('general').get();

  if (doc.exists) {
    const updates: Record<string, any> = { updatedAt: new Date() };
    if (body.name !== undefined) updates.name = body.name;
    if (body.address !== undefined) updates.address = body.address;
    if (body.phone !== undefined) updates.phone = body.phone;
    if (body.email !== undefined) updates.email = body.email;
    if (body.signerName !== undefined) updates.signerName = body.signerName;
    if (body.defaultNotes !== undefined) updates.defaultNotes = body.defaultNotes;
    if (body.logoUrl !== undefined) updates.logoUrl = body.logoUrl;
    if (body.signatureUrl !== undefined) updates.signatureUrl = body.signatureUrl;

    await db.collection('settings').doc('general').update(updates);
    const updated = await db.collection('settings').doc('general').get();
    return NextResponse.json({ id: updated.id, ...updated.data() });
  }

  // Create if not exists
  await db.collection('settings').doc('general').set({
    name: body.name || 'Amoora Couture',
    address: body.address || '',
    phone: body.phone || '',
    email: body.email || '',
    signerName: body.signerName || '',
    defaultNotes: body.defaultNotes || '',
    logoUrl: body.logoUrl || '',
    signatureUrl: body.signatureUrl || '',
    updatedAt: new Date(),
  });
  const created = await db.collection('settings').doc('general').get();
  return NextResponse.json({ id: created.id, ...created.data() });
}
