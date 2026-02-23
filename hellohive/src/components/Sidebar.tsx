'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ClipboardList, Users, Building2, Package, X } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { cn } from '@/lib/utils';
import { ResetDemoDialog } from '@/components/ResetDemoDialog';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const navItems = [
  { name: 'Dashboard',   href: '/',            icon: Home,          permission: 'viewDashboard' as const },
  { name: 'Work Orders', href: '/work-orders', icon: ClipboardList, permission: 'viewDashboard' as const },
  { name: 'Vendors',     href: '/vendors',     icon: Users,         permission: 'viewDashboard' as const },
  { name: 'Properties',  href: '/properties',  icon: Building2,     permission: 'viewDashboard' as const },
  { name: 'Assets',      href: '/assets',      icon: Package,       permission: 'viewDashboard' as const },
];

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { hasPermission, currentUser, resetDemoData } = useUser();
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30',
          'lg:relative lg:z-auto',
          'bg-neutral-900 border-r border-slate-800/50 w-64 min-h-screen flex flex-col',
          'transition-transform duration-200 ease-out',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Mobile close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-white transition-colors lg:hidden"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo/Brand */}
        <Link
          href="/"
          onClick={onClose}
          className="p-6 border-b border-slate-800/50 block hover:bg-neutral-800/50 transition-colors cursor-pointer"
        >
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            HelloHive
          </h1>
          <p className="text-xs text-gray-400 mt-1">Facilities Operations</p>
        </Link>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              if (!hasPermission(item.permission)) {
                return null;
              }

              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 px-3 py-3 lg:py-2 rounded-md text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-[#F5C518]/10 text-[#F5C518] border-l-2 border-[#F5C518]'
                        : 'text-white hover:bg-neutral-800'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer - Reset Demo Data (Admin Only) */}
        {currentUser.role === 'Team-Admin' && (
          <div className="p-4 border-t border-slate-800/50">
            <button
              onClick={() => setIsResetDialogOpen(true)}
              className="text-gray-400 hover:text-white text-sm font-medium transition-colors w-full text-left"
            >
              Reset Demo Data
            </button>
          </div>
        )}

        {/* Reset Demo Dialog */}
        <ResetDemoDialog
          isOpen={isResetDialogOpen}
          onClose={() => setIsResetDialogOpen(false)}
          onConfirm={resetDemoData}
        />
      </aside>
    </>
  );
}
