import { NextResponse } from 'next/server';
import { db } from '@/db';
import { invoices, invoiceItems, products } from '@/db/schema';
import { sql, desc, gte, ne, and, eq } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const authUser = getAuthUser(request.headers as any);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const startOfMonthStr = startOfMonth.toISOString();
    const startOfYearStr = startOfYear.toISOString();

    const [agg, recentInvoices, topProducts, monthlyRevenue] = await Promise.all([
      db.select({
        openCount: sql<number>`COUNT(CASE WHEN ${invoices.status} IN ('draft', 'issued') THEN 1 END)`,
        openTotal: sql<string>`COALESCE(SUM(CASE WHEN ${invoices.status} IN ('draft', 'issued') THEN ${invoices.total}::numeric ELSE 0 END), 0)`,
        paidCount: sql<number>`COUNT(CASE WHEN ${invoices.status} = 'paid' THEN 1 END)`,
        paidTotal: sql<string>`COALESCE(SUM(CASE WHEN ${invoices.status} = 'paid' THEN ${invoices.total}::numeric ELSE 0 END), 0)`,
        pendingCount: sql<number>`COUNT(CASE WHEN ${invoices.status} = 'issued' THEN 1 END)`,
        pendingTotal: sql<string>`COALESCE(SUM(CASE WHEN ${invoices.status} = 'issued' THEN ${invoices.total}::numeric ELSE 0 END), 0)`,
        totalCount: sql<number>`COUNT(*)::int`,
        totalAmount: sql<string>`COALESCE(SUM(${invoices.total}::numeric), 0)`,
        monthRevenue: sql<string>`COALESCE(SUM(CASE WHEN ${invoices.createdAt} >= ${startOfMonthStr}::timestamptz THEN ${invoices.total}::numeric ELSE 0 END), 0)`,
      }).from(invoices),

      db.select({
        id: invoices.id,
        invoiceNo: invoices.invoiceNo,
        invoiceFor: invoices.invoiceFor,
        status: invoices.status,
        total: invoices.total,
        dueDate: invoices.dueDate,
        date: invoices.date,
      }).from(invoices).orderBy(desc(invoices.createdAt)).limit(5),

      db.select({
        name: products.name,
        total: sql<string>`COALESCE(SUM(${invoiceItems.qty}::numeric * ${invoiceItems.unitPrice}::numeric), 0)`,
      })
        .from(invoiceItems)
        .innerJoin(products, eq(invoiceItems.productId, products.id))
        .groupBy(products.name)
        .orderBy(sql`SUM(${invoiceItems.qty}::numeric * ${invoiceItems.unitPrice}::numeric) desc`)
        .limit(5),

      db.select({
        month: sql<string>`TO_CHAR(${invoices.createdAt}, 'Mon')`,
        revenue: sql<string>`COALESCE(SUM(${invoices.total}::numeric), 0)`,
      })
        .from(invoices)
        .where(and(
          gte(invoices.createdAt, startOfYear),
          ne(invoices.status, 'cancelled'),
        ))
        .groupBy(sql`TO_CHAR(${invoices.createdAt}, 'Mon'), EXTRACT(MONTH FROM ${invoices.createdAt})`)
        .orderBy(sql`EXTRACT(MONTH FROM ${invoices.createdAt})`),
    ]);

    const row = agg[0];
    const recent = recentInvoices.map(inv => ({
      ...inv,
      date: inv.date?.toISOString(),
      dueDate: inv.dueDate?.toISOString(),
    }));

    return NextResponse.json({
      openCount: row.openCount,
      openTotal: Number(row.openTotal),
      paidCount: row.paidCount,
      paidTotal: Number(row.paidTotal),
      pendingCount: row.pendingCount,
      pendingTotal: Number(row.pendingTotal),
      totalCount: row.totalCount,
      totalAmount: Number(row.totalAmount),
      monthRevenue: Number(row.monthRevenue),
      recentInvoices: recent,
      topProducts: topProducts.map(p => ({ ...p, total: Number(p.total) })),
      monthlyRevenue: monthlyRevenue.map(m => ({ name: m.month, revenue: Number(m.revenue) })),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal memuat statistik' }, { status: 500 });
  }
}
