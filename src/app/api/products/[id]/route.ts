import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { products } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authUser = getAuthUser(request.headers);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!product) return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });

  return NextResponse.json({ ...product, createdAt: product.createdAt?.toISOString(), updatedAt: product.updatedAt?.toISOString() });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authUser = getAuthUser(request.headers);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const updateData: any = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.price !== undefined) updateData.price = String(body.price);
  if (body.unit !== undefined) updateData.unit = body.unit;

  const [updated] = await db.update(products).set({ ...updateData, updatedAt: new Date() }).where(eq(products.id, id)).returning();
  if (!updated) return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });

  return NextResponse.json({ ...updated, createdAt: updated.createdAt?.toISOString(), updatedAt: updated.updatedAt?.toISOString() });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authUser = getAuthUser(request.headers);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await db.delete(products).where(eq(products.id, id));
  return NextResponse.json({ message: 'Produk berhasil dihapus' });
}
