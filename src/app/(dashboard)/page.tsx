'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { formatCurrency, formatDate } from '@/lib/utils';
import { FileText, CheckCircle, Clock, Plus, Package, Users, Settings } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const { invoices, products, fetchInvoices, fetchProducts } = useStore();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchInvoices();
    fetchProducts();
    fetch('/api/dashboard/stats', { headers: { Authorization: `Bearer ${localStorage.getItem('amoora_token')}` } })
      .then(r => r.json())
      .then(setStats)
      .catch(() => {});
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
    .slice(0, 4);

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
    { name: 'Open Invoices', count: openCount, value: formatCurrency(openTotal), icon: FileText, color: 'text-blue-500', bg: 'bg-blue-100' },
    { name: 'Paid Invoices', count: paidCount, value: formatCurrency(paidTotal), icon: CheckCircle, color: 'text-orange-500', bg: 'bg-orange-100' },
    { name: 'Pending Payments', count: pendingCount, value: formatCurrency(pendingTotal), icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-100' },
    { name: 'Total Invoices', count: totalCount, value: formatCurrency(totalAmount), icon: FileText, color: 'text-teal-500', bg: 'bg-teal-100' },
  ];

  const colors = ['bg-[#4285F4]', 'bg-[#EA4335]', 'bg-[#34A853]', 'bg-[#7B61FF]'];
  const maxProductTotal = Math.max(...topProducts.map((p: any) => p.total), 1);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((item) => (
          <div key={item.name} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm flex flex-col">
            <div className="flex items-center space-x-3 mb-4">
              <div className={`rounded-full p-2 ${item.bg}`}>
                <item.icon className={`h-5 w-5 ${item.color}`} aria-hidden="true" />
              </div>
              <h3 className="text-sm font-medium text-gray-600">{item.name}</h3>
            </div>
            <div className="mt-auto">
              <p className="text-3xl font-bold text-gray-800 mb-1">{item.count}</p>
              <p className="text-sm font-medium text-gray-500">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col">
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-800">Recent Invoices</h3>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="min-w-full divide-y divide-gray-100">
              <thead>
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500">Invoice #</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500">Client</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500">Due Date</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                      Belum ada invoice.
                    </td>
                  </tr>
                ) : (
                  recentInvoices.map((invoice: any) => (
                    <tr key={invoice.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{invoice.invoiceNo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                        {invoice.invoiceFor.split('\n')[0]}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-3 py-1 inline-flex text-xs font-medium rounded-md
                          ${invoice.status === 'paid' ? 'bg-[#e6f4ea] text-[#1e8e3e]' :
                            invoice.status === 'issued' ? 'bg-[#fef7e0] text-[#f29900]' :
                            invoice.status === 'cancelled' ? 'bg-[#fce8e6] text-[#d93025]' :
                            'bg-gray-100 text-gray-600'}`}>
                          {invoice.status === 'issued' ? 'Unpaid' : invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {invoice.dueDate ? formatDate(invoice.dueDate) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                        {formatCurrency(invoice.total)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-gray-100 text-right">
            <Link href="/invoices" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              View All &gt;
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col">
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-800">Quick Actions</h3>
          </div>
          <div className="p-6 space-y-3">
            <Link href="/invoices/new" className="w-full flex items-center justify-center space-x-2 bg-[#4285F4] hover:bg-blue-600 text-white py-3 px-4 rounded-lg transition-colors font-medium">
              <Plus className="w-5 h-5" />
              <span>New Invoice</span>
            </Link>
            <Link href="/products" className="w-full flex items-center space-x-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-3 px-4 rounded-lg transition-colors font-medium">
              <Package className="w-5 h-5 text-gray-400" />
              <span>Add Item</span>
            </Link>
            <Link href="/clients" className="w-full flex items-center space-x-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-3 px-4 rounded-lg transition-colors font-medium">
              <Users className="w-5 h-5 text-gray-400" />
              <span>Manage Clients</span>
            </Link>
            <Link href="/settings" className="w-full flex items-center space-x-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-3 px-4 rounded-lg transition-colors font-medium">
              <Settings className="w-5 h-5 text-gray-400" />
              <span>Business Settings</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col">
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-800">Top Products</h3>
          </div>
          <div className="p-6 flex-1 flex flex-col justify-center space-y-6">
            {topProducts.length > 0 ? topProducts.map((product: any, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <div className="w-1/3 text-sm font-medium text-gray-700 truncate pr-4">{product.name}</div>
                <div className="flex-1 flex items-center">
                  <div className="w-full bg-gray-100 rounded-full h-4 flex">
                    <div className={`h-4 rounded-full ${colors[index % colors.length]}`} style={{ width: `${Math.max(10, (product.total / maxProductTotal) * 100)}%` }}></div>
                  </div>
                </div>
                <div className="w-1/3 text-right text-sm font-medium text-gray-600 pl-4">{formatCurrency(product.total)}</div>
              </div>
            )) : (
              <div className="text-center text-gray-500 text-sm py-4">Belum ada data penjualan produk.</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col">
          <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-base font-semibold text-gray-800">Monthly Revenue</h3>
            <div className="text-sm font-bold text-[#4285F4]">Rp 32M ▾</div>
          </div>
          <div className="p-6 flex-1">
            <div className="text-xs text-gray-400 mb-2">Rp</div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={false} />
                  <Tooltip formatter={(value: any) => formatCurrency(Number(value))} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Line type="monotone" dataKey="revenue" stroke="#4285F4" strokeWidth={3} dot={{ r: 4, fill: 'white', stroke: '#4285F4', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
