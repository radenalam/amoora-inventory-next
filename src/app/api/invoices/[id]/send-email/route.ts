import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { db } from '@/db';
import { invoices, invoiceItems, clients, settings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

function generateInvoiceEmailHtml(inv: any, s: any, cl: any) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invoice ${inv.invoiceNo}</title></head>
  <body style="font-family:Arial,sans-serif;max-width:600px;margin:40px auto;padding:20px;color:#333">
    <div style="background:linear-gradient(135deg,#2563eb,#7c3aed);padding:30px;border-radius:12px 12px 0 0;color:white">
      <h1 style="margin:0">${s.name || 'Invoice'}</h1>
      <p style="margin:8px 0 0;opacity:0.9">Invoice #${inv.invoiceNo}</p></div>
    <div style="background:#fff;padding:30px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
      <p style="font-size:15px">Yth. <strong>${inv.invoiceFor}</strong>,</p>
      <p style="font-size:14px;color:#666;margin:12px 0">Berikut invoice kami untuk transaksi Anda:</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0"><thead><tr style="background:#f3f4f6">
        <th style="padding:10px;text-align:left;font-size:13px">Deskripsi</th>
        <th style="padding:10px;text-align:center;font-size:13px">Qty</th>
        <th style="padding:10px;text-align:right;font-size:13px">Harga</th>
        <th style="padding:10px;text-align:right;font-size:13px">Total</th></tr></thead>
      <tbody>${(inv.items || []).map((item: any) => `<tr style="border-bottom:1px solid #f3f4f6">
        <td style="padding:10px;font-size:13px">${item.description}</td>
        <td style="padding:10px;text-align:center;font-size:13px">${item.qty}</td>
        <td style="padding:10px;text-align:right;font-size:13px">${Number(item.unitPrice).toLocaleString('id-ID')}</td>
        <td style="padding:10px;text-align:right;font-size:13px">${Number(item.total).toLocaleString('id-ID')}</td></tr>`).join('')}</tbody></table>
      <div style="text-align:right;padding:16px;background:#f9fafb;border-radius:8px;margin-top:16px">
        <p style="margin:0;font-size:14px;color:#666">Total</p>
        <p style="margin:4px 0 0;font-size:24px;font-weight:bold;color:#111">Rp ${Number(inv.total).toLocaleString('id-ID')}</p></div>
      <div style="margin-top:24px;text-align:center">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://amoora.radenalam.com'}/invoices/${inv.id}/print" 
           style="display:inline-block;padding:12px 24px;background:#2563eb;color:white;text-decoration:none;border-radius:8px;font-weight:bold">Lihat Invoice</a></div>
    </div></body></html>`;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authUser = getAuthUser(request.headers);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
  if (!invoice) return NextResponse.json({ error: 'Invoice tidak ditemukan' }, { status: 404 });

  const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, id));

  // Fetch client
  const clientData: Record<string, any> = {};
  if (invoice.clientId) {
    const [c] = await db.select().from(clients).where(eq(clients.id, invoice.clientId)).limit(1);
    if (c) Object.assign(clientData, c);
  }
  const recipientEmail = clientData.email || '';

  if (!recipientEmail) {
    return NextResponse.json({ error: 'Email client tidak ditemukan. Pastikan client sudah memiliki email.' }, { status: 400 });
  }

  const [s] = await db.select().from(settings).limit(1);
  const storeSettings = s || {};

  const inv = { ...invoice, date: invoice.date?.toISOString(), dueDate: invoice.dueDate?.toISOString(), items };
  const html = generateInvoiceEmailHtml(inv, storeSettings, clientData);

  const subject = `Invoice ${invoice.invoiceNo} - ${invoice.invoiceFor}`;

  try {
    await transporter.sendMail({
      from: `"${process.env.FROM_NAME || storeSettings.name}" <${process.env.FROM_EMAIL}>`,
      to: recipientEmail,
      subject,
      html,
    });
    return NextResponse.json({ message: 'Email berhasil dikirim', recipient: recipientEmail });
  } catch (err: any) {
    return NextResponse.json({ error: `Gagal mengirim email: ${err.message}` }, { status: 500 });
  }
}
