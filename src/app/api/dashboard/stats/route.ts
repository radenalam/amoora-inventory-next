import { NextRequest, NextResponse } from 'next/server';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { invoices, invoiceItems } from '@/db/schema';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const authUser = getAuthUser(request.headers);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get all invoices with their items for dashboard stats
  const allInvoices = await db.select().from(invoices).orderBy(invoices.date);
  const allItems = await db.select().from(invoiceItems);

  const openInvoices = allInvoices.filter(i => i.status === 'draft' || i.status === 'issued');
  const paidInvoices = allInvoices.filter(i => i.status === 'paid');
  const pendingInvoices = allInvoices.filter(i => i.status === 'issued');

  // Product sales from items
  const productSales: Record<string, number> = {};
  allItems.forEach(item => {
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
    totalAmount: allInvoices.reduce((s, i) => s + i.total, 0),
    openCount: openInvoices.length,
    openTotal: openInvoices.reduce((s, i) => s + i.total, 0),
    paidCount: paidInvoices.length,
    paidTotal: paidInvoices.reduce((s, i) => s + i.total, 0),
    pendingCount: pendingInvoices.length,
    pendingTotal: pendingInvoices.reduce((s, i) => s + i.total, 0),
    topProducts,
    recentInvoices: allInvoices.slice(-4).reverse(),
  });
}
