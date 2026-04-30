import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { invoices, invoiceItems, clients } from '@/db/schema';
import { eq, ilike, sql, desc, inArray } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';
import { createInvoiceSchema } from '@/lib/validations/invoice';

export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request.headers);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const offset = (page - 1) * limit;

    const conditions: any[] = [];
    if (search) conditions.push(ilike(invoices.invoiceNo, `%${search}%`));
    if (status) conditions.push(eq(invoices.status, status));

    const whereClause = conditions.length > 0
      ? conditions.length === 1 ? conditions[0] : sql`${conditions[0]} AND ${conditions[1]}`
      : undefined;

    const [data, countResult] = await Promise.all([
      db.select().from(invoices).where(whereClause).orderBy(desc(invoices.createdAt)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(invoices).where(whereClause),
    ]);

    const total = countResult[0].count;

    const invoiceIds = data.map(inv => inv.id);
    const allItems = invoiceIds.length > 0
      ? await db.select().from(invoiceItems).where(inArray(invoiceItems.invoiceId, invoiceIds))
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
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal memuat invoice' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request.headers);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const parsed = createInvoiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validasi gagal', details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

  const { items, discountType, discountValue, taxType, taxValue, shipping, downPayment, clientId, invoiceFor, invoiceNo, date, dueDate, poNumber, paymentMethod, notes } = parsed.data;

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

  const subtotal = items.reduce((s, item) => s + (item.qty * item.unitPrice), 0);
  const discountAmount = discountType === 'percent' ? subtotal * ((discountValue ?? 0) / 100) : (discountValue ?? 0);
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = taxType === 'percent' ? afterDiscount * ((taxValue ?? 0) / 100) : (taxValue ?? 0);
  const total = afterDiscount + taxAmount + (shipping ?? 0) - (downPayment ?? 0);

  const [invoice] = await db.insert(invoices).values({
    invoiceNo,
    clientId: finalClientId,
    invoiceFor: clientName,
    date: new Date(date),
    dueDate: dueDate ? new Date(dueDate) : null,
    poNumber: poNumber ?? '',
    paymentMethod: paymentMethod ?? 'Bank',
    notes: notes ?? '',
    status: 'draft',
    subtotal: String(subtotal),
    discountType: discountType ?? 'nominal',
    discountValue: String(discountValue ?? 0),
    taxType: taxType ?? 'nominal',
    taxValue: String(taxValue ?? 0),
    shipping: String(shipping ?? 0),
    downPayment: String(downPayment ?? 0),
    total: String(total),
  }).returning();

  const itemValues = items.map((item) => ({
    invoiceId: invoice.id,
    productId: item.productId ?? null,
    description: item.description,
    qty: String(item.qty),
    unitPrice: String(item.unitPrice),
    total: String(item.qty * item.unitPrice),
  }));
  await db.insert(invoiceItems).values(itemValues);

  return NextResponse.json({
    ...invoice,
    date: invoice.date?.toISOString(),
    dueDate: invoice.dueDate?.toISOString(),
    createdAt: invoice.createdAt?.toISOString(),
    updatedAt: invoice.updatedAt?.toISOString(),
  }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal membuat invoice' }, { status: 500 });
  }
}
