'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, users as seedUsers, workOrders as seedWorkOrders, activityFeed as seedActivityFeed, WorkOrder, ActivityFeedItem } from '@/data/seed-data';

// Store original seed data snapshots for demo reset
const ORIGINAL_WORK_ORDERS = [...seedWorkOrders];
const ORIGINAL_ACTIVITY_FEED = [...seedActivityFeed];

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
  getAccessibleWorkOrders: () => WorkOrder[];
  getAllWorkOrders: () => WorkOrder[];
  getActivityFeed: () => ActivityFeedItem[];
  addWorkOrder: (wo: WorkOrder) => void;
  addActivityFeedItem: (item: ActivityFeedItem) => void;
  updateWorkOrder: (id: string, updates: Partial<WorkOrder>) => void;
  resetDemoData: () => void;
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
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(seedWorkOrders);
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>(seedActivityFeed);

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

  const getAllWorkOrders = () => workOrders;

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

  const getActivityFeed = () => activityFeed;

  const addWorkOrder = (wo: WorkOrder) => {
    setWorkOrders((prev) => [wo, ...prev]);
  };

  const addActivityFeedItem = (item: ActivityFeedItem) => {
    setActivityFeed((prev) => [item, ...prev]);
  };

  const updateWorkOrder = (id: string, updates: Partial<WorkOrder>) => {
    setWorkOrders((prev) =>
      prev.map((wo) =>
        wo.id === id
          ? { ...wo, ...updates, updatedAt: new Date().toISOString() }
          : wo
      )
    );
  };

  const resetDemoData = () => {
    setWorkOrders([...ORIGINAL_WORK_ORDERS]);
    setActivityFeed([...ORIGINAL_ACTIVITY_FEED]);
    setCurrentUser(seedUsers[0]); // Reset to Marcus Reyes (Admin)
  };

  return (
    <UserContext.Provider
      value={{
        currentUser,
        switchUser,
        hasPermission,
        getAccessibleWorkOrders,
        getAllWorkOrders,
        getActivityFeed,
        addWorkOrder,
        addActivityFeedItem,
        updateWorkOrder,
        resetDemoData,
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
