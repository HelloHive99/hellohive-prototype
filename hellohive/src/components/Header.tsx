'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { users } from '@/data/seed-data';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  'ops-coordinator': 'Ops Coordinator',
  technician: 'Technician',
  viewer: 'Viewer',
  vendor: 'Vendor',
};

const roleBadgeVariants: Record<string, 'completed' | 'in-progress' | 'open' | 'pending' | 'dispatched'> = {
  admin: 'completed',
  'ops-coordinator': 'in-progress',
  technician: 'dispatched',
  viewer: 'pending',
  vendor: 'open',
};

export function Header() {
  const { currentUser, switchUser } = useUser();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header className="bg-[#1E1520] border-b border-slate-800/50 h-16 px-6 flex items-center justify-between">
      <div className="flex-1" />

      {/* User Switcher */}
      <div className="relative">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-3 px-4 py-2 rounded-md hover:bg-[#2C1F2F] transition-colors"
        >
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium text-[#F5F0EB]">
              {currentUser.name}
            </span>
            <span className="text-xs text-[#4A4953]">
              {roleLabels[currentUser.role]}
            </span>
          </div>
          <ChevronDown className={cn(
            'w-4 h-4 text-[#4A4953] transition-transform',
            isDropdownOpen && 'rotate-180'
          )} />
        </button>

        {/* Dropdown */}
        {isDropdownOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsDropdownOpen(false)}
            />

            {/* Dropdown Menu */}
            <div className="absolute right-0 mt-2 w-72 bg-[#2C1F2F] border border-[#4A4953]/40 ring-1 ring-white/5 ring-inset rounded-lg shadow-lg z-20">
              <div className="p-2">
                <div className="px-3 py-2 border-b border-[#4A4953]/20 mb-2">
                  <p className="text-xs font-medium text-[#4A4953] uppercase tracking-wider">
                    Switch User
                  </p>
                </div>
                {users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => {
                      switchUser(user.id);
                      setIsDropdownOpen(false);
                    }}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors',
                      currentUser.id === user.id
                        ? 'bg-[#F5C518]/10 text-[#F5C518]'
                        : 'text-[#F5F0EB] hover:bg-[#1E1520]'
                    )}
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{user.name}</span>
                      <span className="text-xs text-[#4A4953]">
                        {user.organization}
                      </span>
                    </div>
                    <Badge variant={roleBadgeVariants[user.role]}>
                      {roleLabels[user.role]}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
