import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { invoices, invoiceItems, clients } from '@/db/schema';
import { eq, like, sql, desc } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const authUser = getAuthUser(request.headers);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const offset = (page - 1) * limit;

  const conditions: any[] = [];
  if (search) conditions.push(like(invoices.invoiceNo, `%${search}%`));
  if (status) conditions.push(eq(invoices.status, status));

  const whereClause = conditions.length > 0 
    ? conditions.length === 1 ? conditions[0] : sql`${conditions[0]} AND ${conditions[1]}`
    : undefined;

  const [data, countResult] = await Promise.all([
    db.select().from(invoices).where(whereClause).orderBy(desc(invoices.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(invoices).where(whereClause),
  ]);

  const total = countResult[0].count;

  // Get items for each invoice
  const invoiceIds = data.map(inv => inv.id);
  const allItems = invoiceIds.length > 0
    ? await db.select().from(invoiceItems).where(sql`${invoiceItems.invoiceId} = ANY(${invoiceIds})`)
    : [];

  const result = data.map(inv => ({
    ...inv,
    date: inv.date?.toISOString(),
    dueDate: inv.dueDate?.toISOString(),
    createdAt: inv.createdAt?.toISOString(),
    updatedAt: inv.updatedAt?.toISOString(),
    items: allItems.filter(item => item.invoiceId === inv.id).map(item => ({
      ...item,
      createdAt: item.createdAt?.toISOString(),
    })),
  }));

  return NextResponse.json({
    data: result,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function POST(request: NextRequest) {
  const authUser = getAuthUser(request.headers);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { items, discountType, discountValue, taxType, taxValue, shipping, downPayment, clientId, invoiceFor, ...rest } = body;

  // Fetch client data if clientId provided
  let clientName = invoiceFor || '';
  if (clientId && !invoiceFor) {
    const [client] = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
    if (client) clientName = client.name;
  }

  // Auto-create client if invoiceFor provided but no clientId
  let finalClientId = clientId || null;
  if (!clientId && invoiceFor) {
    const [existing] = await db.select().from(clients).where(eq(clients.name, invoiceFor)).limit(1);
    if (existing) {
      finalClientId = existing.id;
    } else {
      const [newClient] = await db.insert(clients).values({ name: invoiceFor }).returning();
      finalClientId = newClient.id;
    }
  }

  const subtotal = (items || []).reduce((s: number, item: any) => s + (Number(item.qty) * Number(item.unitPrice)), 0);
  const discountAmount = discountType === 'percent' ? subtotal * (Number(discountValue) / 100) : Number(discountValue || 0);
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = taxType === 'percent' ? afterDiscount * (Number(taxValue) / 100) : Number(taxValue || 0);
  const total = afterDiscount + taxAmount + Number(shipping || 0) - Number(downPayment || 0);

  const [invoice] = await db.insert(invoices).values({
    ...rest,
    clientId: finalClientId,
    invoiceFor: clientName,
    date: new Date(rest.date),
    dueDate: rest.dueDate ? new Date(rest.dueDate) : null,
    subtotal: String(subtotal),
    discountType: discountType || 'nominal',
    discountValue: String(discountValue || 0),
    taxType: taxType || 'nominal',
    taxValue: String(taxValue || 0),
    shipping: String(shipping || 0),
    downPayment: String(downPayment || 0),
    total: String(total),
  }).returning();

  // Create invoice items
  if (items && items.length > 0) {
    const itemValues = items.map((item: any) => ({
      invoiceId: invoice.id,
      productId: item.productId || null,
      description: item.description,
      qty: String(Number(item.qty)),
      unitPrice: String(Number(item.unitPrice)),
      total: String(Number(item.qty) * Number(item.unitPrice)),
    }));
    await db.insert(invoiceItems).values(itemValues);
  }

  return NextResponse.json({
    ...invoice,
    date: invoice.date?.toISOString(),
    dueDate: invoice.dueDate?.toISOString(),
    createdAt: invoice.createdAt?.toISOString(),
    updatedAt: invoice.updatedAt?.toISOString(),
  }, { status: 201 });
}
