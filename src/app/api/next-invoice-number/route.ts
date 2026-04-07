import { NextRequest, NextResponse } from 'next/server';
import { sql, desc } from 'drizzle-orm';
import { db } from '@/db';
import { invoices } from '@/db/schema';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const authUser = getAuthUser(request.headers);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const year = new Date().getFullYear();

  // Get latest invoice number for this year
  const result = await db.select({ invoiceNo: invoices.invoiceNo })
    .from(invoices)
    .where(sql`${invoices.invoiceNo} LIKE ${`INV%/${year}%`}`)
    .orderBy(desc(invoices.createdAt))
    .limit(1);

  let nextNum = 1;
  if (result.length > 0) {
    const match = result[0].invoiceNo.match(/INV(\d+)/);
    if (match) nextNum = parseInt(match[1]) + 1;
  }

  const invoiceNo = `INV${nextNum.toString().padStart(2, '0')}/${year}`;
  return NextResponse.json({ invoiceNo });
}
