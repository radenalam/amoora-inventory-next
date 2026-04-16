import { NextRequest, NextResponse } from 'next/server';
import { update, remove } from '@/lib/firestore';
import { getAuthUser } from '@/lib/auth';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authUser = getAuthUser(request.headers);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const updates: Record<string, any> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.email !== undefined) updates.email = body.email;
  if (body.phone !== undefined) updates.phone = body.phone;
  if (body.address !== undefined) updates.address = body.address;
  if (body.notes !== undefined) updates.notes = body.notes;

  const client = await update('clients', id, updates);
  if (!client) return NextResponse.json({ error: 'Client tidak ditemukan' }, { status: 404 });
  return NextResponse.json(client);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authUser = getAuthUser(request.headers);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await remove('clients', id);
  return NextResponse.json({ message: 'Client berhasil dihapus' });
}
