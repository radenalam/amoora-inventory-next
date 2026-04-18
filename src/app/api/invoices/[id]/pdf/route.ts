import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { getById, queryByField } from '@/lib/firestore';
import { getAuthUser } from '@/lib/auth';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getCached, setCache } from '@/lib/cache';
import { serializeTimestamps } from '@/lib/firestore';

const SETTINGS_CACHE_KEY = 'settings:general';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = getAuthUser(request.headers);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const invoice = await getById('invoices', id);
  if (!invoice) return NextResponse.json({ error: 'Invoice tidak ditemukan' }, { status: 404 });

  const items = await queryByField('invoiceItems', 'invoiceId', '==', id);
  
  // Fetch settings (cached)
  const cached = getCached<Record<string, any>>(SETTINGS_CACHE_KEY);
  const settings: Record<string, any> = cached || { name: '', address: '', phone: '', email: '', signerName: '' };

  const inv = invoice as any;
  const totalQty = items.reduce((s: number, i: any) => s + i.qty, 0);
  const discountAmount = inv.discountType === 'percent' ? inv.subtotal * (inv.discountValue / 100) : inv.discountValue;
  const afterDiscount = inv.subtotal - discountAmount;
  const taxAmount = inv.taxType === 'percent' ? afterDiscount * (inv.taxValue / 100) : inv.taxValue;

  const itemRows = items.map((item: any) => `
    <tr>
      <td style="padding:12px 8px;border-bottom:1px solid #eee;font-size:13px;">${item.description}</td>
      <td style="padding:12px 8px;border-bottom:1px solid #eee;font-size:13px;text-align:center;">${item.qty}</td>
      <td style="padding:12px 8px;border-bottom:1px solid #eee;font-size:13px;text-align:right;">${formatCurrency(item.unitPrice)}</td>
      <td style="padding:12px 8px;border-bottom:1px solid #eee;font-size:13px;text-align:right;font-weight:600;">${formatCurrency(item.total || item.qty * item.unitPrice)}</td>
    </tr>`).join('');

  const discountRow = inv.discountValue > 0 ? `
    <tr><td style="padding:6px 0;color:#dc2626;font-size:13px;">Discount ${inv.discountType === 'percent' ? `(${inv.discountValue}%)` : ''}</td><td style="text-align:right;color:#dc2626;font-size:13px;">-${formatCurrency(discountAmount)}</td></tr>` : '';
  const taxRow = inv.taxValue > 0 ? `
    <tr><td style="padding:6px 0;font-size:13px;">Tax ${inv.taxType === 'percent' ? `(${inv.taxValue}%)` : ''}</td><td style="text-align:right;font-size:13px;">+${formatCurrency(taxAmount)}</td></tr>` : '';
  const shippingRow = inv.shipping > 0 ? `
    <tr><td style="padding:6px 0;font-size:13px;">Shipping</td><td style="text-align:right;font-size:13px;">+${formatCurrency(inv.shipping)}</td></tr>` : '';
  const dpRow = inv.downPayment > 0 ? `
    <tr><td style="padding:6px 0;color:#2563eb;font-size:13px;">Down Payment</td><td style="text-align:right;color:#2563eb;font-size:13px;">-${formatCurrency(inv.downPayment)}</td></tr>` : '';

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    @page { size: A4; margin: 40px; }
    body { font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; margin: 0; padding: 0; }
    * { box-sizing: border-box; }
  </style></head><body>
    <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #eee;padding-bottom:30px;">
      <div>
        <h1 style="font-size:24px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:0 0 10px 0;">${settings.name}</h1>
        <p style="font-size:13px;color:#666;margin:4px 0;max-width:280px;">${settings.address || ''}</p>
        <p style="font-size:13px;color:#666;margin:4px 0;">Telp: ${settings.phone || ''}</p>
        <p style="font-size:13px;color:#666;margin:4px 0;">Email: ${settings.email || ''}</p>
      </div>
      <div style="text-align:right;">
        <h2 style="font-size:32px;font-weight:700;color:#e5e7eb;text-transform:uppercase;letter-spacing:4px;margin:0;">Invoice</h2>
        <p style="font-size:18px;font-weight:600;margin:10px 0 5px 0;">${inv.invoiceNo}</p>
        <p style="font-size:13px;color:#666;margin:4px 0;">Tanggal: ${formatDate(inv.date)}</p>
        ${inv.dueDate ? `<p style="font-size:13px;color:#666;margin:4px 0;">Jatuh Tempo: ${formatDate(inv.dueDate)}</p>` : ''}
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-top:30px;">
      <div>
        <p style="font-size:11px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px 0;">Invoice For:</p>
        <p style="font-size:15px;font-weight:700;margin:0;">${inv.invoiceFor}</p>
        <p style="font-size:13px;color:#666;margin:6px 0 0 0;white-space:pre-line;">${inv.customerAddress || ''}</p>
        ${inv.customerPhone ? `<p style="font-size:13px;color:#666;margin:6px 0 0 0;">Telp: ${inv.customerPhone}</p>` : ''}
      </div>
      <div>
        <p style="font-size:11px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px 0;">Payable To:</p>
        <p style="font-size:15px;font-weight:700;margin:0;">${inv.payableTo}</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-top:16px;font-size:13px;">
          ${inv.poNumber ? `<span style="color:#666;">PO Number:</span><span style="font-weight:600;">${inv.poNumber}</span>` : ''}
          <span style="color:#666;">Payment:</span><span style="font-weight:600;">${inv.paymentMethod}</span>
        </div>
      </div>
    </div>
    <table style="width:100%;border-collapse:collapse;margin-top:35px;">
      <thead>
        <tr style="border-bottom:2px solid #1a1a1a;">
          <th style="padding:10px 8px;text-align:left;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Description</th>
          <th style="padding:10px 8px;text-align:center;font-size:12px;font-weight:700;width:80px;">Qty</th>
          <th style="padding:10px 8px;text-align:right;font-size:12px;font-weight:700;width:120px;">Unit Price</th>
          <th style="padding:10px 8px;text-align:right;font-size:12px;font-weight:700;width:120px;">Total</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>
    <div style="display:flex;justify-content:flex-end;margin-top:30px;">
      <table style="width:360px;font-size:13px;">
        <tr><td style="padding:6px 0;color:#666;">Total Qty</td><td style="text-align:right;font-weight:600;">${totalQty}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Subtotal</td><td style="text-align:right;font-weight:600;">${formatCurrency(inv.subtotal)}</td></tr>
        ${discountRow}${taxRow}${shippingRow}${dpRow}
        <tr style="border-top:2px solid #1a1a1a;"><td style="padding:12px 0;font-size:16px;font-weight:700;">Total</td><td style="text-align:right;font-size:16px;font-weight:700;">${formatCurrency(inv.total)}</td></tr>
      </table>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-top:60px;">
      <div>
        <p style="font-size:13px;font-weight:700;margin:0 0 6px 0;">Notes:</p>
        <p style="font-size:13px;color:#666;white-space:pre-line;margin:0;">${inv.notes || ''}</p>
      </div>
      <div style="text-align:right;">
        <p style="font-size:13px;margin:0 0 60px 0;">Hormat Kami,</p>
        <div style="border-bottom:1px solid #999;width:200px;margin:0 auto 6px 0;"></div>
        <p style="font-size:13px;font-weight:700;margin:0;">${settings.signerName || ''}</p>
        <p style="font-size:11px;color:#666;margin:0;">${settings.name || ''}</p>
      </div>
    </div>
  </body></html>`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
      'Content-Disposition': `inline; filename="${inv.invoiceNo}.html"`,
    },
  });
}
