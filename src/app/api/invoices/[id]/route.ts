import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { getById, update, remove, queryByField } from '@/lib/firestore';
import { getAuthUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = getAuthUser(request.headers);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const invoice = await getById('invoices', id);
  if (!invoice) {
    return NextResponse.json({ error: 'Invoice tidak ditemukan' }, { status: 404 });
  }

  const items = await queryByField('invoiceItems', 'invoiceId', '==', id);
  return NextResponse.json({ ...invoice, items });
}

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

    // Delete existing items
    const existingItems = await queryByField('invoiceItems', 'invoiceId', '==', id);
    const batch = db.batch();
    for (const item of existingItems) {
      batch.delete(db.collection('invoiceItems').doc(item.id));
    }
    // Create new items
    for (const item of calculatedItems) {
      const ref = db.collection('invoiceItems').doc();
      batch.set(ref, { ...item, invoiceId: id, createdAt: new Date() });
    }
    await batch.commit();

    const updates: Record<string, any> = {
      subtotal,
      total,
      discountType: discountType || 'nominal',
      discountValue: discountValue || 0,
      taxType: taxType || 'nominal',
      taxValue: taxValue || 0,
      shipping: shipping || 0,
      downPayment: downPayment || 0,
      ...rest,
    };
    if (updates.date) updates.date = new Date(updates.date);
    if (updates.dueDate) updates.dueDate = new Date(updates.dueDate);

    const updated = await update('invoices', id, updates);
    const newItems = await queryByField('invoiceItems', 'invoiceId', '==', id);
    return NextResponse.json({ ...updated, items: newItems });
  }

  const updates: Record<string, any> = {};
  const fieldMap: Record<string, string> = {
    invoiceNo: 'invoiceNo', date: 'date', dueDate: 'dueDate', poNumber: 'poNumber',
    paymentMethod: 'paymentMethod', invoiceFor: 'invoiceFor', payableTo: 'payableTo',

    notes: 'notes', status: 'status', subtotal: 'subtotal', total: 'total',
    discountType: 'discountType', discountValue: 'discountValue',
    taxType: 'taxType', taxValue: 'taxValue', shipping: 'shipping', downPayment: 'downPayment',
  };

  for (const [key, field] of Object.entries(fieldMap)) {
    if (rest[key] !== undefined) {
      updates[field] = (key === 'date' || key === 'dueDate') ? new Date(rest[key]) : rest[key];
    }
  }

  const updated = await update('invoices', id, updates);
  if (!updated) {
    return NextResponse.json({ error: 'Invoice tidak ditemukan' }, { status: 404 });
  }

  const invItems = await queryByField('invoiceItems', 'invoiceId', '==', id);
  return NextResponse.json({ ...updated, items: invItems });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = getAuthUser(request.headers);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const existingItems = await queryByField('invoiceItems', 'invoiceId', '==', id);
  const batch = db.batch();
  for (const item of existingItems) {
    batch.delete(db.collection('invoiceItems').doc(item.id));
  }
  batch.delete(db.collection('invoices').doc(id));
  await batch.commit();

  return NextResponse.json({ message: 'Invoice berhasil dihapus' });
}
