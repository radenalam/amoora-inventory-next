import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { snapshotToArray, queryByField } from '@/lib/firestore';
import { getCached, setCache } from '@/lib/cache';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const authUser = getAuthUser(request.headers);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const invoicesSnapshot = await db.collection('invoices').orderBy('date', 'asc').get();
  const allInvoices = snapshotToArray(invoicesSnapshot);
  const allItems = await queryByField('invoiceItems', 'invoiceId', 'in', allInvoices.map((i: any) => i.id));

  // For 'in' query with many IDs, fetch all items and filter
  const itemsSnapshot = await db.collection('invoiceItems').get();
  const allItemsFiltered = snapshotToArray(itemsSnapshot).filter((item: any) =>
    allInvoices.some((inv: any) => inv.id === item.invoiceId)
  );

  const openInvoices = allInvoices.filter((i: any) => i.status === 'draft' || i.status === 'issued');
  const paidInvoices = allInvoices.filter((i: any) => i.status === 'paid');
  const pendingInvoices = allInvoices.filter((i: any) => i.status === 'issued');

  const productSales: Record<string, number> = {};
  allItemsFiltered.forEach((item: any) => {
    if (item.description) {
      productSales[item.description] = (productSales[item.description] || 0) + item.total;
    }
  });

  const topProducts = Object.entries(productSales)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)
    .map(([name, total]) => ({ name, total }));

  return NextResponse.json({
    totalInvoices: allInvoices.length,
    totalAmount: allInvoices.reduce((s: number, i: any) => s + (i.total || 0), 0),
    openCount: openInvoices.length,
    openTotal: openInvoices.reduce((s: number, i: any) => s + (i.total || 0), 0),
    paidCount: paidInvoices.length,
    paidTotal: paidInvoices.reduce((s: number, i: any) => s + (i.total || 0), 0),
    pendingCount: pendingInvoices.length,
    pendingTotal: pendingInvoices.reduce((s: number, i: any) => s + (i.total || 0), 0),
    topProducts,
    recentInvoices: allInvoices.slice(-4).reverse(),
  });
}
