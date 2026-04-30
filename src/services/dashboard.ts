import { apiGet } from './api';

export interface DashboardStats {
  openCount: number;
  openTotal: number;
  paidCount: number;
  paidTotal: number;
  pendingCount: number;
  pendingTotal: number;
  totalCount: number;
  totalAmount: number;
  monthRevenue: number;
  recentInvoices: any[];
  topProducts: any[];
  monthlyRevenue: { name: string; revenue: number }[];
}

export async function getStats(): Promise<DashboardStats> {
  return apiGet<DashboardStats>('/api/dashboard/stats');
}
