import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/firebase';
import { getOneByField, create } from '@/lib/firestore';
import { generateToken, verifyToken, getAuthUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, name, email, password } = body;

    if (action === 'register') {
      if (!name || !email || !password) {
        return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 });
      }

      const existing = await getOneByField('users', 'email', '==', email);
      if (existing) {
        return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 409 });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await create('users', { name, email, password: hashedPassword });
      const token = generateToken(user.id, user.email);

      return NextResponse.json({
        token,
        user: { id: user.id, name: user.name, email: user.email },
      }, { status: 201 });
    }

    // Login
    if (!email || !password) {
      return NextResponse.json({ error: 'Email dan password wajib diisi' }, { status: 400 });
    }

    const user = await getOneByField<any>('users', 'email', '==', email);
    if (!user) {
      return NextResponse.json({ error: 'Email atau password salah' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: 'Email atau password salah' }, { status: 401 });
    }

    const token = generateToken(user.id, user.email);

    return NextResponse.json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const authUser = getAuthUser(request.headers);
  if (!authUser) {
    return NextResponse.json({ error: 'Token tidak valid' }, { status: 401 });
  }

  const doc = await db.collection('users').doc(authUser.userId).get();
  if (!doc.exists) {
    return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 401 });
  }

  const data = doc.data();
  return NextResponse.json({ user: { id: doc.id, name: data?.name, email: data?.email } });
}
