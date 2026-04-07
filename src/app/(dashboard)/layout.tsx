import AuthProvider from './AuthProvider';
import DashboardLayout from './DashboardLayout';

export default function DashboardGroup({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </AuthProvider>
  );
}
