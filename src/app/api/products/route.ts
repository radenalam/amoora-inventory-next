import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { products } from '@/db/schema';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const authUser = getAuthUser(request.headers);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const allProducts = await db.select().from(products).orderBy(products.createdAt);
  return NextResponse.json(allProducts);
}

export async function POST(request: NextRequest) {
  const authUser = getAuthUser(request.headers);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { name, description, price, unit } = body;

  if (!name || price === undefined) {
    return NextResponse.json({ error: 'Nama dan harga wajib diisi' }, { status: 400 });
  }

  const [product] = await db.insert(products).values({
    name,
    description: description || '',
    price: Number(price),
    unit: unit || 'pcs',
  }).returning();

  return NextResponse.json(product, { status: 201 });
}
