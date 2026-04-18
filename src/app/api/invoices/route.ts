import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { snapshotToArray, create, queryByField, getOneByField, getById } from '@/lib/firestore';
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

  let query: FirebaseFirestore.Query = db.collection('invoices').orderBy('date', 'desc');

  if (status && status !== 'all') {
    query = query.where('status', '==', status);
  }

  // Firestore doesn't support LIKE — filter in-memory for search
  const snapshot = await query.get();
  let allInvoices = snapshotToArray(snapshot);

  if (search) {
    const s = search.toLowerCase();
    allInvoices = allInvoices.filter((inv: any) =>
      (inv.invoiceNo || '').toLowerCase().includes(s) ||
      (inv.invoiceFor || '').toLowerCase().includes(s)
    );
  }

  const total = allInvoices.length;
  const totalPages = Math.ceil(total / limit);
  const paginatedInvoices = allInvoices.slice((page - 1) * limit, page * limit);

  // Fetch items for these invoices
  const invoicesWithItems = await Promise.all(
    paginatedInvoices.map(async (inv: any) => {
      const items = await queryByField('invoiceItems', 'invoiceId', '==', inv.id);
      return { ...inv, items };
    })
  );

  return NextResponse.json({
    invoices: invoicesWithItems,
    pagination: { page, limit, total, totalPages },
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

  // If clientId provided, fetch client data
  let clientData: Record<string, any> | null = null;
  if (rest.clientId) {
    clientData = await getById('clients', rest.clientId);
  }

  // Auto-create client if invoiceFor is set but no clientId
  if (rest.invoiceFor && !rest.clientId) {
    const existingClient = await getOneByField('clients', 'name', '==', rest.invoiceFor);
    if (existingClient) {
      clientData = existingClient;
      rest.clientId = existingClient.id;
    } else {
      const newClient = await create('clients', {
        name: rest.invoiceFor,
        email: rest.customerEmail || '',
        phone: rest.customerPhone || '',
        address: rest.customerAddress || '',
      });
      clientData = newClient;
      rest.clientId = newClient.id;
    }
  }

  const invoice = await create('invoices', {
    ...rest,
    invoiceFor: clientData?.name || rest.invoiceFor,
    customerAddress: clientData?.address || rest.customerAddress || '',
    customerPhone: clientData?.phone || rest.customerPhone || '',
    customerEmail: clientData?.email || rest.customerEmail || '',
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
  });

  // Create invoice items
  if (calculatedItems.length > 0) {
    const batch = db.batch();
    for (const item of calculatedItems) {
      const ref = db.collection('invoiceItems').doc();
      batch.set(ref, {
        ...item,
        invoiceId: invoice.id,
        createdAt: new Date(),
      });
    }
    await batch.commit();
  }

  const createdItems = await queryByField('invoiceItems', 'invoiceId', '==', invoice.id);

  return NextResponse.json({ ...invoice, items: createdItems }, { status: 201 });
}
