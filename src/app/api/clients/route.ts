import { NextRequest, NextResponse } from 'next/server';
import { eq, desc } from 'drizzle-orm';
import { db } from '@/db';
import { clients } from '@/db/schema';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const authUser = getAuthUser(request.headers);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const allClients = await db.select().from(clients).orderBy(desc(clients.updatedAt));
  return NextResponse.json(allClients);
}

export async function POST(request: NextRequest) {
  const authUser = getAuthUser(request.headers);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { name, email, phone, address, notes } = body;

  if (!name) return NextResponse.json({ error: 'Nama wajib diisi' }, { status: 400 });

  const [client] = await db.insert(clients).values({
    name,
    email: email || '',
    phone: phone || '',
    address: address || '',
    notes: notes || '',
  }).returning();

  return NextResponse.json(client, { status: 201 });
}
