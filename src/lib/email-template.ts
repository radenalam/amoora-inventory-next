import { formatCurrency, formatDate } from './utils';

export function generateInvoiceEmailHtml(data: {
  invoiceNo: string;
  invoiceFor: string;
  customerAddress: string;
  customerPhone: string;
  date: Date | string;
  dueDate: Date | string | null;
  items: { description: string; qty: number; unitPrice: number; total: number }[];
  subtotal: number;
  discountType: string;
  discountValue: number;
  taxType: string;
  taxValue: number;
  shipping: number;
  downPayment: number;
  total: number;
  notes: string;
  storeName: string;
  storeAddress: string;
  storePhone: string;
  storeEmail: string;
  signerName: string;
}): string {
  const discountAmount = data.discountType === 'percent'
    ? data.subtotal * (data.discountValue / 100)
    : data.discountValue;
  const afterDiscount = data.subtotal - discountAmount;
  const taxAmount = data.taxType === 'percent'
    ? afterDiscount * (data.taxValue / 100)
    : data.taxValue;

  const itemRows = data.items.map((item) => `
    <tr>
      <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb;">${item.description}</td>
      <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.qty}</td>
      <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.unitPrice)}</td>
      <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">${formatCurrency(item.total || item.qty * item.unitPrice)}</td>
    </tr>
  `).join('');

  return `
    <div style="max-width: 680px; margin: 0 auto; font-family: 'Segoe UI', Arial, sans-serif; color: #1f2937; background: #f9fafb; padding: 40px 20px;">
      <div style="background: #fff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 32px 40px;">
          <h1 style="margin: 0; color: #fff; font-size: 24px; letter-spacing: 2px; text-transform: uppercase;">${data.storeName}</h1>
          <p style="margin: 8px 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">${data.storeAddress}</p>
          <p style="margin: 4px 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">📞 ${data.storePhone} &nbsp;|&nbsp; ✉️ ${data.storeEmail}</p>
        </div>

        <div style="padding: 32px 40px;">
          <!-- Invoice Info -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px;">
            <div>
              <p style="margin: 0; font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">Invoice Untuk:</p>
              <p style="margin: 6px 0 0; font-size: 18px; font-weight: 700; color: #111827;">${data.invoiceFor}</p>
              <p style="margin: 4px 0 0; font-size: 14px; color: #4b5563; white-space: pre-line;">${data.customerAddress}</p>
              ${data.customerPhone ? `<p style="margin: 4px 0 0; font-size: 14px; color: #4b5563;">📞 ${data.customerPhone}</p>` : ''}
            </div>
            <div style="text-align: right;">
              <p style="margin: 0; font-size: 32px; font-weight: 800; color: #e5e7eb;">INVOICE</p>
              <p style="margin: 4px 0 0; font-size: 16px; font-weight: 600; color: #111827;">${data.invoiceNo}</p>
              <p style="margin: 8px 0 0; font-size: 14px; color: #6b7280;">Tanggal: ${formatDate(data.date)}</p>
              ${data.dueDate ? `<p style="margin: 2px 0 0; font-size: 14px; color: #6b7280;">Jatuh Tempo: ${formatDate(data.dueDate)}</p>` : ''}
            </div>
          </div>

          <!-- Items Table -->
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="border-bottom: 2px solid #111827;">
                <th style="padding: 12px 8px; text-align: left; font-weight: 700; color: #111827; text-transform: uppercase; letter-spacing: 1px; font-size: 12px;">Deskripsi</th>
                <th style="padding: 12px 8px; text-align: center; font-weight: 700; color: #111827; text-transform: uppercase; letter-spacing: 1px; font-size: 12px; width: 80px;">Qty</th>
                <th style="padding: 12px 8px; text-align: right; font-weight: 700; color: #111827; text-transform: uppercase; letter-spacing: 1px; font-size: 12px; width: 140px;">Harga Satuan</th>
                <th style="padding: 12px 8px; text-align: right; font-weight: 700; color: #111827; text-transform: uppercase; letter-spacing: 1px; font-size: 12px; width: 140px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
            </tbody>
          </table>

          <!-- Totals -->
          <div style="margin-top: 24px; display: flex; justify-content: flex-end;">
            <div style="width: 320px;">
              <div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px;">
                <span style="color: #6b7280;">Subtotal</span>
                <span style="font-weight: 600; color: #111827;">${formatCurrency(data.subtotal)}</span>
              </div>
              ${data.discountValue > 0 ? `
              <div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; color: #dc2626;">
                <span>Diskon ${data.discountType === 'percent' ? `(${data.discountValue}%)` : ''}</span>
                <span style="font-weight: 600;">-${formatCurrency(discountAmount)}</span>
              </div>` : ''}
              ${data.taxValue > 0 ? `
              <div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px;">
                <span style="color: #6b7280;">Pajak ${data.taxType === 'percent' ? `(${data.taxValue}%)` : ''}</span>
                <span style="font-weight: 600; color: #111827;">+${formatCurrency(taxAmount)}</span>
              </div>` : ''}
              ${data.shipping > 0 ? `
              <div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px;">
                <span style="color: #6b7280;">Ongkos Kirim</span>
                <span style="font-weight: 600; color: #111827;">+${formatCurrency(data.shipping)}</span>
              </div>` : ''}
              ${data.downPayment > 0 ? `
              <div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; color: #2563eb;">
                <span>Uang Muka</span>
                <span style="font-weight: 600;">-${formatCurrency(data.downPayment)}</span>
              </div>` : ''}
              <div style="display: flex; justify-content: space-between; padding: 14px 0 8px; margin-top: 8px; border-top: 2px solid #111827;">
                <span style="font-size: 18px; font-weight: 800; color: #111827;">Total</span>
                <span style="font-size: 18px; font-weight: 800; color: #111827;">${formatCurrency(data.total)}</span>
              </div>
            </div>
          </div>

          ${data.notes ? `
          <!-- Notes -->
          <div style="margin-top: 32px; padding: 16px; background: #f9fafb; border-radius: 8px; border-left: 4px solid #3b82f6;">
            <p style="margin: 0; font-size: 13px; font-weight: 600; color: #374151;">Catatan:</p>
            <p style="margin: 6px 0 0; font-size: 14px; color: #4b5563; white-space: pre-line;">${data.notes}</p>
          </div>` : ''}

          <!-- Signature -->
          <div style="margin-top: 48px; text-align: right;">
            <p style="margin: 0; font-size: 14px; color: #4b5563;">Hormat Kami,</p>
            <div style="width: 180px; height: 1px; background: #9ca3af; margin: 60px auto 8px 0;"></div>
            <p style="margin: 0; font-size: 14px; font-weight: 700; color: #111827;">${data.signerName}</p>
            <p style="margin: 2px 0 0; font-size: 12px; color: #6b7280;">${data.storeName}</p>
          </div>
        </div>
      </div>

      <p style="text-align: center; margin-top: 24px; font-size: 12px; color: #9ca3af;">
        Invoice ini dikirim otomatis oleh sistem ${data.storeName}.
      </p>
    </div>
  `;
}
