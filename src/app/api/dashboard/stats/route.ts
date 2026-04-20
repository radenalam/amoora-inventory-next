import { NextResponse } from 'next/server';
import { db } from '@/db';
import { invoices, invoiceItems, clients, products } from '@/db/schema';
import { sql, eq, and, gte, lte } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: Request) {
  const authUser = getAuthUser(request.headers as any);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalInvoices] = await db.select({ count: sql<number>`count(*)::int` }).from(invoices);
  const [totalRevenue] = await db.select({ total: sql<string>`COALESCE(SUM(${invoices.total}::numeric), 0)` }).from(invoices);
  const [totalClients] = await db.select({ count: sql<number>`count(*)::int` }).from(clients);
  const [totalProducts] = await db.select({ count: sql<number>`count(*)::int` }).from(products);
  const [monthRevenue] = await db.select({ total: sql<string>`COALESCE(SUM(${invoices.total}::numeric), 0)` })
    .from(invoices).where(gte(invoices.createdAt, startOfMonth));
  const [pendingInvoices] = await db.select({ count: sql<number>`count(*)::int` })
    .from(invoices).where(eq(invoices.status, 'pending'));

  return NextResponse.json({
    totalInvoices: totalInvoices.count,
    totalRevenue: totalRevenue.total,
    totalClients: totalClients.count,
    totalProducts: totalProducts.count,
    monthRevenue: monthRevenue.total,
    pendingInvoices: pendingInvoices.count,
  });
}
