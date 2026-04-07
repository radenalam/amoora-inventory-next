import { NextRequest, NextResponse } from 'next/server';
import { eq, and, or, like, desc, sql, count as countFn } from 'drizzle-orm';
import { db } from '@/db';
import { invoices, invoiceItems } from '@/db/schema';
import { getAuthUser } from '@/lib/auth';

// GET /api/invoices/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = getAuthUser(request.headers);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
  if (!invoice) {
    return NextResponse.json({ error: 'Invoice tidak ditemukan' }, { status: 404 });
  }

  const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, id));

  return NextResponse.json({ ...invoice, items });
}

// PUT /api/invoices/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = getAuthUser(request.headers);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { items, discountType, discountValue, taxType, taxValue, shipping, downPayment, ...rest } = body;

  // If items provided, recalculate and replace
  if (items) {
    const calculatedItems = items.map((item: any) => ({
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

    await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));
    if (calculatedItems.length > 0) {
      await db.insert(invoiceItems).values(calculatedItems.map((item: any) => ({ ...item, invoiceId: id })));
    }

    const [updated] = await db.update(invoices)
      .set({
        ...rest,
        date: rest.date ? new Date(rest.date) : undefined,
        dueDate: rest.dueDate ? new Date(rest.dueDate) : null,
        subtotal,
        total,
      })
      .where(eq(invoices.id, id))
      .returning();

    const newItems = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, id));
    return NextResponse.json({ ...updated, items: newItems });
  }

  const [updated] = await db.update(invoices)
    .set({
      ...(rest.invoiceNo !== undefined && { invoiceNo: rest.invoiceNo }),
      ...(rest.date !== undefined && { date: new Date(rest.date) }),
      ...(rest.dueDate !== undefined && { dueDate: rest.dueDate ? new Date(rest.dueDate) : null }),
      ...(rest.poNumber !== undefined && { poNumber: rest.poNumber || null }),
      ...(rest.paymentMethod !== undefined && { paymentMethod: rest.paymentMethod }),
      ...(rest.invoiceFor !== undefined && { invoiceFor: rest.invoiceFor }),
      ...(rest.payableTo !== undefined && { payableTo: rest.payableTo }),
      ...(rest.customerAddress !== undefined && { customerAddress: rest.customerAddress }),
      ...(rest.customerPhone !== undefined && { customerPhone: rest.customerPhone }),
      ...(rest.notes !== undefined && { notes: rest.notes }),
      ...(rest.status !== undefined && { status: rest.status }),
      ...(rest.subtotal !== undefined && { subtotal: rest.subtotal }),
      ...(rest.total !== undefined && { total: rest.total }),
      ...(discountType !== undefined && { discountType }),
      ...(discountValue !== undefined && { discountValue }),
      ...(taxType !== undefined && { taxType }),
      ...(taxValue !== undefined && { taxValue }),
      ...(shipping !== undefined && { shipping }),
      ...(downPayment !== undefined && { downPayment }),
    })
    .where(eq(invoices.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: 'Invoice tidak ditemukan' }, { status: 404 });
  }

  const invItems = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, id));
  return NextResponse.json({ ...updated, items: invItems });
}

// DELETE /api/invoices/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = getAuthUser(request.headers);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));
  await db.delete(invoices).where(eq(invoices.id, id));
  return NextResponse.json({ message: 'Invoice berhasil dihapus' });
}
