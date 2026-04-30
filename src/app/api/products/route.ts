import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { products } from '@/db/schema';
import { eq, ilike, sql, desc } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';
import { createProductSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  const authUser = getAuthUser(request.headers);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';
  const offset = (page - 1) * limit;

  const conditions = search ? ilike(products.name, `%${search}%`) : undefined;

  const [data, countResult] = await Promise.all([
    db.select().from(products).where(conditions).orderBy(desc(products.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(products).where(conditions),
  ]);

  const total = countResult[0].count;

  return NextResponse.json({
    data: data.map(p => ({ ...p, createdAt: p.createdAt?.toISOString(), updatedAt: p.updatedAt?.toISOString() })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function POST(request: NextRequest) {
  const authUser = getAuthUser(request.headers);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const parsed = createProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validasi gagal', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { name, description, price, unit } = parsed.data;
  const [product] = await db.insert(products).values({
    name, description: description || '', price: String(price || 0), unit: unit || 'pcs',
  }).returning();

  return NextResponse.json({ ...product, createdAt: product.createdAt?.toISOString(), updatedAt: product.updatedAt?.toISOString() }, { status: 201 });
}
