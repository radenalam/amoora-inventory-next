import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { products } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';
import { updateProductSchema } from '@/lib/validations';

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
  const parsed = updateProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validasi gagal', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { name, description, price, unit } = parsed.data;
  const [updated] = await db.update(products).set({
    name,
    description,
    price: price !== undefined ? String(price) : undefined,
    unit,
    updatedAt: new Date(),
  }).where(eq(products.id, id)).returning();
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
