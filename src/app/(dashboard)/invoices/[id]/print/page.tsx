'use client';

import { useParams, useRouter } from 'next/navigation';
import { useStore, Invoice } from '@/store/useStore';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Printer, ArrowLeft, Edit2, Loader2, Download, Mail, Users } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { pdf } from '@react-pdf/renderer';
import InvoicePDFDocument from '@/components/InvoicePDF';

export default function InvoicePrintPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { settings, fetchInvoice, fetchSettings } = useStore();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<string>('');
  const [clientEmail, setClientEmail] = useState<string>('');

  useEffect(() => {
    fetchSettings();
    if (id) {
      fetchInvoice(id).then(async (inv) => {
        setInvoice(inv);
        setLoading(false);
        // Fetch client email from clients collection
        if (inv?.invoiceFor) {
          try {
            const h = { 'Authorization': `Bearer ${localStorage.getItem('amoora_token')}` };
            const res = await fetch('/api/clients', { headers: h });
            if (res.ok) {
              const clients = await res.json();
              const match = clients.find((cl: any) =>
                cl.name.toLowerCase() === inv.invoiceFor.toLowerCase()
              );
              if (match?.email) setClientEmail(match.email);
            }
          } catch {}
        }
      });
    }
  }, [id]);

  const handleDownloadPDF = useCallback(async () => {
    if (!invoice) return;
    setGenerating(true);
    try {
      const blob = await pdf(
        <InvoicePDFDocument invoice={invoice} settings={settings} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${invoice.invoiceNo}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Gagal generate PDF');
    }
    setGenerating(false);
  }, [invoice, settings]);

  const handlePrint = useCallback(async () => {
    if (!invoice) return;
    setGenerating(true);
    try {
      const blob = await pdf(
        <InvoicePDFDocument invoice={invoice} settings={settings} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const win = window.open(url, '_blank');
      if (win) {
        win.onload = () => {
          win.print();
          URL.revokeObjectURL(url);
        };
      }
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Gagal generate PDF');
    }
    setGenerating(false);
  }, [invoice, settings]);

  const handleSendEmail = useCallback(async () => {
    if (!invoice) return;
    setSendingEmail(true);
    setEmailStatus('');
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/send-email`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('amoora_token')}` },
      });
      const data = await res.json();
      if (res.ok) {
        setEmailStatus(`✅ Email dikirim ke ${data.recipient}`);
      } else {
        setEmailStatus(`❌ ${data.error}`);
      }
    } catch {
      setEmailStatus('❌ Gagal mengirim email');
    }
    setSendingEmail(false);
  }, [invoice]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Invoice tidak ditemukan</h2>
        <button onClick={() => router.push('/invoices')} className="mt-4 text-blue-600 hover:underline">
          Kembali ke daftar
        </button>
      </div>
    );
  }

  const totalQty = invoice.items.reduce((sum, item) => sum + item.qty, 0);
  const discountAmount = invoice.discountType === 'percent' ? invoice.subtotal * (invoice.discountValue / 100) : invoice.discountValue;
  const afterDiscount = invoice.subtotal - discountAmount;
  const taxAmount = invoice.taxType === 'percent' ? afterDiscount * (invoice.taxValue / 100) : invoice.taxValue;

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="print:hidden mb-6 flex items-center justify-between">
        <Link href="/invoices" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4 mr-1" />Kembali
        </Link>
        <div className="flex space-x-3">
          <Link href={`/invoices/${invoice.id}/edit`} className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            <Edit2 className="w-4 h-4 mr-2" />Edit
          </Link>
          <button onClick={handleDownloadPDF} disabled={generating} className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">
            {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Download PDF
          </button>
          <button onClick={handlePrint} disabled={generating} className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
            {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Printer className="w-4 h-4 mr-2" />}
            Print
          </button>
          {clientEmail ? (
            <button onClick={handleSendEmail} disabled={sendingEmail} className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50">
              {sendingEmail ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
              Kirim Email
            </button>
          ) : (
            <Link href="/clients" className="inline-flex items-center px-4 py-2 border border-amber-300 shadow-sm text-sm font-medium rounded-md text-amber-700 bg-amber-50 hover:bg-amber-100">
              <Users className="w-4 h-4 mr-2" />
              Lengkapi Email Client
            </Link>
          )}
        </div>
        {emailStatus && <p className="mt-2 text-sm text-center w-full">{emailStatus}</p>}
      </div>

      {/* Web Preview (unchanged) */}
      <div className="bg-white shadow-lg print:shadow-none print:border-0 border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-8 sm:p-12">
          <div className="flex justify-between items-start border-b border-gray-200 pb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 uppercase tracking-wider">{settings.name}</h1>
              <div className="mt-2 text-sm text-gray-500 max-w-xs">
                <p>{settings.address}</p>
                <p className="mt-1">Telp: {settings.phone}</p>
                <p>Email: {settings.email}</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-4xl font-bold text-gray-200 uppercase tracking-widest">Invoice</h2>
              <p className="mt-2 text-lg font-medium text-gray-900">{invoice.invoiceNo}</p>
              <div className="mt-2 text-sm text-gray-500">
                <p>Tanggal: {formatDate(invoice.date)}</p>
                {invoice.dueDate && <p>Jatuh Tempo: {formatDate(invoice.dueDate)}</p>}
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-8">
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Invoice For:</h3>
              <p className="text-base font-bold text-gray-900">{invoice.invoiceFor}</p>
              <p className="text-sm text-gray-500 mt-1 whitespace-pre-line">{invoice.customerAddress}</p>
              {invoice.customerPhone && <p className="text-sm text-gray-500 mt-1">Telp: {invoice.customerPhone}</p>}
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Payable To:</h3>
              <p className="text-base font-bold text-gray-900">{invoice.payableTo}</p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                {invoice.poNumber && (<><span className="text-gray-500">PO Number:</span><span className="font-medium text-gray-900">{invoice.poNumber}</span></>)}
                <span className="text-gray-500">Payment Method:</span>
                <span className="font-medium text-gray-900">{invoice.paymentMethod}</span>
              </div>
            </div>
          </div>

          <div className="mt-10">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-900 text-sm font-bold text-gray-900 uppercase tracking-wider">
                  <th className="py-3 px-2">Description</th>
                  <th className="py-3 px-2 text-center w-24">Qty</th>
                  <th className="py-3 px-2 text-right w-32">Unit Price</th>
                  <th className="py-3 px-2 text-right w-32">Total</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-700">
                {invoice.items.map((item, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="py-4 px-2">{item.description}</td>
                    <td className="py-4 px-2 text-center">{item.qty}</td>
                    <td className="py-4 px-2 text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-4 px-2 text-right font-medium text-gray-900">{formatCurrency(item.total || item.qty * item.unitPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 flex justify-end">
            <div className="w-full max-w-md space-y-3 text-sm">
              <div className="flex justify-between py-1"><span className="text-gray-500">Total Qty</span><span className="font-medium text-gray-900">{totalQty}</span></div>
              <div className="flex justify-between py-1"><span className="text-gray-500">Subtotal</span><span className="font-medium text-gray-900">{formatCurrency(invoice.subtotal)}</span></div>
              {(invoice.discountValue > 0) && (<div className="flex justify-between py-1 text-red-600"><span>Discount {invoice.discountType === 'percent' ? `(${invoice.discountValue}%)` : ''}</span><span>-{formatCurrency(discountAmount)}</span></div>)}
              {(invoice.taxValue > 0) && (<div className="flex justify-between py-1"><span className="text-gray-500">Tax {invoice.taxType === 'percent' ? `(${invoice.taxValue}%)` : ''}</span><span className="font-medium text-gray-900">+{formatCurrency(taxAmount)}</span></div>)}
              {(invoice.shipping > 0) && (<div className="flex justify-between py-1"><span className="text-gray-500">Shipping</span><span className="font-medium text-gray-900">+{formatCurrency(invoice.shipping)}</span></div>)}
              {(invoice.downPayment > 0) && (<div className="flex justify-between py-1 text-blue-600"><span>Down Payment</span><span>-{formatCurrency(invoice.downPayment)}</span></div>)}
              <div className="flex justify-between py-3 border-t-2 border-gray-900 mt-2"><span className="text-lg font-bold text-gray-900">Total</span><span className="text-lg font-bold text-gray-900">{formatCurrency(invoice.total)}</span></div>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-2 gap-8">
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-2">Notes:</h4>
              <p className="text-sm text-gray-500 whitespace-pre-line">{invoice.notes}</p>
            </div>
            <div className="text-right flex flex-col items-end">
              <p className="text-sm text-gray-900 mb-16">Hormat Kami,</p>
              <div className="border-b border-gray-400 w-48 mb-2"></div>
              <p className="text-sm font-bold text-gray-900">{settings.signerName}</p>
              <p className="text-xs text-gray-500">{settings.name}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
