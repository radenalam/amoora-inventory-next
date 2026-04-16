import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { snapshotToArray, create } from '@/lib/firestore';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const authUser = getAuthUser(request.headers);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const snapshot = await db.collection('clients').orderBy('updatedAt', 'desc').get();
  const allClients = snapshotToArray(snapshot);
  return NextResponse.json(allClients);
}

export async function POST(request: NextRequest) {
  const authUser = getAuthUser(request.headers);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { name, email, phone, address, notes } = body;

  if (!name) return NextResponse.json({ error: 'Nama wajib diisi' }, { status: 400 });

  const client = await create('clients', {
    name,
    email: email || '',
    phone: phone || '',
    address: address || '',
    notes: notes || '',
  });

  return NextResponse.json(client, { status: 201 });
}
