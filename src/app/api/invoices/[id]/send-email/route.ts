import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { invoices, invoiceItems, settings, emailLogs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getTokenFromHeaders } from '@/lib/utils';
import jwt from 'jsonwebtoken';
import { sendEmail } from '@/lib/email';
import { generateInvoiceEmailHtml } from '@/lib/email-template';

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

    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, id),
      with: { items: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice tidak ditemukan' }, { status: 404 });
    }

    const [storeSettings] = await db.select().from(settings).limit(1);

    // Get recipient email - try invoice customer phone field repurposed or client email
    // We'll use the customerPhone field pattern or check if there's a linked client
    let recipientEmail = '';

    // Check if invoice has a linked client by matching invoiceFor to client name
    const { clients } = await import('@/db/schema');
    const clientList = await db.select().from(clients);
    const matchedClient = clientList.find(c => c.name === invoice.invoiceFor);
    if (matchedClient?.email) {
      recipientEmail = matchedClient.email;
    }

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
      items: invoice.items,
      subtotal: invoice.subtotal,
      discountType: invoice.discountType,
      discountValue: invoice.discountValue,
      taxType: invoice.taxType,
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

    // Send email
    const result = await sendEmail({
      to: recipientEmail,
      subject,
      html,
    });

    // Log email
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
