'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ClipboardList, Users, Building2, Package } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { cn } from '@/lib/utils';
import { ResetDemoDialog } from '@/components/ResetDemoDialog';

const navItems = [
  { name: 'Dashboard', href: '/', icon: Home, permission: 'viewDashboard' as const },
  { name: 'Work Orders', href: '/work-orders', icon: ClipboardList, permission: 'viewDashboard' as const },
];

export function Sidebar() {
  const pathname = usePathname();
  const { hasPermission, currentUser, resetDemoData } = useUser();
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  return (
    <aside className="bg-[#1E1520] border-r border-slate-800/50 w-64 min-h-screen flex flex-col">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-slate-800/50">
        <h1 className="text-2xl font-semibold tracking-tight text-[#F5F0EB]">
          HelloHive
        </h1>
        <p className="text-xs text-[#4A4953] mt-1">Facilities Operations</p>
      </div>

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
                      : 'text-[#F5F0EB] hover:bg-[#2C1F2F]'
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
      {currentUser.role === 'admin' && (
        <div className="p-4 border-t border-slate-800/50">
          <button
            onClick={() => setIsResetDialogOpen(true)}
            className="text-[#4A4953] hover:text-[#F5F0EB] text-sm font-medium transition-colors w-full text-left"
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
