'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, Search, Eye, Edit2, Trash2, FileText } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ToastProvider';
import { EmptyState, ConfirmDialog, TableSkeleton } from '@/components/UI';

export default function InvoiceListPage() {
  const { invoices, fetchInvoices, deleteInvoice } = useStore();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loadingData, setLoadingData] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchInvoices({ status: statusFilter === 'all' ? undefined : statusFilter, search: searchTerm || undefined }).finally(() => setLoadingData(false));
  }, [statusFilter]);

  const handleSearch = () => {
    setLoadingData(true);
    fetchInvoices({ status: statusFilter === 'all' ? undefined : statusFilter, search: searchTerm || undefined }).finally(() => setLoadingData(false));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteInvoice(deleteTarget.id);
      showToast('Invoice berhasil dihapus');
      setDeleteTarget(null);
    } catch { showToast('Gagal menghapus invoice', 'error'); }
    setDeleting(false);
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      paid: 'bg-green-50 text-green-700 border-green-200',
      issued: 'bg-amber-50 text-amber-700 border-amber-200',
      cancelled: 'bg-red-50 text-red-700 border-red-200',
      draft: 'bg-gray-50 text-gray-600 border-gray-200',
    };
    const labels: Record<string, string> = {
      paid: 'Lunas',
      issued: 'Belum Bayar',
      cancelled: 'Dibatalkan',
      draft: 'Draft',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || styles.draft}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Invoices</h2>
          <p className="mt-1 text-sm text-gray-500">Kelola semua invoice pelanggan.</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link href="/invoices/new" className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4 mr-2" />Buat Invoice
          </Link>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 sm:flex sm:items-center sm:justify-between gap-3">
          <div className="relative rounded-lg max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" className="block w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Cari no. invoice atau customer..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600">Status:</label>
            <select className="text-sm border border-gray-200 rounded-lg py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">Semua</option>
              <option value="draft">Draft</option>
              <option value="issued">Belum Bayar</option>
              <option value="paid">Lunas</option>
              <option value="cancelled">Dibatalkan</option>
            </select>
          </div>
        </div>

        {loadingData ? (
          <TableSkeleton />
        ) : invoices.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Belum ada invoice"
            description={searchTerm || statusFilter !== 'all' ? 'Tidak ada invoice yang cocok dengan filter.' : 'Buat invoice pertama Anda untuk mulai menagih pelanggan.'}
            action={!searchTerm && statusFilter === 'all' && (
              <Link href="/invoices/new" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="w-4 h-4 mr-2" />Buat Invoice
              </Link>
            )}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">No. Invoice</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Tanggal</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900"><Link href={`/invoices/${invoice.id}/print`} className="hover:text-blue-600">{invoice.invoiceNo}</Link></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">{formatDate(invoice.date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{invoice.invoiceFor}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(invoice.total)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{statusBadge(invoice.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-1">
                        <Link href={`/invoices/${invoice.id}/print`} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" title="Preview"><Eye className="w-4 h-4" /></Link>
                        <Link href={`/invoices/${invoice.id}/edit`} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit"><Edit2 className="w-4 h-4" /></Link>
                        <button onClick={() => setDeleteTarget(invoice)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Hapus Invoice"
        message={`Apakah Anda yakin ingin menghapus invoice ${deleteTarget?.invoiceNo}? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
