'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ClipboardList, Users, Building2, Package } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Dashboard', href: '/', icon: Home, permission: 'viewDashboard' as const },
  { name: 'Work Orders', href: '/work-orders', icon: ClipboardList, permission: 'viewDashboard' as const },
  { name: 'Vendors', href: '/vendors', icon: Users, permission: 'manageVendors' as const },
  { name: 'Properties', href: '/properties', icon: Building2, permission: 'viewDashboard' as const },
  { name: 'Assets', href: '/assets', icon: Package, permission: 'viewDashboard' as const },
];

export function Sidebar() {
  const pathname = usePathname();
  const { hasPermission } = useUser();

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
    </aside>
  );
}
