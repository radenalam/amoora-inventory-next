import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { snapshotToArray, create } from '@/lib/firestore';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const authUser = getAuthUser(request.headers);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const snapshot = await db.collection('products').orderBy('createdAt', 'asc').get();
  const allProducts = snapshotToArray(snapshot);

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

  const product = await create('products', {
    name,
    description: description || '',
    price: Number(price),
    unit: unit || 'pcs',
  });

  return NextResponse.json(product, { status: 201 });
}
