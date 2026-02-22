'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ClipboardList, Users, Building2, Package } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { cn } from '@/lib/utils';
import { ResetDemoDialog } from '@/components/ResetDemoDialog';

const navItems = [
  { name: 'Dashboard',   href: '/',            icon: Home,          permission: 'viewDashboard' as const },
  { name: 'Work Orders', href: '/work-orders', icon: ClipboardList, permission: 'viewDashboard' as const },
  { name: 'Vendors',     href: '/vendors',     icon: Users,         permission: 'viewDashboard' as const },
  { name: 'Properties',  href: '/properties',  icon: Building2,     permission: 'viewDashboard' as const },
  { name: 'Assets',      href: '/assets',      icon: Package,       permission: 'viewDashboard' as const },
];

export function Sidebar() {
  const pathname = usePathname();
  const { hasPermission, currentUser, resetDemoData } = useUser();
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  return (
    <aside className="bg-neutral-900 border-r border-slate-800/50 w-64 min-h-screen flex flex-col">
      {/* Logo/Brand */}
      <Link href="/" className="p-6 border-b border-slate-800/50 block hover:bg-neutral-800/50 transition-colors cursor-pointer">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          HelloHive
        </h1>
        <p className="text-xs text-gray-400 mt-1">Facilities Operations</p>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            // Show item if user has the required permission
            if (!hasPermission(item.permission)) {
              return null;
            }

            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
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
  );
}
