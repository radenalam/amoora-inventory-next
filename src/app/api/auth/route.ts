import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema';
import { generateToken, verifyToken, getAuthUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, name, email, password } = body;

    if (action === 'register') {
      if (!name || !email || !password) {
        return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 });
      }

      const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existing.length > 0) {
        return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 409 });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const [user] = await db.insert(users).values({ name, email, password: hashedPassword }).returning();
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

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
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

  const [user] = await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(eq(users.id, authUser.userId)).limit(1);

  if (!user) {
    return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 401 });
  }

  return NextResponse.json({ user });
}
