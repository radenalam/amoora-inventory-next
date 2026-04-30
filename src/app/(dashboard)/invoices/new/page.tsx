'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore, Invoice, InvoiceItem, InvoiceStatus } from '@/store/useStore';
import { Plus, Trash2, Save, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import ClientSearchInput from '@/components/ClientSearchInput';
import ProductSearchInput from '@/components/ProductSearchInput';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { createClient } from '@/services/clients';

export default function InvoiceFormPage({ params }: { params: Promise<{ id?: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const { invoices, products, settings, clients, addInvoice, updateInvoice, addClient, fetchInvoice, fetchNextInvoiceNo } = useStore();

  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<Partial<Invoice>>({
    invoiceNo: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    poNumber: '',
    paymentMethod: 'Bank',
    clientId: '',
    invoiceFor: '',
    payableTo: '',
    items: [],
    discountType: 'nominal',
    discountValue: 0,
    taxType: 'percent',
    taxValue: 0,
    shipping: 0,
    downPayment: 0,
    notes: '',
    status: 'draft',
  });

  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [newClient, setNewClient] = useState<{ name: string; email: string; phone: string; address: string } | null>(null);
  useUnsavedChanges(hasChanges);

  const generateInvoiceNo = async () => {
    try {
      return await fetchNextInvoiceNo();
    } catch {
      const year = new Date().getFullYear();
      return `INV01/${year}`;
    }
  };

  useEffect(() => {
    if (!isEdit) {
      generateInvoiceNo().then((no) => {
        setFormData(prev => ({ ...prev, invoiceNo: no, payableTo: settings.name, notes: settings.defaultNotes }));
      });
    }
  }, [isEdit, id]);

  useEffect(() => {
    if (isEdit && id) {
      fetchInvoice(id).then((inv) => {
        if (inv) {
          setFormData({
            ...inv,
            date: new Date(inv.date).toISOString().split('T')[0],
            dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : '',
          });
        }
      });
    } else {
      setFormData(prev => ({ ...prev, payableTo: settings.name, notes: settings.defaultNotes }));
    }
  }, [isEdit, id]);

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...(formData.items || [])];
    newItems[index] = { ...newItems[index], [field]: value };
    if (field === 'qty' || field === 'unitPrice') {
      newItems[index].total = newItems[index].qty * newItems[index].unitPrice;
    }
    if (field === 'unitPrice') {
      delete newItems[index].productId;
    }
    if (field === 'productId' && value) {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index].description = product.name;
        newItems[index].unitPrice = product.price;
        newItems[index].total = newItems[index].qty * product.price;
      }
    }
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({ ...formData, items: [...(formData.items || []), { description: '', qty: 1, unitPrice: 0, total: 0 }] });
  };

  const removeItem = (index: number) => {
    const newItems = [...(formData.items || [])];
    newItems.splice(index, 1);
    setFormData({ ...formData, items: newItems });
  };

  const totalQty = (formData.items || []).reduce((sum, item) => sum + item.qty, 0);
  const subtotal = (formData.items || []).reduce((sum, item) => sum + (item.total || 0), 0);
  const discountAmount = formData.discountType === 'percent' ? subtotal * ((formData.discountValue || 0) / 100) : (formData.discountValue || 0);
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = formData.taxType === 'percent' ? afterDiscount * ((formData.taxValue || 0) / 100) : (formData.taxValue || 0);
  const total = afterDiscount + taxAmount + (formData.shipping || 0) - (formData.downPayment || 0);

  // Track unsaved changes (after initial load)
  const [initialLoaded, setInitialLoaded] = useState(false);
  useEffect(() => {
    if (formData.invoiceNo && !initialLoaded) {
      setInitialLoaded(true);
    }
    if (initialLoaded && formData.invoiceNo) {
      setHasChanges(true);
    }
  }, [formData, initialLoaded]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasChanges(false);
    setLoading(true);
    try {
      let clientId = formData.clientId;
      // If new client, create it first via API to get the ID
      if (newClient && !clientId) {
        const created = await createClient(newClient);
        clientId = created.id;
      }
      const finalInvoice = { ...formData, clientId, subtotal, total };
      if (isEdit && id) await updateInvoice(id, finalInvoice);
      else await addInvoice(finalInvoice);
      router.push('/invoices');
    } catch { alert('Gagal menyimpan invoice'); }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'BUTTON' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
      e.preventDefault();
    }
  };

  return (
    <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Invoice' : 'Buat Invoice Baru'}</h2>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3 items-center">
          <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as InvoiceStatus })} className="block w-40 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white">
            <option value="draft">Status: Draft</option>
            <option value="issued">Status: Issued</option>
            <option value="paid">Status: Paid</option>
            <option value="cancelled">Status: Cancelled</option>
          </select>
          <button type="button" onClick={() => router.push('/invoices')} className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">Batal</button>
          <button type="submit" disabled={loading} className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}Simpan
          </button>
        </div>
      </div>

      <div className="bg-white shadow-lg border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-8 sm:p-12">
          <div className="flex justify-between items-start pb-8">
            <div className="flex-1">
              <h1 className="text-4xl font-serif text-[#9b7b66] mb-2">{settings.name}</h1>
              <div className="text-sm text-gray-900 max-w-xs font-medium">
                <p>{settings.name}</p>
                <p className="font-normal">{settings.address}</p>
                <p className="font-bold mt-1">{settings.phone}</p>
              </div>
            </div>
            <div className="w-72 text-right">
              <div className="bg-[#a68a7c] text-white text-3xl font-bold py-2 px-4 uppercase tracking-widest mb-4 text-center">INVOICE</div>
              <div className="space-y-1 text-sm font-bold text-gray-900">
                <input type="text" value={formData.invoiceNo} onChange={(e) => setFormData({ ...formData, invoiceNo: e.target.value })} className="w-full text-right border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none bg-transparent" placeholder="Invoice No" required />
                <div className="w-full text-right truncate">{formData.invoiceFor || '-'}</div>
                <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full text-right border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none bg-transparent" required />
              </div>
            </div>
          </div>

          <div className="mt-4 border-y-2 border-gray-900">
            <div className="grid grid-cols-3 divide-x divide-gray-300">
              <div className="p-2">
                <div className="text-sm font-bold text-gray-900 mb-1">Invoice for</div>
                <ClientSearchInput
                  value={formData.invoiceFor}
                  onChange={(val) => setFormData(prev => ({ ...prev, invoiceFor: val }))}
                  onSelect={(client) => setFormData(prev => ({
                    ...prev,
                    clientId: client.id,
                    invoiceFor: client.name,

                  }))}
                  onCreateNew={(name) => {
                    setFormData(prev => ({ ...prev, invoiceFor: name, clientId: '' }));
                    setNewClient({ name, email: '', phone: '', address: '' });
                  }}
                placeholder="Ketik atau cari nama client..."
                />
              </div>
              <div className="p-2">
                <div className="text-sm font-bold text-gray-900 mb-1">Invoice #</div>
                <input type="text" value={formData.invoiceNo} onChange={(e) => setFormData({ ...formData, invoiceNo: e.target.value })} className="w-full text-sm border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none bg-transparent" placeholder="INV01/2026" required />
              </div>
              <div className="p-2">
                <div className="text-sm font-bold text-gray-900 mb-1">PO Number</div>
                <input type="text" value={formData.poNumber || ''} onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })} className="w-full text-sm border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none bg-transparent" placeholder="-" />
              </div>
            </div>
            <div className="grid grid-cols-3 divide-x divide-gray-300 border-t border-gray-300">
              <div className="p-2">
                {newClient ? (
                  <div className="space-y-1.5">
                    <div className="text-xs font-bold text-green-700">+ Client Baru</div>
                    <input type="email" value={newClient.email} onChange={(e) => setNewClient({ ...newClient, email: e.target.value })} className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Email" />
                    <input type="text" value={newClient.phone} onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })} className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Phone" />
                    <textarea value={newClient.address} onChange={(e) => setNewClient({ ...newClient, address: e.target.value })} className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none" placeholder="Alamat" rows={2} />
                    <button type="button" onClick={() => { setNewClient(null); setFormData(prev => ({ ...prev, invoiceFor: '', clientId: '' })); }} className="text-xs text-gray-400 hover:text-gray-600">Batal</button>
                  </div>
                ) : (
                  <div className="text-xs text-gray-400">Pilih client di atas</div>
                )}
              </div>
              <div className="p-2">
                <div className="text-sm font-bold text-gray-900 mb-1">Dropping</div>
                <input type="date" value={formData.dueDate || ''} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} className="w-full text-sm border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none bg-transparent" />
              </div>
              <div className="p-2">
                <div className="text-sm font-bold text-gray-900 mb-1">Payment</div>
                <select value={formData.paymentMethod} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })} className="w-full text-sm border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none bg-transparent">
                  <option value="Bank">Bank</option>
                  <option value="Cash">Cash</option>
                  <option value="Transfer">Transfer</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-900 text-sm font-bold text-gray-900">
                  <th className="py-2 px-2 w-1/2">Description</th>
                  <th className="py-2 px-2 text-center w-24">Qty</th>
                  <th className="py-2 px-2 text-right w-32">Unit price</th>
                  <th className="py-2 px-2 text-right w-32">Total price</th>
                  <th className="py-2 px-2 w-10"></th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-900">
                {formData.items?.map((item, index) => (
                  <tr key={index} className="border-b border-gray-200 group">
                    <td className="py-2 px-2">
                      <ProductSearchInput
                        products={products.map(p => ({ id: p.id, name: p.name, description: p.description, price: p.price, unit: p.unit }))}
                        value={item.description}
                        onChange={(val) => handleItemChange(index, 'description', val)}
                        onSelect={(product) => {
                          handleItemChange(index, 'productId', product.id);
                          const newItems = [...(formData.items || [])];
                          newItems[index] = {
                            ...newItems[index],
                            productId: product.id,
                            description: product.name,
                            unitPrice: product.price,
                            total: newItems[index].qty * product.price,
                          };
                          setFormData({ ...formData, items: newItems });
                        }}
                        placeholder="Ketik atau cari produk..."
                      />
                    </td>
                    <td className="py-2 px-2 text-center align-bottom">
                      <input type="number" min="1" required value={item.qty || ''} onChange={(e) => handleItemChange(index, 'qty', Number(e.target.value))} className="w-full text-center border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none bg-transparent" />
                    </td>
                    <td className="py-2 px-2 text-right align-bottom">
                      <input type="number" min="0" required value={item.unitPrice || ''} onChange={(e) => handleItemChange(index, 'unitPrice', Number(e.target.value))} className="w-full text-right border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none bg-transparent" />
                    </td>
                    <td className="py-2 px-2 text-right align-bottom font-medium">{formatCurrency(item.total || 0)}</td>
                    <td className="py-2 px-2 text-right align-bottom">
                      <button type="button" onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-2">
              <button type="button" onClick={addItem} className="inline-flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors">
                <Plus className="w-4 h-4 mr-1" />Tambah Baris
              </button>
            </div>
          </div>

          <div className="mt-8 flex justify-between border-t-2 border-gray-900 pt-2">
            <div className="w-1/2">
              <div className="flex items-center text-sm font-bold text-gray-900">
                <span className="w-24">Total</span><span>{totalQty}</span>
              </div>
            </div>
            <div className="w-1/2 max-w-sm">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900">Subtotal</span>
                  <span className="font-medium text-gray-900">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-gray-900">Discount</span>
                    <select value={formData.discountType} onChange={(e) => setFormData({ ...formData, discountType: e.target.value as 'nominal' | 'percent' })} className="border border-gray-200 rounded text-xs py-0.5 px-1 focus:outline-none"><option value="nominal">Rp</option><option value="percent">%</option></select>
                    <input type="number" min="0" value={formData.discountValue || ''} onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })} className="w-16 border-b border-gray-300 text-right focus:outline-none focus:border-blue-500" placeholder="0" />
                  </div>
                  <span className="text-gray-900">{discountAmount > 0 ? `-${formatCurrency(discountAmount)}` : '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-gray-900">Tax</span>
                    <select value={formData.taxType} onChange={(e) => setFormData({ ...formData, taxType: e.target.value as 'nominal' | 'percent' })} className="border border-gray-200 rounded text-xs py-0.5 px-1 focus:outline-none"><option value="nominal">Rp</option><option value="percent">%</option></select>
                    <input type="number" min="0" value={formData.taxValue || ''} onChange={(e) => setFormData({ ...formData, taxValue: Number(e.target.value) })} className="w-16 border-b border-gray-300 text-right focus:outline-none focus:border-blue-500" placeholder="0" />
                  </div>
                  <span className="text-gray-900">{taxAmount > 0 ? `+${formatCurrency(taxAmount)}` : '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900">Shipping</span>
                  <input type="number" min="0" value={formData.shipping || ''} onChange={(e) => setFormData({ ...formData, shipping: Number(e.target.value) })} className="w-24 border-b border-gray-300 text-right focus:outline-none focus:border-blue-500" placeholder="0" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900">Down Payment</span>
                  <input type="number" min="0" value={formData.downPayment || ''} onChange={(e) => setFormData({ ...formData, downPayment: Number(e.target.value) })} className="w-24 border-b border-gray-300 text-right focus:outline-none focus:border-blue-500" placeholder="0" />
                </div>
                <div className="flex justify-between items-center pt-2 mt-2">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-bold text-gray-900">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-2 gap-8">
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-2">Notes:</h4>
              <textarea rows={4} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full text-sm text-gray-900 border border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none bg-transparent resize-none" placeholder="Catatan atau instruksi pembayaran..." />
            </div>
            <div className="text-right flex flex-col items-end">
              <p className="text-sm font-bold text-gray-900 mb-16">Hormat Kami,</p>
              <div className="border-b border-gray-400 w-48 mb-2"></div>
              <p className="text-sm font-bold text-gray-900">( {settings.signerName} )</p>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
