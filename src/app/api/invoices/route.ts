import { NextRequest, NextResponse } from 'next/server';
import { eq, and, or, like, desc, inArray, count as countFn } from 'drizzle-orm';
import { db } from '@/db';
import { invoices, invoiceItems, clients } from '@/db/schema';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const authUser = getAuthUser(request.headers);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const search = searchParams.get('search');
  const page = Number(searchParams.get('page') || '1');
  const limit = Number(searchParams.get('limit') || '20');

  const conditions = [];
  if (status && status !== 'all') {
    conditions.push(eq(invoices.status, status));
  }
  if (search) {
    conditions.push(
      or(
        like(invoices.invoiceNo, `%${search}%`),
        like(invoices.invoiceFor, `%${search}%`)
      )!
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [allInvoices, totalResult] = await Promise.all([
    db.select().from(invoices)
      .where(where)
      .orderBy(desc(invoices.date))
      .limit(limit)
      .offset((page - 1) * limit),
    db.select({ count: countFn() }).from(invoices).where(where),
  ]);

  const invoiceIds = allInvoices.map(i => i.id);
  const items = invoiceIds.length > 0
    ? await db.select().from(invoiceItems).where(inArray(invoiceItems.invoiceId, invoiceIds))
    : [];

  const invoicesWithItems = allInvoices.map(inv => ({
    ...inv,
    items: items.filter(item => item.invoiceId === inv.id),
  }));

  return NextResponse.json({
    invoices: invoicesWithItems,
    pagination: {
      page,
      limit,
      total: totalResult[0]?.count || 0,
      totalPages: Math.ceil((totalResult[0]?.count || 0) / limit),
    },
  });
}

export async function POST(request: NextRequest) {
  const authUser = getAuthUser(request.headers);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { items, discountType, discountValue, taxType, taxValue, shipping, downPayment, ...rest } = body;

  const calculatedItems = (items || []).map((item: any) => ({
    productId: item.productId || null,
    description: item.description,
    qty: Number(item.qty),
    unitPrice: Number(item.unitPrice),
    total: Number(item.qty) * Number(item.unitPrice),
  }));

  const subtotal = calculatedItems.reduce((sum: number, item: any) => sum + item.total, 0);
  const discountAmount = discountType === 'percent' ? subtotal * (discountValue / 100) : discountValue;
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = taxType === 'percent' ? afterDiscount * (taxValue / 100) : taxValue;
  const total = afterDiscount + taxAmount + (shipping || 0) - (downPayment || 0);

  const [invoice] = await db.insert(invoices).values({
    ...rest,
    date: new Date(rest.date),
    dueDate: rest.dueDate ? new Date(rest.dueDate) : null,
    subtotal,
    discountType: discountType || 'nominal',
    discountValue: discountValue || 0,
    taxType: taxType || 'nominal',
    taxValue: taxValue || 0,
    shipping: shipping || 0,
    downPayment: downPayment || 0,
    total,
  }).returning();

  if (calculatedItems.length > 0) {
    await db.insert(invoiceItems).values(
      calculatedItems.map((item: any) => ({ ...item, invoiceId: invoice.id }))
    );
  }

  const createdItems = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoice.id));

  // Auto-create client in master if not exists
  if (rest.invoiceFor) {
    const existingClient = await db.select().from(clients).where(eq(clients.name, rest.invoiceFor)).limit(1);
    if (existingClient.length === 0) {
      await db.insert(clients).values({
        name: rest.invoiceFor,
        email: rest.customerEmail || '',
        phone: rest.customerPhone || '',
        address: rest.customerAddress || '',
      });
    }
  }

  return NextResponse.json({ ...invoice, items: createdItems }, { status: 201 });
}
