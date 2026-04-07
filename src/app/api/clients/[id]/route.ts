import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { clients } from '@/db/schema';
import { getAuthUser } from '@/lib/auth';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authUser = getAuthUser(request.headers);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const [client] = await db.update(clients)
    .set({
      ...(body.name !== undefined && { name: body.name }),
      ...(body.email !== undefined && { email: body.email }),
      ...(body.phone !== undefined && { phone: body.phone }),
      ...(body.address !== undefined && { address: body.address }),
      ...(body.notes !== undefined && { notes: body.notes }),
    })
    .where(eq(clients.id, id))
    .returning();

  if (!client) return NextResponse.json({ error: 'Client tidak ditemukan' }, { status: 404 });
  return NextResponse.json(client);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authUser = getAuthUser(request.headers);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await db.delete(clients).where(eq(clients.id, id));
  return NextResponse.json({ message: 'Client berhasil dihapus' });
}
