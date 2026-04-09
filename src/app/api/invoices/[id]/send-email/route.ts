import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { invoices, invoiceItems, settings, emailLogs, clients } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sendEmail } from '@/lib/email';
import { generateInvoiceEmailHtml } from '@/lib/email-template';
import { getTokenFromHeaders } from '@/lib/utils';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = getTokenFromHeaders(request.headers);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice tidak ditemukan' }, { status: 404 });
    }

    const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, id));
    const [storeSettings] = await db.select().from(settings).limit(1);

    // Find client email by matching invoiceFor to client name
    const clientList = await db.select().from(clients);
    const matchedClient = clientList.find(c => c.name === invoice.invoiceFor);
    const recipientEmail = matchedClient?.email || '';

    if (!recipientEmail) {
      return NextResponse.json({ error: 'Email client tidak ditemukan. Pastikan client sudah memiliki email.' }, { status: 400 });
    }

    const html = generateInvoiceEmailHtml({
      invoiceNo: invoice.invoiceNo,
      invoiceFor: invoice.invoiceFor,
      customerAddress: invoice.customerAddress,
      customerPhone: invoice.customerPhone,
      date: invoice.date,
      dueDate: invoice.dueDate,
      items,
      subtotal: invoice.subtotal,
      discountType: invoice.discountType as 'nominal' | 'percent',
      discountValue: invoice.discountValue,
      taxType: invoice.taxType as 'nominal' | 'percent',
      taxValue: invoice.taxValue,
      shipping: invoice.shipping,
      downPayment: invoice.downPayment,
      total: invoice.total,
      notes: invoice.notes,
      storeName: storeSettings?.name || 'Amoora Couture',
      storeAddress: storeSettings?.address || '',
      storePhone: storeSettings?.phone || '',
      storeEmail: storeSettings?.email || '',
      signerName: storeSettings?.signerName || '',
    });

    const subject = `Invoice ${invoice.invoiceNo} - ${storeSettings?.name || 'Amoora Couture'}`;

    const result = await sendEmail({
      to: recipientEmail,
      subject,
      html,
    });

    await db.insert(emailLogs).values({
      invoiceId: id,
      recipientEmail,
      subject,
      status: result.success ? 'sent' : 'failed',
      errorMessage: result.error || '',
      sentAt: result.success ? new Date() : null,
    });

    if (!result.success) {
      return NextResponse.json({ error: `Gagal kirim email: ${result.error}` }, { status: 500 });
    }

    return NextResponse.json({ message: 'Email berhasil dikirim', recipient: recipientEmail });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Send email error:', message);
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}
