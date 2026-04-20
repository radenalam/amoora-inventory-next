import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { invoices, invoiceItems, clients, settings } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authUser = getAuthUser(request.headers);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
  if (!invoice) return NextResponse.json({ error: 'Invoice tidak ditemukan' }, { status: 404 });

  const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, id));

  // Fetch client
  let client: Record<string, any> = {};
  if (invoice.clientId) {
    const [c] = await db.select().from(clients).where(eq(clients.id, invoice.clientId)).limit(1);
    if (c) client = c;
  }

  // Fetch settings
  const [s] = await db.select().from(settings).limit(1);
  const settingsData = s || { name: '', address: '', phone: '', email: '', signerName: '' };

  const totalQty = items.reduce((s: number, i: any) => s + Number(i.qty), 0);
  const discountAmount = invoice.discountType === 'percent'
    ? Number(invoice.subtotal) * (Number(invoice.discountValue) / 100)
    : Number(invoice.discountValue);
  const taxAmount = invoice.taxType === 'percent'
    ? (Number(invoice.subtotal) - discountAmount) * (Number(invoice.taxValue) / 100)
    : Number(invoice.taxValue);

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invoice ${invoice.invoiceNo}</title></head><body style="font-family:Arial,sans-serif;max-width:800px;margin:40px auto;padding:20px;color:#333">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px">
      <div><h1 style="margin:0;font-size:24px;color:#111">${settingsData.name || 'Invoice'}</h1>
        <p style="font-size:13px;color:#666;margin:6px 0 0;white-space:pre-line">${settingsData.address || ''}</p>
        ${settingsData.phone ? `<p style="font-size:13px;color:#666;margin:4px 0">Telp: ${settingsData.phone}</p>` : ''}
        ${settingsData.email ? `<p style="font-size:13px;color:#666;margin:4px 0">${settingsData.email}</p>` : ''}</div>
      <div style="text-align:right"><h2 style="margin:0;color:#2563eb;font-size:28px">INVOICE</h2>
        <p style="font-size:14px;color:#666;margin:4px 0">${invoice.invoiceNo}</p>
        <p style="font-size:13px;color:#666;margin:4px 0">${invoice.date ? new Date(invoice.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</p>
        ${invoice.dueDate ? `<p style="font-size:13px;color:#666;margin:4px 0">Jatuh Tempo: ${new Date(invoice.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>` : ''}</div>
    </div>
    <div style="display:flex;gap:40px;margin-bottom:30px">
      <div style="flex:1"><h3 style="font-size:14px;color:#666;margin:0 0 8px">Ditagihkan Kepada</h3>
        <p style="font-size:15px;font-weight:bold;margin:0">${invoice.invoiceFor || '-'}</p>
        <p style="font-size:13px;color:#666;margin:6px 0 0;white-space:pre-line">${client.address || ''}</p>
        ${client.phone ? `<p style="font-size:13px;color:#666;margin:4px 0">Telp: ${client.phone}</p>` : ''}</div>
      <div style="flex:1"><h3 style="font-size:14px;color:#666;margin:0 0 8px">Info</h3>
        ${invoice.poNumber ? `<p style="font-size:13px;color:#666;margin:4px 0">PO: ${invoice.poNumber}</p>` : ''}
        <p style="font-size:13px;color:#666;margin:4px 0">Pembayaran: ${invoice.paymentMethod || '-'}</p></div>
    </div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px"><thead><tr style="background:#f9fafb">
      <th style="padding:10px 12px;text-align:left;font-size:13px;border-bottom:2px solid #e5e7eb">#</th>
      <th style="padding:10px 12px;text-align:left;font-size:13px;border-bottom:2px solid #e5e7eb">Deskripsi</th>
      <th style="padding:10px 12px;text-align:center;font-size:13px;border-bottom:2px solid #e5e7eb">Qty</th>
      <th style="padding:10px 12px;text-align:right;font-size:13px;border-bottom:2px solid #e5e7eb">Harga</th>
      <th style="padding:10px 12px;text-align:right;font-size:13px;border-bottom:2px solid #e5e7eb">Total</th></tr></thead>
    <tbody>${items.map((item: any, i: number) => `<tr style="border-bottom:1px solid #f3f4f6">
      <td style="padding:10px 12px;font-size:13px">${i + 1}</td>
      <td style="padding:10px 12px;font-size:13px">${item.description}</td>
      <td style="padding:10px 12px;text-align:center;font-size:13px">${item.qty}</td>
      <td style="padding:10px 12px;text-align:right;font-size:13px">${Number(item.unitPrice).toLocaleString('id-ID')}</td>
      <td style="padding:10px 12px;text-align:right;font-size:13px">${Number(item.total).toLocaleString('id-ID')}</td></tr>`).join('')}</tbody></table>
    <div style="display:flex;justify-content:flex-end"><div style="width:280px">
      <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px"><span>Subtotal</span><span>Rp ${Number(invoice.subtotal).toLocaleString('id-ID')}</span></div>
      ${discountAmount > 0 ? `<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#dc2626"><span>Diskon ${invoice.discountType === 'percent' ? `(${invoice.discountValue}%)` : ''}</span><span>- Rp ${discountAmount.toLocaleString('id-ID')}</span></div>` : ''}
      ${taxAmount > 0 ? `<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px"><span>Pajak ${invoice.taxType === 'percent' ? `(${invoice.taxValue}%)` : ''}</span><span>Rp ${taxAmount.toLocaleString('id-ID')}</span></div>` : ''}
      ${Number(invoice.shipping) > 0 ? `<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px"><span>Ongkir</span><span>Rp ${Number(invoice.shipping).toLocaleString('id-ID')}</span></div>` : ''}
      ${Number(invoice.downPayment) > 0 ? `<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#dc2626"><span>Uang Muka</span><span>- Rp ${Number(invoice.downPayment).toLocaleString('id-ID')}</span></div>` : ''}
      <div style="display:flex;justify-content:space-between;padding:10px 0;font-size:16px;font-weight:bold;border-top:2px solid #111;margin-top:8px"><span>Total</span><span>Rp ${Number(invoice.total).toLocaleString('id-ID')}</span></div>
    </div></div>
    ${invoice.notes ? `<div style="margin-top:30px;padding:16px;background:#f9fafb;border-radius:8px"><h4 style="font-size:13px;color:#666;margin:0 0 8px">Catatan</h4><p style="font-size:13px;color:#444;margin:0;white-space:pre-line">${invoice.notes}</p></div>` : ''}
    <div style="margin-top:40px;text-align:right"><p style="font-size:13px;color:#666;margin:0 0 60px">Hormat kami,</p>
      <div style="border-top:1px solid #333;padding-top:8px;width:200px;display:inline-block"><p style="font-size:14px;font-weight:bold;margin:0">${settingsData.signerName || settingsData.name || '-'}</p></div></div>
  </body></html>`;

  return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
}
