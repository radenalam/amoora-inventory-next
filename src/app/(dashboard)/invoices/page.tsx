'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, Search, Eye, Edit2, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function InvoiceListPage() {
  const { invoices, fetchInvoices, deleteInvoice } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchInvoices({ status: statusFilter === 'all' ? undefined : statusFilter, search: searchTerm || undefined });
  }, [statusFilter]);

  const handleSearch = () => {
    fetchInvoices({ status: statusFilter === 'all' ? undefined : statusFilter, search: searchTerm || undefined });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus invoice ini?')) {
      try { await deleteInvoice(id); } catch { alert('Gagal menghapus invoice'); }
    }
  };

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Invoices</h2>
          <p className="mt-1 text-sm text-gray-500">Kelola semua invoice pelanggan.</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link href="/invoices/new" className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />Buat Invoice
          </Link>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 sm:flex sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="relative rounded-md shadow-sm max-w-xs w-full flex">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input type="text" className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border" placeholder="Cari no. invoice atau customer..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Status:</label>
            <select className="mt-1 block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">Semua</option>
              <option value="draft">Draft</option>
              <option value="issued">Issued</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No. Invoice</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">Tidak ada invoice yang ditemukan.</td></tr>
              ) : invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{invoice.invoiceNo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(invoice.date)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{invoice.invoiceFor}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(invoice.total)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                        invoice.status === 'issued' ? 'bg-yellow-100 text-yellow-800' :
                        invoice.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'}`}>
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-3">
                      <Link href={`/invoices/${invoice.id}/print`} className="text-gray-500 hover:text-gray-900" title="Preview"><Eye className="w-4 h-4" /></Link>
                      <Link href={`/invoices/${invoice.id}/edit`} className="text-blue-600 hover:text-blue-900" title="Edit"><Edit2 className="w-4 h-4" /></Link>
                      <button onClick={() => handleDelete(invoice.id)} className="text-red-600 hover:text-red-900" title="Delete"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
