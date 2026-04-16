import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { update, remove } from '@/lib/firestore';
import { getAuthUser } from '@/lib/auth';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authUser = getAuthUser(request.headers);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const updates: Record<string, any> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.description !== undefined) updates.description = body.description;
  if (body.price !== undefined) updates.price = Number(body.price);
  if (body.unit !== undefined) updates.unit = body.unit;

  const product = await update('products', id, updates);

  if (!product) {
    return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
  }

  return NextResponse.json(product);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authUser = getAuthUser(request.headers);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  await remove('products', id);
  return NextResponse.json({ message: 'Produk berhasil dihapus' });
}
