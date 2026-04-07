import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { products } from '@/db/schema';
import { getAuthUser } from '@/lib/auth';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authUser = getAuthUser(request.headers);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const [product] = await db.update(products)
    .set({
      ...(body.name !== undefined && { name: body.name }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.price !== undefined && { price: Number(body.price) }),
      ...(body.unit !== undefined && { unit: body.unit }),
    })
    .where(eq(products.id, id))
    .returning();

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
  await db.delete(products).where(eq(products.id, id));
  return NextResponse.json({ message: 'Produk berhasil dihapus' });
}
