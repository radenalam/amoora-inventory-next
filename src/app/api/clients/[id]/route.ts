import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { clients } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authUser = getAuthUser(request.headers);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const [client] = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  if (!client) return NextResponse.json({ error: 'Client tidak ditemukan' }, { status: 404 });

  return NextResponse.json({ ...client, createdAt: client.createdAt?.toISOString(), updatedAt: client.updatedAt?.toISOString() });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authUser = getAuthUser(request.headers);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const [updated] = await db.update(clients).set(body).where(eq(clients.id, id)).returning();
  if (!updated) return NextResponse.json({ error: 'Client tidak ditemukan' }, { status: 404 });

  return NextResponse.json({ ...updated, createdAt: updated.createdAt?.toISOString(), updatedAt: updated.updatedAt?.toISOString() });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authUser = getAuthUser(request.headers);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await db.delete(clients).where(eq(clients.id, id));
  return NextResponse.json({ message: 'Client berhasil dihapus' });
}
