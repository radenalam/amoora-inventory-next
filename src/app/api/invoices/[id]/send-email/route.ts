import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { getById, queryByField, create } from '@/lib/firestore';
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

    const invoice = await getById('invoices', id);
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice tidak ditemukan' }, { status: 404 });
    }

    const items = await queryByField('invoiceItems', 'invoiceId', '==', id);
    
    const settingsDoc = await db.collection('settings').doc('general').get();
    const storeSettings = settingsDoc.exists ? settingsDoc.data() : null;

    const clientList = await queryByField('clients', 'name', '==', (invoice as any).invoiceFor);
    const recipientEmail = clientList.length > 0 ? (clientList[0] as any).email : '';

    if (!recipientEmail) {
      return NextResponse.json({ error: 'Email client tidak ditemukan. Pastikan client sudah memiliki email.' }, { status: 400 });
    }

    const inv = invoice as any;
    const html = generateInvoiceEmailHtml({
      invoiceNo: inv.invoiceNo,
      invoiceFor: inv.invoiceFor,
      customerAddress: inv.customerAddress,
      customerPhone: inv.customerPhone,
      date: inv.date,
      dueDate: inv.dueDate,
      items: items as any,
      subtotal: inv.subtotal,
      discountType: inv.discountType as 'nominal' | 'percent',
      discountValue: inv.discountValue,
      taxType: inv.taxType as 'nominal' | 'percent',
      taxValue: inv.taxValue,
      shipping: inv.shipping,
      downPayment: inv.downPayment,
      total: inv.total,
      notes: inv.notes,
      storeName: storeSettings?.name || 'Amoora Couture',
      storeAddress: storeSettings?.address || '',
      storePhone: storeSettings?.phone || '',
      storeEmail: storeSettings?.email || '',
      signerName: storeSettings?.signerName || '',
    });

    const subject = `Invoice ${inv.invoiceNo} - ${storeSettings?.name || 'Amoora Couture'}`;

    const result = await sendEmail({ to: recipientEmail, subject, html });

    await create('emailLogs', {
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
