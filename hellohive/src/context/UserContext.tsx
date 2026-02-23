'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const CONVERSATIONS_STORAGE_KEY = 'hellohive-conversations';
import { User, users as seedUsers, workOrders as seedWorkOrders, activityFeed as seedActivityFeed, vendors as seedVendors, technicians as seedTechnicians, properties as seedProperties, conversations as seedConversations, WorkOrder, ActivityFeedItem, Vendor, Technician, Property, Asset, Conversation, Message } from '@/data/seed-data';
import { rolePermissions, type Permission } from '@/lib/permissions';
import type { WorkOrderEventType, WorkOrderEvent, TransitionResult, Blocker } from '@/lib/workorder-types';
import { SYSTEM_ACTOR } from '@/lib/workorder-types';
import { transitionWorkOrder, canAppendEvent, getNextState } from '@/lib/workorder-machine';
import { createEvent, getAutoBlockerEffects } from '@/lib/workorder-events';

// Re-export Permission for backward compatibility with components importing from here
export type { Permission } from '@/lib/permissions';

// Store original seed data snapshots for demo reset
const ORIGINAL_WORK_ORDERS = [...seedWorkOrders];
const ORIGINAL_ACTIVITY_FEED = [...seedActivityFeed];
const ORIGINAL_VENDORS = [...seedVendors];
const ORIGINAL_TECHNICIANS = [...seedTechnicians];
const ORIGINAL_PROPERTIES = [...seedProperties];
const ORIGINAL_CONVERSATIONS = [...seedConversations];

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

  // Vendor management
  getAllVendors: () => Vendor[];
  getVendorById: (id: string) => Vendor | undefined;
  addVendor: (vendor: Vendor) => void;
  updateVendor: (id: string, updates: Partial<Vendor>) => void;
  deleteVendor: (id: string) => void;

  // Technician management
  getAllTechnicians: () => Technician[];
  getTechniciansByVendor: (vendorId: string) => Technician[];
  getTechnicianById: (id: string) => Technician | undefined;
  addTechnician: (tech: Technician) => void;
  updateTechnician: (id: string, updates: Partial<Technician>) => void;
  deleteTechnician: (id: string) => void;

  // Property management
  getAllProperties: () => Property[];
  getPropertyById: (id: string) => Property | undefined;
  addProperty: (property: Property) => void;
  updateProperty: (id: string, updates: Partial<Property>) => void;
  deleteProperty: (id: string) => void;

  // Asset management
  getAllAssets: () => Asset[];
  getAssetById: (id: string) => Asset | undefined;
  addAsset: (asset: Asset, spaceId: string) => void;
  updateAsset: (id: string, updates: Partial<Asset>) => void;
  retireAsset: (id: string, reason?: string) => void;
  deleteAsset: (id: string) => void;
  bulkUpdateAssets: (ids: string[], updates: Partial<Asset>) => void;
  bulkRetireAssets: (ids: string[], reason?: string) => void;

  // Vendor-Admin self-service technician management
  addVendorTechnician: (tech: Technician) => void;
  updateVendorTechnician: (techId: string, updates: Partial<Technician>) => void;
  removeVendorTechnician: (techId: string) => void;

  // v3.1 Work Order lifecycle
  performTransition: (
    workOrderId: string,
    eventType: WorkOrderEventType,
    notes?: string,
    metadata?: Record<string, unknown>,
  ) => TransitionResult;
  appendWorkOrderEvent: (
    workOrderId: string,
    eventType: WorkOrderEventType,
    notes?: string,
    metadata?: Record<string, unknown>,
  ) => void;

  // Messaging
  conversations: Conversation[];
  getConversationByWorkOrder: (woId: string) => Conversation | undefined;
  getDirectConversations: () => Conversation[];
  getUnreadCount: (conversationId: string) => number;
  getTotalUnreadCount: () => number;
  sendMessage: (conversationId: string, body: string) => void;
  markConversationRead: (conversationId: string) => void;
  createWorkOrderConversation: (woId: string, participantIds: string[], participantNames: string[]) => Conversation;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({
  children,
  initialUser,
}: {
  children: ReactNode;
  initialUser?: User;
}) {
  const [currentUser, setCurrentUser] = useState<User>(initialUser ?? seedUsers[0]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(seedWorkOrders);
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>(seedActivityFeed);
  const [vendors, setVendors] = useState<Vendor[]>(seedVendors);
  const [technicians, setTechnicians] = useState<Technician[]>(seedTechnicians);
  const [properties, setProperties] = useState<Property[]>(seedProperties);
  const [conversations, setConversations] = useState<Conversation[]>(seedConversations);

  // Hydrate conversations from localStorage on mount (survives login/logout cycles)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONVERSATIONS_STORAGE_KEY);
      if (stored) setConversations(JSON.parse(stored) as Conversation[]);
    } catch {
      // ignore parse errors — fall back to seed data
    }
  }, []);

  // Persist conversations to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(conversations));
    } catch {
      // ignore storage errors (e.g. private browsing quota)
    }
  }, [conversations]);

  // Real-time cross-tab sync: when another tab writes to localStorage, update this tab's state.
  // The 'storage' event fires in every tab EXCEPT the one that made the change.
  useEffect(() => {
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === CONVERSATIONS_STORAGE_KEY && e.newValue) {
        try {
          setConversations(JSON.parse(e.newValue) as Conversation[]);
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('storage', handleStorageEvent);
    return () => window.removeEventListener('storage', handleStorageEvent);
  }, []);

  const devPersonaSwitcherEnabled =
    process.env.NEXT_PUBLIC_DEV_PERSONA_SWITCHER === 'true';

  const switchUser = (userId: string) => {
    if (!devPersonaSwitcherEnabled) return; // no-op in production
    const user = seedUsers.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
    }
  };

  const hasPermission = (permission: Permission): boolean => {
    const userPermissions = rolePermissions[currentUser.role as keyof typeof rolePermissions] || [];
    return userPermissions.includes(permission);
  };

  const getAllWorkOrders = () => workOrders;

  const getAccessibleWorkOrders = () => {
    // Admin, Ops Coordinator, Viewer: see all work orders
    if (hasPermission('viewAllWorkOrders')) {
      return workOrders;
    }

    // Vendor-Tech: see only assigned work orders
    if (currentUser.role === 'Vendor-Tech') {
      return workOrders.filter((wo) => wo.assignedTechnicianId === currentUser.id);
    }

    // Vendor-Admin: see work orders assigned to their company
    if (currentUser.role === 'Vendor-Admin') {
      const vendorIds = currentUser.associatedVendorIds ?? [];
      return workOrders.filter((wo) => vendorIds.includes(wo.assignedVendorId ?? ''));
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
      prev.map((wo) => {
        if (wo.id !== id) return wo;
        const enriched = { ...updates };
        if (updates.status === 'dispatched' && !wo.dispatchedAt) {
          enriched.dispatchedAt = new Date().toISOString();
        }
        if (updates.status === 'in-progress' && !wo.startedAt) {
          enriched.startedAt = new Date().toISOString();
        }
        if (updates.status === 'closed' && !wo.completedAt) {
          enriched.completedAt = new Date().toISOString();
        }
        return { ...wo, ...enriched, updatedAt: new Date().toISOString() };
      })
    );
  };

  // v3.1: Transition a work order through the state machine
  const performTransition = (
    workOrderId: string,
    eventType: WorkOrderEventType,
    notes?: string,
    metadata?: Record<string, unknown>,
  ): TransitionResult => {
    const wo = workOrders.find(w => w.id === workOrderId);
    if (!wo) return { success: false, error: 'Work order not found' };

    const actor = {
      role: currentUser.role,
      id: currentUser.id,
      displayName: currentUser.name,
    };

    // Enrich metadata for FACILITY_APPROVED with cost/vendor info
    const enrichedMeta = { ...metadata };
    if (eventType === 'FACILITY_APPROVED') {
      enrichedMeta.amount = wo.actualCost ?? wo.estimatedCost ?? wo.cost;
      enrichedMeta.vendorId = wo.assignedVendorId;
    }

    const result = transitionWorkOrder(wo.status, eventType, actor, notes, enrichedMeta);
    if (!result.success || !result.events) return result;

    const newState = getNextState(wo.status, eventType);
    if (!newState) return { success: false, error: 'Could not determine next state' };

    // Build update payload
    const updates: Partial<WorkOrder> = {
      status: newState,
      events: [...wo.events, ...result.events],
      updatedAt: new Date().toISOString(),
    };

    // Timestamp enrichment
    if (newState === 'dispatched' && !wo.dispatchedAt) {
      updates.dispatchedAt = result.events[0].at;
    }
    if (newState === 'in-progress' && !wo.startedAt) {
      updates.startedAt = result.events[0].at;
    }
    if (newState === 'closed') {
      updates.completedAt = result.events[0].at;
    }

    // DISPATCHED: set vendor IDs
    if (eventType === 'DISPATCHED' && metadata?.selectedVendorId) {
      updates.selectedVendorId = metadata.selectedVendorId as string;
      updates.assignedVendorId = metadata.selectedVendorId as string;
    }

    // VENDOR_REASSIGNED: clear old vendor/tech, set new
    if (eventType === 'VENDOR_REASSIGNED' && metadata?.newVendorId) {
      updates.selectedVendorId = metadata.newVendorId as string;
      updates.assignedVendorId = metadata.newVendorId as string;
      updates.assignedTechnicianId = undefined;
      updates.blocker = undefined;
    }

    // TECH_MARKED_COMPLETE: capture actualCost
    if (eventType === 'TECH_MARKED_COMPLETE' && metadata?.actualCost !== undefined) {
      updates.actualCost = metadata.actualCost as number;
    }

    // FACILITY_APPROVED: payment hook + cost approval
    if (eventType === 'FACILITY_APPROVED') {
      updates.payment = {
        status: 'triggered',
        triggeredAt: result.events[0].at,
        amount: wo.actualCost ?? wo.estimatedCost ?? wo.cost ?? 0,
        vendorId: wo.assignedVendorId ?? '',
      };
      updates.costApprovedBy = {
        role: currentUser.role,
        id: currentUser.id,
        at: result.events[0].at,
      };
    }

    // Apply update
    updateWorkOrder(workOrderId, updates);

    // Backward compat: also add to global activity feed
    addActivityFeedItem({
      id: `activity-${Date.now()}`,
      workOrderId,
      message: `${eventType.replace(/_/g, ' ').toLowerCase()} by ${currentUser.name}`,
      timestamp: result.events[0].at,
      userId: currentUser.id,
    });

    return result;
  };

  // v3.1: Append a non-transition event (notes, blockers, cost updates, etc.)
  const appendWorkOrderEvent = (
    workOrderId: string,
    eventType: WorkOrderEventType,
    notes?: string,
    metadata?: Record<string, unknown>,
  ): void => {
    const wo = workOrders.find(w => w.id === workOrderId);
    if (!wo) return;

    // Permission check (system events bypass)
    const actor = {
      role: currentUser.role,
      id: currentUser.id,
      displayName: currentUser.name,
    };

    if (!canAppendEvent(eventType, actor.role as string)) {
      console.error(`Permission denied: ${actor.role} cannot perform ${eventType}`);
      return;
    }

    const event = createEvent(eventType, actor, notes, metadata);
    const allNewEvents = [event];

    // Auto-blocker side effects
    const blockerEffects = getAutoBlockerEffects(eventType, wo.blocker, actor, metadata);
    allNewEvents.push(...blockerEffects.sideEffectEvents);

    const updates: Partial<WorkOrder> = {
      events: [...wo.events, ...allNewEvents],
      updatedAt: new Date().toISOString(),
    };

    // Apply blocker changes
    if (blockerEffects.setBlocker) {
      updates.blocker = blockerEffects.setBlocker;
    }
    if (blockerEffects.clearBlocker) {
      updates.blocker = undefined;
    }

    // TECH_ASSIGNED: update assignedTechnicianId
    if (eventType === 'TECH_ASSIGNED' && metadata?.technicianId) {
      updates.assignedTechnicianId = metadata.technicianId as string;
    }

    // ETA_UPDATED: update vendorReportedEta
    if (eventType === 'ETA_UPDATED' && metadata?.eta) {
      updates.vendorReportedEta = metadata.eta as string;
    }

    // PRIORITY_CHANGED: update priority
    if (eventType === 'PRIORITY_CHANGED' && metadata?.newPriority) {
      (updates as Record<string, unknown>).priority = metadata.newPriority as string;
    }

    // COST_ESTIMATE_UPDATED: update estimatedCost
    if (eventType === 'COST_ESTIMATE_UPDATED' && metadata?.newEstimate !== undefined) {
      updates.estimatedCost = metadata.newEstimate as number;
    }

    // SCOPE_CHANGE_REQUESTED: add to scopeChanges
    if (eventType === 'SCOPE_CHANGE_REQUESTED' && metadata) {
      const scopeChange = {
        id: event.id,
        requestedAt: event.at,
        requestedBy: { role: actor.role, id: actor.id },
        description: (metadata.description as string) ?? '',
        revisedEstimate: metadata.revisedEstimate as number | undefined,
        status: 'pending' as const,
      };
      updates.scopeChanges = [...wo.scopeChanges, scopeChange];
    }

    // SCOPE_CHANGE_APPROVED: update scope change status + estimatedCost
    if (eventType === 'SCOPE_CHANGE_APPROVED' && metadata?.scopeChangeId) {
      updates.scopeChanges = wo.scopeChanges.map(sc =>
        sc.id === metadata.scopeChangeId
          ? {
              ...sc,
              status: 'approved' as const,
              resolvedAt: event.at,
              resolvedBy: { role: actor.role, id: actor.id },
            }
          : sc
      );
      const approved = wo.scopeChanges.find(sc => sc.id === metadata.scopeChangeId);
      if (approved?.revisedEstimate !== undefined) {
        updates.estimatedCost = approved.revisedEstimate;
      }
    }

    // SCOPE_CHANGE_REJECTED
    if (eventType === 'SCOPE_CHANGE_REJECTED' && metadata?.scopeChangeId) {
      updates.scopeChanges = wo.scopeChanges.map(sc =>
        sc.id === metadata.scopeChangeId
          ? {
              ...sc,
              status: 'rejected' as const,
              resolvedAt: event.at,
              resolvedBy: { role: actor.role, id: actor.id },
              reason: notes,
            }
          : sc
      );
    }

    // RETURN_VISIT_REQUIRED: set returnVisit
    if (eventType === 'RETURN_VISIT_REQUIRED' && metadata) {
      updates.returnVisit = {
        required: true,
        reason: metadata.reason as string | undefined,
        neededTools: metadata.neededTools as string[] | undefined,
        neededMaterials: metadata.neededMaterials as string[] | undefined,
        targetDate: metadata.targetDate as string | undefined,
      };
    }

    updateWorkOrder(workOrderId, updates);

    // Backward compat: activity feed
    addActivityFeedItem({
      id: `activity-${Date.now()}`,
      workOrderId,
      message: notes ?? `${eventType.replace(/_/g, ' ').toLowerCase()} by ${currentUser.name}`,
      timestamp: event.at,
      userId: currentUser.id,
    });
  };

  // Vendor management methods
  const getAllVendors = () => vendors;

  const getVendorById = (id: string) => {
    return vendors.find((v) => v.id === id);
  };

  const addVendor = (vendor: Vendor) => {
    if (!hasPermission('manageVendors')) {
      console.error('Permission denied: manageVendors required');
      return;
    }
    setVendors((prev) => [...prev, vendor]);
  };

  const updateVendor = (id: string, updates: Partial<Vendor>) => {
    if (!hasPermission('manageVendors')) {
      console.error('Permission denied: manageVendors required');
      return;
    }
    setVendors((prev) =>
      prev.map((v) => (v.id === id ? { ...v, ...updates } : v))
    );
  };

  const deleteVendor = (id: string) => {
    if (!hasPermission('manageVendors')) {
      console.error('Permission denied: manageVendors required');
      return;
    }
    setVendors((prev) => prev.filter((v) => v.id !== id));
  };

  // Technician management methods
  const getAllTechnicians = () => technicians;

  const getTechniciansByVendor = (vendorId: string) => {
    return technicians.filter((t) => t.vendorId === vendorId && t.isActive);
  };

  const getTechnicianById = (id: string) => {
    return technicians.find((t) => t.id === id);
  };

  const addTechnician = (tech: Technician) => {
    if (!hasPermission('manageVendors')) {
      console.error('Permission denied: manageVendors required');
      return;
    }
    setTechnicians((prev) => [...prev, tech]);
  };

  const updateTechnician = (id: string, updates: Partial<Technician>) => {
    if (!hasPermission('manageVendors')) {
      console.error('Permission denied: manageVendors required');
      return;
    }
    setTechnicians((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const deleteTechnician = (id: string) => {
    if (!hasPermission('manageVendors')) {
      console.error('Permission denied: manageVendors required');
      return;
    }
    setTechnicians((prev) => prev.filter((t) => t.id !== id));
  };

  // Property management methods
  const getAllProperties = () => properties;

  const getPropertyById = (id: string) => {
    return properties.find((p) => p.id === id);
  };

  const addProperty = (property: Property) => {
    if (!hasPermission('manageProperties')) {
      console.error('Permission denied: manageProperties required');
      return;
    }
    setProperties((prev) => [...prev, property]);
  };

  const updateProperty = (id: string, updates: Partial<Property>) => {
    if (!hasPermission('manageProperties')) {
      console.error('Permission denied: manageProperties required');
      return;
    }
    setProperties((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const deleteProperty = (id: string) => {
    if (!hasPermission('manageProperties')) {
      console.error('Permission denied: manageProperties required');
      return;
    }
    setProperties((prev) => prev.filter((p) => p.id !== id));
  };

  // Asset management methods
  const getAllAssets = (): Asset[] => {
    return properties.flatMap(p => p.spaces.flatMap(s => s.assets));
  };

  const getAssetById = (id: string): Asset | undefined => {
    return getAllAssets().find(a => a.id === id);
  };

  const addAsset = (asset: Asset, spaceId: string) => {
    if (!hasPermission('manageAssets')) {
      console.error('Permission denied: manageAssets required');
      return;
    }
    setProperties(prev => prev.map(p => ({
      ...p,
      spaces: p.spaces.map(s =>
        s.id === spaceId
          ? { ...s, assets: [...s.assets, asset] }
          : s
      )
    })));
  };

  const updateAsset = (id: string, updates: Partial<Asset>) => {
    if (!hasPermission('manageAssets')) {
      console.error('Permission denied: manageAssets required');
      return;
    }
    setProperties(prev => prev.map(p => ({
      ...p,
      spaces: p.spaces.map(s => ({
        ...s,
        assets: s.assets.map(a =>
          a.id === id ? { ...a, ...updates } : a
        )
      }))
    })));
  };

  const retireAsset = (id: string, reason?: string) => {
    if (!hasPermission('manageAssets') || currentUser.role === 'Vendor-Tech') {
      console.error('Permission denied');
      return;
    }
    updateAsset(id, {
      isRetired: true,
      retiredAt: new Date().toISOString(),
      retiredBy: currentUser.id,
      retireReason: reason,
    });
  };

  const deleteAsset = (id: string) => {
    if (currentUser.role !== 'Team-Admin') {
      console.error('Permission denied: Team-Admin required');
      return;
    }
    setProperties(prev => prev.map(p => ({
      ...p,
      spaces: p.spaces.map(s => ({
        ...s,
        assets: s.assets.filter(a => a.id !== id)
      }))
    })));
  };

  const bulkUpdateAssets = (ids: string[], updates: Partial<Asset>) => {
    if (!hasPermission('manageAssets')) {
      console.error('Permission denied: manageAssets required');
      return;
    }
    ids.forEach(id => updateAsset(id, updates));
  };

  const bulkRetireAssets = (ids: string[], reason?: string) => {
    if (!hasPermission('manageAssets') || currentUser.role === 'Vendor-Tech') {
      console.error('Permission denied');
      return;
    }
    ids.forEach(id => retireAsset(id, reason));
  };

  // Vendor-Admin self-service: manage their own company's technicians
  const addVendorTechnician = (tech: Technician) => {
    if (currentUser.role !== 'Vendor-Admin') return;
    setTechnicians((prev) => [...prev, tech]);
  };

  const updateVendorTechnician = (techId: string, updates: Partial<Technician>) => {
    if (currentUser.role !== 'Vendor-Admin') return;
    setTechnicians((prev) =>
      prev.map((t) => (t.id === techId ? { ...t, ...updates } : t))
    );
  };

  const removeVendorTechnician = (techId: string) => {
    if (currentUser.role !== 'Vendor-Admin') return;
    // Clear technician from any assigned work orders
    setWorkOrders((prev) =>
      prev.map((wo) =>
        wo.assignedTechnicianId === techId
          ? { ...wo, assignedTechnicianId: undefined }
          : wo
      )
    );
    setTechnicians((prev) => prev.filter((t) => t.id !== techId));
  };

  // Messaging methods
  const getConversationByWorkOrder = (woId: string): Conversation | undefined => {
    return conversations.find((c) => c.type === 'work-order' && c.workOrderId === woId);
  };

  const getDirectConversations = (): Conversation[] => {
    return conversations.filter((c) => c.type === 'direct');
  };

  const getUnreadCount = (conversationId: string): number => {
    const conv = conversations.find((c) => c.id === conversationId);
    if (!conv) return 0;
    return conv.messages.filter((m) => !m.readBy.includes(currentUser.id)).length;
  };

  const getTotalUnreadCount = (): number => {
    return conversations.reduce((total, conv) => {
      return total + conv.messages.filter((m) => !m.readBy.includes(currentUser.id)).length;
    }, 0);
  };

  const sendMessage = (conversationId: string, body: string): void => {
    const senderType: Message['senderType'] =
      currentUser.role === 'Vendor-Admin'
        ? 'vendor-admin'
        : currentUser.role === 'Vendor-Tech'
        ? 'technician'
        : 'team';

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      conversationId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderType,
      body,
      timestamp: new Date().toISOString(),
      readBy: [currentUser.id],
    };

    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId
          ? {
              ...conv,
              messages: [...conv.messages, newMessage],
              lastMessageAt: newMessage.timestamp,
              lastMessagePreview: body.length > 60 ? body.slice(0, 60) + '…' : body,
            }
          : conv
      )
    );
  };

  const markConversationRead = (conversationId: string): void => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId
          ? {
              ...conv,
              messages: conv.messages.map((m) =>
                m.readBy.includes(currentUser.id)
                  ? m
                  : { ...m, readBy: [...m.readBy, currentUser.id] }
              ),
            }
          : conv
      )
    );
  };

  const createWorkOrderConversation = (
    woId: string,
    participantIds: string[],
    participantNames: string[]
  ): Conversation => {
    const newConv: Conversation = {
      id: `conv-wo-${woId}-${Date.now()}`,
      type: 'work-order',
      workOrderId: woId,
      participantIds,
      participantNames,
      messages: [],
    };
    setConversations((prev) => [...prev, newConv]);
    return newConv;
  };

  const resetDemoData = () => {
    setWorkOrders([...ORIGINAL_WORK_ORDERS]);
    setActivityFeed([...ORIGINAL_ACTIVITY_FEED]);
    setVendors([...ORIGINAL_VENDORS]);
    setTechnicians([...ORIGINAL_TECHNICIANS]);
    setProperties([...ORIGINAL_PROPERTIES]);
    setConversations([...ORIGINAL_CONVERSATIONS]);
    setCurrentUser(initialUser ?? seedUsers[0]);
    try { localStorage.removeItem(CONVERSATIONS_STORAGE_KEY); } catch { /* ignore */ }
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
        getAllVendors,
        getVendorById,
        addVendor,
        updateVendor,
        deleteVendor,
        getAllTechnicians,
        getTechniciansByVendor,
        getTechnicianById,
        addTechnician,
        updateTechnician,
        deleteTechnician,
        getAllProperties,
        getPropertyById,
        addProperty,
        updateProperty,
        deleteProperty,
        getAllAssets,
        getAssetById,
        addAsset,
        updateAsset,
        retireAsset,
        deleteAsset,
        bulkUpdateAssets,
        bulkRetireAssets,
        addVendorTechnician,
        updateVendorTechnician,
        removeVendorTechnician,
        performTransition,
        appendWorkOrderEvent,
        conversations,
        getConversationByWorkOrder,
        getDirectConversations,
        getUnreadCount,
        getTotalUnreadCount,
        sendMessage,
        markConversationRead,
        createWorkOrderConversation,
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
