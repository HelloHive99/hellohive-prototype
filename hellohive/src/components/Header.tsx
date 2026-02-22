'use client';

import { useState } from 'react';
import { ChevronDown, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useUser } from '@/context/UserContext';
import { users } from '@/data/seed-data';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

const roleLabels: Record<string, string> = {
  'Team-Admin': 'Admin',
  'Team-OpsCoordinator': 'Ops Coordinator',
  'Team-Viewer': 'Viewer',
  'Vendor-Admin': 'Vendor Admin',
  'Vendor-Tech': 'Vendor Tech',
};

const roleBadgeVariants: Record<string, 'completed' | 'in-progress' | 'open' | 'pending' | 'dispatched'> = {
  'Team-Admin': 'completed',
  'Team-OpsCoordinator': 'in-progress',
  'Team-Viewer': 'pending',
  'Vendor-Admin': 'open',
  'Vendor-Tech': 'dispatched',
};

const devPersonaSwitcherEnabled =
  process.env.NEXT_PUBLIC_DEV_PERSONA_SWITCHER === 'true';

export function Header() {
  const { currentUser, switchUser } = useUser();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header className="bg-neutral-900 border-b border-slate-800/50 h-16 px-6 flex items-center justify-between">
      <div className="flex-1" />

      {/* User Area */}
      <div className="relative flex items-center gap-3">
        {devPersonaSwitcherEnabled ? (
          /* Dev persona switcher — shown when NEXT_PUBLIC_DEV_PERSONA_SWITCHER=true */
          <>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 px-4 py-2 rounded-md hover:bg-neutral-800 transition-colors"
            >
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium text-white">
                  {currentUser.name}
                </span>
                <span className="text-xs text-gray-400">
                  {roleLabels[currentUser.role] ?? currentUser.role}
                </span>
              </div>
              <ChevronDown className={cn(
                'w-4 h-4 text-gray-400 transition-transform',
                isDropdownOpen && 'rotate-180'
              )} />
            </button>

            {isDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsDropdownOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-72 bg-neutral-800 border border-gray-700/40 ring-1 ring-white/5 ring-inset rounded-lg shadow-lg z-20">
                  <div className="p-2">
                    <div className="px-3 py-2 border-b border-gray-700/20 mb-2">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Switch User (Dev)
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
                            : 'text-white hover:bg-neutral-900'
                        )}
                      >
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{user.name}</span>
                          <span className="text-xs text-gray-400">
                            {user.organization}
                          </span>
                        </div>
                        <Badge variant={roleBadgeVariants[user.role] ?? 'open'}>
                          {roleLabels[user.role] ?? user.role}
                        </Badge>
                      </button>
                    ))}
                    <div className="border-t border-gray-700/20 mt-2 pt-2 px-1">
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          signOut({ callbackUrl: '/login' });
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-400 hover:text-white hover:bg-neutral-900 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          /* Production mode — show user info + sign out button */
          <>
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium text-white">{currentUser.name}</span>
              <span className="text-xs text-gray-400">{roleLabels[currentUser.role] ?? currentUser.role}</span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-gray-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </>
        )}
      </div>
    </header>
  );
}
