import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { settings } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const authUser = getAuthUser(request.headers);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [s] = await db.select().from(settings).limit(1);
  if (!s) {
    // Create default settings
    const [created] = await db.insert(settings).values({ name: 'Amoora Couture' }).returning();
    return NextResponse.json({ ...created, updatedAt: created.updatedAt?.toISOString() });
  }
  return NextResponse.json({ ...s, updatedAt: s.updatedAt?.toISOString() });
}

export async function PUT(request: NextRequest) {
  const authUser = getAuthUser(request.headers);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { id, createdAt, updatedAt, ...updateData } = body;

  // Check if settings row exists
  const [existing] = await db.select().from(settings).limit(1);
  if (existing) {
    const [updated] = await db.update(settings).set({ ...updateData, updatedAt: new Date() }).where(eq(settings.id, existing.id)).returning();
    return NextResponse.json({ ...updated, updatedAt: updated.updatedAt?.toISOString() });
  } else {
    const [created] = await db.insert(settings).values(updateData).returning();
    return NextResponse.json({ ...created, updatedAt: created.updatedAt?.toISOString() });
  }
}
