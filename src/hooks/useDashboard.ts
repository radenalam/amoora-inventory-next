import { useQuery } from '@tanstack/react-query';
import { getStats, type DashboardStats } from '@/services/dashboard';

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ['dashboard', 'stats'],
    queryFn: getStats,
    staleTime: 30 * 1000,
  });
}
