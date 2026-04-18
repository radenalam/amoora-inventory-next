'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { formatCurrency, formatDate } from '@/lib/utils';
import { FileText, CheckCircle, Clock, Plus, Package, Users, Settings, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StatCardsSkeleton, Skeleton } from '@/components/UI';

export default function DashboardPage() {
  const { invoices, products, fetchInvoices, fetchProducts } = useStore();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchInvoices(),
      fetchProducts(),
      fetch('/api/dashboard/stats', { headers: { Authorization: `Bearer ${localStorage.getItem('amoora_token')}` } })
        .then(r => r.json()).catch(() => null),
    ]).then(([_, __, statsData]) => {
      setStats(statsData);
      setLoading(false);
    });
  }, []);

  const openCount = stats?.openCount ?? invoices.filter((i) => i.status === 'draft' || i.status === 'issued').length;
  const openTotal = stats?.openTotal ?? invoices.filter((i) => i.status === 'draft' || i.status === 'issued').reduce((s, i) => s + i.total, 0);
  const paidCount = stats?.paidCount ?? invoices.filter((i) => i.status === 'paid').length;
  const paidTotal = stats?.paidTotal ?? invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.total, 0);
  const pendingCount = stats?.pendingCount ?? invoices.filter((i) => i.status === 'issued').length;
  const pendingTotal = stats?.pendingTotal ?? invoices.filter((i) => i.status === 'issued').reduce((s, i) => s + i.total, 0);
  const totalCount = invoices.length;
  const totalAmount = invoices.reduce((s, i) => s + i.total, 0);

  const recentInvoices = stats?.recentInvoices ?? [...invoices]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const topProducts = stats?.topProducts ?? [];

  const monthlyData = [
    { name: 'Jan', revenue: 12000000 },
    { name: 'Feb', revenue: 15000000 },
    { name: 'Mar', revenue: 18000000 },
    { name: 'Apr', revenue: 16000000 },
    { name: 'May', revenue: 24000000 },
    { name: 'Jun', revenue: 22000000 },
    { name: 'Jul', revenue: 32000000 },
  ];

  const statCards = [
    { name: 'Invoice Terbuka', count: openCount, value: formatCurrency(openTotal), icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'Invoice Lunas', count: paidCount, value: formatCurrency(paidTotal), icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { name: 'Menunggu Bayar', count: pendingCount, value: formatCurrency(pendingTotal), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { name: 'Total Invoice', count: totalCount, value: formatCurrency(totalAmount), icon: FileText, color: 'text-violet-600', bg: 'bg-violet-50' },
  ];

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      paid: 'bg-green-50 text-green-700',
      issued: 'bg-amber-50 text-amber-700',
      cancelled: 'bg-red-50 text-red-700',
      draft: 'bg-gray-50 text-gray-600',
    };
    const labels: Record<string, string> = { paid: 'Lunas', issued: 'Belum Bayar', cancelled: 'Dibatalkan', draft: 'Draft' };
    return <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${styles[status] || styles.draft}`}>{labels[status] || status}</span>;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {loading ? (
        <>
          <StatCardsSkeleton />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6"><Skeleton className="h-4 w-32 mb-6" /><Skeleton className="h-64 w-full" /></div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6"><Skeleton className="h-4 w-28 mb-6" /><Skeleton className="h-48 w-full" /></div>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((item) => (
              <div key={item.name} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`rounded-xl p-2.5 ${item.bg}`}>
                    <item.icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                  <span className="text-sm font-medium text-gray-500">{item.name}</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{item.count}</p>
                <p className="text-sm text-gray-500 mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col">
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-800">Invoice Terbaru</h3>
                <Link href="/invoices" className="text-sm text-blue-600 hover:text-blue-700 font-medium">Lihat Semua →</Link>
              </div>
              <div className="overflow-x-auto flex-1">
                {recentInvoices.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <FileText className="w-10 h-10 mb-2" />
                    <p className="text-sm">Belum ada invoice</p>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-50">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Invoice</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Client</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Jatuh Tempo</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {recentInvoices.map((invoice: any) => (
                        <tr key={invoice.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-3 whitespace-nowrap text-sm font-semibold text-gray-900"><Link href={`/invoices/${invoice.id}/print`} className="hover:text-blue-600">{invoice.invoiceNo}</Link></td>
                          <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600 hidden sm:table-cell">{invoice.invoiceFor.split('\n')[0]}</td>
                          <td className="px-6 py-3 whitespace-nowrap">{statusBadge(invoice.status)}</td>
                          <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">{invoice.dueDate ? formatDate(invoice.dueDate) : '-'}</td>
                          <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">{formatCurrency(invoice.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="px-6 py-5 border-b border-gray-100">
                <h3 className="text-base font-semibold text-gray-800">Aksi Cepat</h3>
              </div>
              <div className="p-5 space-y-2">
                <Link href="/invoices/new" className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl transition-colors font-medium shadow-sm">
                  <Plus className="w-5 h-5" /><span>Buat Invoice</span>
                </Link>
                <Link href="/products" className="w-full flex items-center gap-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-3 px-4 rounded-xl transition-colors font-medium">
                  <Package className="w-5 h-5 text-gray-400" /><span>Kelola Produk</span>
                </Link>
                <Link href="/clients" className="w-full flex items-center gap-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-3 px-4 rounded-xl transition-colors font-medium">
                  <Users className="w-5 h-5 text-gray-400" /><span>Kelola Client</span>
                </Link>
                <Link href="/settings" className="w-full flex items-center gap-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-3 px-4 rounded-xl transition-colors font-medium">
                  <Settings className="w-5 h-5 text-gray-400" /><span>Pengaturan</span>
                </Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="px-6 py-5 border-b border-gray-100">
                <h3 className="text-base font-semibold text-gray-800">Produk Terlaris</h3>
              </div>
              <div className="p-6 space-y-5">
                {topProducts.length > 0 ? topProducts.map((product: any, index: number) => {
                  const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-violet-500'];
                  const maxTotal = Math.max(...topProducts.map((p: any) => p.total), 1);
                  return (
                    <div key={index} className="flex items-center gap-4">
                      <span className="text-sm font-semibold text-gray-400 w-5 text-center">{index + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium text-gray-800 truncate">{product.name}</span>
                          <span className="text-sm font-semibold text-gray-600 ml-2">{formatCurrency(product.total)}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className={`h-2 rounded-full ${colors[index % colors.length]} transition-all`} style={{ width: `${Math.max(10, (product.total / maxTotal) * 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                    <Package className="w-10 h-10 mb-2" />
                    <p className="text-sm">Belum ada data penjualan</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-base font-semibold text-gray-800">Pendapatan Bulanan</h3>
                <div className="text-sm font-bold text-blue-600">Rp 32M ▾</div>
              </div>
              <div className="p-6">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={false} />
                      <Tooltip formatter={(value: any) => formatCurrency(Number(value))} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '13px' }} />
                      <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: 'white', stroke: '#3b82f6', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
