import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { clients } from '@/db/schema';
import { eq, ilike, sql, desc } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const authUser = getAuthUser(request.headers);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';
  const offset = (page - 1) * limit;

  const conditions = search ? ilike(clients.name, `%${search}%`) : undefined;

  const [data, countResult] = await Promise.all([
    db.select().from(clients).where(conditions).orderBy(desc(clients.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(clients).where(conditions),
  ]);

  const total = countResult[0].count;

  return NextResponse.json({
    data: data.map(c => ({ ...c, createdAt: c.createdAt?.toISOString(), updatedAt: c.updatedAt?.toISOString() })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function POST(request: NextRequest) {
  const authUser = getAuthUser(request.headers);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { name, email, phone, address, notes } = body;

  if (!name) return NextResponse.json({ error: 'Nama client wajib diisi' }, { status: 400 });

  const [client] = await db.insert(clients).values({ name, email: email || '', phone: phone || '', address: address || '', notes: notes || '' }).returning();

  return NextResponse.json({ ...client, createdAt: client.createdAt?.toISOString(), updatedAt: client.updatedAt?.toISOString() }, { status: 201 });
}
