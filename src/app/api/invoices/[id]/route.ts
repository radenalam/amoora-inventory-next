import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { invoices, invoiceItems, clients } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authUser = getAuthUser(request.headers);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
  if (!invoice) return NextResponse.json({ error: 'Invoice tidak ditemukan' }, { status: 404 });

  const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, id));

  // Fetch client data
  let client: Record<string, any> = {};
  if (invoice.clientId) {
    const [c] = await db.select().from(clients).where(eq(clients.id, invoice.clientId)).limit(1);
    if (c) client = c;
  }

  return NextResponse.json({
    ...invoice,
    date: invoice.date?.toISOString(),
    dueDate: invoice.dueDate?.toISOString(),
    createdAt: invoice.createdAt?.toISOString(),
    updatedAt: invoice.updatedAt?.toISOString(),
    client,
    items: items.map(item => ({ ...item, createdAt: item.createdAt?.toISOString() })),
  });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authUser = getAuthUser(request.headers);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { items, discountType, discountValue, taxType, taxValue, shipping, downPayment, clientId, invoiceFor, ...rest } = body;

  // Fetch client data if needed
  let clientName = invoiceFor || rest.invoiceFor;
  if (clientId && !invoiceFor) {
    const [client] = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
    if (client) clientName = client.name;
  }

  let finalClientId = clientId || null;
  if (!clientId && invoiceFor) {
    const [existing] = await db.select().from(clients).where(eq(clients.name, invoiceFor)).limit(1);
    if (existing) finalClientId = existing.id;
    else {
      const [nc] = await db.insert(clients).values({ name: invoiceFor }).returning();
      finalClientId = nc.id;
    }
  }

  const subtotal = (items || []).reduce((s: number, item: any) => s + (Number(item.qty) * Number(item.unitPrice)), 0);
  const discountAmount = discountType === 'percent' ? subtotal * (Number(discountValue) / 100) : Number(discountValue || 0);
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = taxType === 'percent' ? afterDiscount * (Number(taxValue) / 100) : Number(taxValue || 0);
  const total = afterDiscount + taxAmount + Number(shipping || 0) - Number(downPayment || 0);

  const [updated] = await db.update(invoices).set({
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
    updatedAt: new Date(),
  }).where(eq(invoices.id, id)).returning();

  if (!updated) return NextResponse.json({ error: 'Invoice tidak ditemukan' }, { status: 404 });

  // Delete old items and insert new ones
  await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));
  if (items && items.length > 0) {
    await db.insert(invoiceItems).values(items.map((item: any) => ({
      invoiceId: id,
      productId: item.productId || null,
      description: item.description,
      qty: String(Number(item.qty)),
      unitPrice: String(Number(item.unitPrice)),
      total: String(Number(item.qty) * Number(item.unitPrice)),
    })));
  }

  return NextResponse.json({
    ...updated,
    date: updated.date?.toISOString(),
    dueDate: updated.dueDate?.toISOString(),
    createdAt: updated.createdAt?.toISOString(),
    updatedAt: updated.updatedAt?.toISOString(),
  });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authUser = getAuthUser(request.headers);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));
  await db.delete(invoices).where(eq(invoices.id, id));
  return NextResponse.json({ message: 'Invoice berhasil dihapus' });
}
