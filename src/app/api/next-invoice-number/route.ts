import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { snapshotToArray } from '@/lib/firestore';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const authUser = getAuthUser(request.headers);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const year = new Date().getFullYear();
  const snapshot = await db.collection('invoices').orderBy('createdAt', 'desc').get();
  const allInvoices = snapshotToArray<any>(snapshot);

  let nextNum = 1;
  const yearInvoices = allInvoices.filter((inv: any) =>
    inv.invoiceNo && inv.invoiceNo.includes(`/${year}`)
  );

  if (yearInvoices.length > 0) {
    const match = yearInvoices[0].invoiceNo.match(/INV(\d+)/);
    if (match) nextNum = parseInt(match[1]) + 1;
  }

  const invoiceNo = `INV${nextNum.toString().padStart(2, '0')}/${year}`;
  return NextResponse.json({ invoiceNo });
}
