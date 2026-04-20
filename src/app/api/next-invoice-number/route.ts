import { NextResponse } from 'next/server';
import { db } from '@/db';
import { invoices } from '@/db/schema';
import { sql, desc } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: Request) {
  const authUser = getAuthUser(request.headers as any);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // Get latest invoice number for current year
  const [result] = await db.select({ invoiceNo: invoices.invoiceNo })
    .from(invoices)
    .where(sql`${invoices.invoiceNo} LIKE ${`INV%/${year}%`}`)
    .orderBy(desc(invoices.invoiceNo))
    .limit(1);

  let nextNum = 1;
  if (result?.invoiceNo) {
    const match = result.invoiceNo.match(/\/(\d+)\s*$/);
    if (match) nextNum = parseInt(match[1]) + 1;
  }

  const no = `INV${String(month).padStart(2, '0')}/${year}${String(nextNum).padStart(4, '0')}`;

  return NextResponse.json({ invoiceNo: no });
}
