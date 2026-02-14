'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, users as seedUsers, workOrders } from '@/data/seed-data';

export type Permission =
  | 'viewDashboard'
  | 'viewCostData'
  | 'createWorkOrders'
  | 'voiceIntake'
  | 'dispatchVendors'
  | 'updateWorkOrderStatus'
  | 'viewAllWorkOrders'
  | 'manageVendors'
  | 'systemSettings';

interface UserContextType {
  currentUser: User;
  switchUser: (userId: string) => void;
  hasPermission: (permission: Permission) => boolean;
  getAccessibleWorkOrders: () => typeof workOrders;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Permission Matrix from Build Plan
const rolePermissions: Record<string, Permission[]> = {
  admin: [
    'viewDashboard',
    'viewCostData',
    'createWorkOrders',
    'voiceIntake',
    'dispatchVendors',
    'updateWorkOrderStatus',
    'viewAllWorkOrders',
    'manageVendors',
    'systemSettings',
  ],
  'ops-coordinator': [
    'viewDashboard',
    'createWorkOrders',
    'voiceIntake',
    'dispatchVendors',
    'updateWorkOrderStatus',
    'viewAllWorkOrders',
  ],
  technician: ['updateWorkOrderStatus'],
  viewer: ['viewDashboard', 'viewCostData', 'viewAllWorkOrders'],
  vendor: ['updateWorkOrderStatus'],
};

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(seedUsers[0]); // Default: Marcus Reyes (Admin)

  const switchUser = (userId: string) => {
    const user = seedUsers.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
    }
  };

  const hasPermission = (permission: Permission): boolean => {
    const userPermissions = rolePermissions[currentUser.role] || [];
    return userPermissions.includes(permission);
  };

  const getAccessibleWorkOrders = () => {
    // Admin, Ops Coordinator, Viewer: see all work orders
    if (hasPermission('viewAllWorkOrders')) {
      return workOrders;
    }

    // Technician: see only assigned work orders
    if (currentUser.role === 'technician') {
      return workOrders.filter((wo) => wo.assignedTechnicianId === currentUser.id);
    }

    // Vendor: see only their assigned work orders
    if (currentUser.role === 'vendor') {
      return workOrders.filter((wo) => wo.assignedVendorId === currentUser.id);
    }

    return [];
  };

  return (
    <UserContext.Provider
      value={{
        currentUser,
        switchUser,
        hasPermission,
        getAccessibleWorkOrders,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
