import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { settings } from '@/db/schema';
import { getAuthUser } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const authUser = getAuthUser(request.headers);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [current] = await db.select().from(settings).limit(1);

  if (!current) {
    const [created] = await db.insert(settings).values({
      name: 'Amoora Couture',
      address: 'Jl. Kaliurang, Tambakan, Sinduharjo, Kec. Sleman, Kabupaten Sleman, DIY 55581',
      phone: '0813-9201-3855',
      email: 'hello@amooracouture.com',
      signerName: 'Amoora Admin',
      defaultNotes: 'Pembayaran dapat ditransfer ke rekening BCA 1234567890 a.n Amoora Couture. Terima kasih atas kepercayaan Anda.',
    }).returning();
    return NextResponse.json(created);
  }

  return NextResponse.json(current);
}

export async function PUT(request: NextRequest) {
  const authUser = getAuthUser(request.headers);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  // Check if settings exist
  const [existing] = await db.select().from(settings).limit(1);

  if (existing) {
    const [updated] = await db.update(settings)
      .set({
        ...(body.name !== undefined && { name: body.name }),
        ...(body.address !== undefined && { address: body.address }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.email !== undefined && { email: body.email }),
        ...(body.signerName !== undefined && { signerName: body.signerName }),
        ...(body.defaultNotes !== undefined && { defaultNotes: body.defaultNotes }),
        ...(body.logoUrl !== undefined && { logoUrl: body.logoUrl }),
        ...(body.signatureUrl !== undefined && { signatureUrl: body.signatureUrl }),
      })
      .where(eq(settings.id, existing.id))
      .returning();
    return NextResponse.json(updated);
  }

  const [created] = await db.insert(settings).values({
    name: body.name || 'Amoora Couture',
    address: body.address || '',
    phone: body.phone || '',
    email: body.email || '',
    signerName: body.signerName || '',
    defaultNotes: body.defaultNotes || '',
    logoUrl: body.logoUrl || '',
    signatureUrl: body.signatureUrl || '',
  }).returning();

  return NextResponse.json(created);
}


