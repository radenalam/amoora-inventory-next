'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, FileText, Package, Settings, LogOut, Menu, Bell, CheckSquare, Users } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useStore();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Invoices', href: '/invoices', icon: FileText },
    { name: 'Clients', href: '/clients', icon: Users },
    { name: 'Items', href: '/products', icon: Package },
    { name: 'Business Settings', href: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const currentPage = navigation.find(item =>
    item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
  )?.name || 'Dashboard';

  return (
    <div className="min-h-screen bg-[#f4f7fa] flex">
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div className={cn(
        "fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col items-center justify-center h-24 border-b border-gray-100 px-4">
          <h1 className="text-3xl font-serif italic text-gray-800 leading-none">Amoora</h1>
          <span className="text-[10px] tracking-[0.3em] text-gray-500 uppercase mt-1">Couture</span>
        </div>
        <div className="overflow-y-auto overflow-x-hidden flex-grow mt-4">
          <ul className="flex flex-col space-y-2 px-0">
            {navigation.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "relative flex flex-row items-center h-12 focus:outline-none text-gray-500 hover:text-gray-800 border-l-4 border-transparent px-6 transition-colors",
                      isActive && "bg-[#eef4ff] text-[#2563eb] border-[#2563eb] hover:bg-[#eef4ff] hover:text-[#1d4ed8]"
                    )}
                  >
                    <span className="inline-flex justify-center items-center">
                      <item.icon className="w-5 h-5" />
                    </span>
                    <span className="ml-4 text-sm font-medium">{item.name}</span>
                  </Link>
                </li>
              );
            })}
            <li className="mt-8">
              <button
                onClick={handleLogout}
                className="w-full relative flex flex-row items-center h-12 focus:outline-none text-gray-500 hover:text-gray-800 border-l-4 border-transparent px-6 transition-colors"
              >
                <span className="inline-flex justify-center items-center">
                  <LogOut className="w-5 h-5" />
                </span>
                <span className="ml-4 text-sm font-medium">Logout</span>
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gray-200 h-20 flex items-center justify-between px-4 sm:px-8">
          <div className="flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="text-gray-500 hover:text-gray-700 focus:outline-none lg:hidden mr-4"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-semibold text-gray-800 hidden sm:block">{currentPage}</h2>
          </div>
          <div className="flex-1 flex justify-end items-center space-x-6">
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600 hidden sm:block">
                Welcome, <span className="font-medium text-gray-800">{user?.name || 'User'}</span>
              </span>
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center border border-gray-200">
                <span className="text-sm font-medium text-blue-600">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-gray-400">
              <button className="hover:text-gray-600 transition-colors">
                <Bell className="w-5 h-5" />
              </button>
              <button className="hover:text-gray-600 transition-colors">
                <CheckSquare className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
