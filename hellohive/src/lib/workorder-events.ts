// ─── HelloHive Work Order Lifecycle v3.1 — Event Helpers ────────────────────

import type {
  WorkOrderEvent,
  WorkOrderEventType,
  WorkOrderEventActor,
  Blocker,
  BlockerReason,
} from './workorder-types';
import { SYSTEM_ACTOR } from './workorder-types';

// === ID generation ===

function generateEventId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `evt-${crypto.randomUUID()}`;
  }
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// === Create a single event ===

export function createEvent(
  type: WorkOrderEventType,
  actor: WorkOrderEventActor,
  notes?: string,
  metadata?: Record<string, unknown>,
): WorkOrderEvent {
  return {
    id: generateEventId(),
    type,
    at: new Date().toISOString(),
    actor,
    notes,
    metadata,
  };
}

// === Auto-blocker side effects ===

/**
 * Given a newly appended event, determine if any auto-blocker actions should occur.
 * Returns: { setBlocker?, clearBlocker?, sideEffectEvents[] }
 *
 * Rules (deterministic, per spec Section C):
 * - RETURN_VISIT_REQUIRED → auto-set blocker 'return_visit_scheduled' (unless already blocked for different reason)
 * - PARTS_ORDERED → auto-set blocker 'waiting_on_parts' (unless already blocked for different reason)
 * - PARTS_RECEIVED → auto-clear blocker ONLY IF current reason is 'waiting_on_parts'
 * - SCOPE_CHANGE_REQUESTED → auto-set blocker 'requires_additional_scope_approval' (unless already blocked)
 * - SCOPE_CHANGE_APPROVED → auto-clear blocker ONLY IF current reason is 'requires_additional_scope_approval'
 * - SCOPE_CHANGE_REJECTED → auto-clear blocker ONLY IF current reason is 'requires_additional_scope_approval'
 * - VENDOR_REASSIGNED → clear any active blocker (new vendor starts fresh)
 */
export function getAutoBlockerEffects(
  eventType: WorkOrderEventType,
  currentBlocker: Blocker | undefined,
  actor: WorkOrderEventActor,
  eventMetadata?: Record<string, unknown>,
): {
  setBlocker?: Blocker;
  clearBlocker?: boolean;
  sideEffectEvents: WorkOrderEvent[];
} {
  const now = new Date().toISOString();
  const sideEffectEvents: WorkOrderEvent[] = [];

  // Auto-set blockers
  if (eventType === 'RETURN_VISIT_REQUIRED' && !currentBlocker) {
    const blocker: Blocker = {
      reason: 'return_visit_scheduled',
      setAt: now,
      notes: eventMetadata?.reason as string | undefined,
      estimatedResolutionDate: eventMetadata?.targetDate as string | undefined,
    };
    sideEffectEvents.push({
      id: generateEventId(),
      type: 'BLOCKER_SET',
      at: now,
      actor: SYSTEM_ACTOR,
      notes: 'Auto-set: return visit required',
      metadata: { reason: 'return_visit_scheduled' },
    });
    return { setBlocker: blocker, sideEffectEvents };
  }

  if (eventType === 'PARTS_ORDERED' && !currentBlocker) {
    const blocker: Blocker = {
      reason: 'waiting_on_parts',
      setAt: now,
      notes: eventMetadata?.partsList ? `Parts: ${(eventMetadata.partsList as string[]).join(', ')}` : undefined,
      estimatedResolutionDate: eventMetadata?.vendorEta as string | undefined,
    };
    sideEffectEvents.push({
      id: generateEventId(),
      type: 'BLOCKER_SET',
      at: now,
      actor: SYSTEM_ACTOR,
      notes: 'Auto-set: parts ordered',
      metadata: { reason: 'waiting_on_parts' },
    });
    return { setBlocker: blocker, sideEffectEvents };
  }

  if (eventType === 'SCOPE_CHANGE_REQUESTED' && !currentBlocker) {
    const blocker: Blocker = {
      reason: 'requires_additional_scope_approval',
      setAt: now,
      notes: eventMetadata?.description as string | undefined,
    };
    sideEffectEvents.push({
      id: generateEventId(),
      type: 'BLOCKER_SET',
      at: now,
      actor: SYSTEM_ACTOR,
      notes: 'Auto-set: scope change requested',
      metadata: { reason: 'requires_additional_scope_approval' },
    });
    return { setBlocker: blocker, sideEffectEvents };
  }

  // Auto-clear blockers
  if (eventType === 'PARTS_RECEIVED' && currentBlocker?.reason === 'waiting_on_parts') {
    sideEffectEvents.push({
      id: generateEventId(),
      type: 'BLOCKER_CLEARED',
      at: now,
      actor: SYSTEM_ACTOR,
      notes: 'Auto-cleared: parts received',
    });
    return { clearBlocker: true, sideEffectEvents };
  }

  if (
    (eventType === 'SCOPE_CHANGE_APPROVED' || eventType === 'SCOPE_CHANGE_REJECTED') &&
    currentBlocker?.reason === 'requires_additional_scope_approval'
  ) {
    sideEffectEvents.push({
      id: generateEventId(),
      type: 'BLOCKER_CLEARED',
      at: now,
      actor: SYSTEM_ACTOR,
      notes: `Auto-cleared: scope change ${eventType === 'SCOPE_CHANGE_APPROVED' ? 'approved' : 'rejected'}`,
    });
    return { clearBlocker: true, sideEffectEvents };
  }

  // VENDOR_REASSIGNED: clear any active blocker
  if (eventType === 'VENDOR_REASSIGNED' && currentBlocker) {
    sideEffectEvents.push({
      id: generateEventId(),
      type: 'BLOCKER_CLEARED',
      at: now,
      actor: SYSTEM_ACTOR,
      notes: 'Auto-cleared: vendor reassigned',
    });
    return { clearBlocker: true, sideEffectEvents };
  }

  return { sideEffectEvents };
}

// === Build synthetic events for legacy migration ===

/**
 * Generate a minimal event history from a legacy work order's timestamp fields.
 * Used during seed data migration.
 */
export function buildSyntheticEvents(wo: {
  createdBy: string;
  createdAt: string;
  dispatchedAt?: string;
  startedAt?: string;
  completedAt?: string;
  assignedVendorId?: string;
  assignedTechnicianId?: string;
  cost?: number;
  status: string;
}): WorkOrderEvent[] {
  const events: WorkOrderEvent[] = [];
  const adminActor: WorkOrderEventActor = {
    role: 'Team-Admin',
    id: wo.createdBy,
    displayName: 'System Migration',
  };

  // WO_CREATED always present
  events.push({
    id: `evt-seed-created-${wo.createdAt.replace(/[^a-zA-Z0-9]/g, '')}`,
    type: 'WO_CREATED',
    at: wo.createdAt,
    actor: adminActor,
  });

  // DISPATCHED (includes VENDOR_SELECTED + VENDOR_ACCEPTED)
  if (wo.dispatchedAt && wo.assignedVendorId) {
    events.push({
      id: `evt-seed-dispatched-${wo.dispatchedAt.replace(/[^a-zA-Z0-9]/g, '')}`,
      type: 'DISPATCHED',
      at: wo.dispatchedAt,
      actor: adminActor,
      metadata: { selectedVendorId: wo.assignedVendorId },
    });
    events.push({
      id: `evt-seed-vendor-sel-${wo.dispatchedAt.replace(/[^a-zA-Z0-9]/g, '')}`,
      type: 'VENDOR_SELECTED',
      at: wo.dispatchedAt,
      actor: adminActor,
      metadata: { vendorId: wo.assignedVendorId },
    });
    events.push({
      id: `evt-seed-vendor-ack-${wo.dispatchedAt.replace(/[^a-zA-Z0-9]/g, '')}`,
      type: 'VENDOR_ACCEPTED',
      at: wo.dispatchedAt,
      actor: SYSTEM_ACTOR,
      notes: 'Simulated instant acceptance (seed data)',
    });
  }

  // TECH_ASSIGNED
  if (wo.assignedTechnicianId) {
    const assignAt = wo.dispatchedAt ?? wo.createdAt;
    events.push({
      id: `evt-seed-tech-assign-${assignAt.replace(/[^a-zA-Z0-9]/g, '')}`,
      type: 'TECH_ASSIGNED',
      at: assignAt,
      actor: adminActor,
      metadata: { technicianId: wo.assignedTechnicianId },
    });
  }

  // JOB_STARTED
  if (wo.startedAt) {
    const techActor: WorkOrderEventActor = {
      role: 'Vendor-Tech',
      id: wo.assignedTechnicianId ?? wo.createdBy,
      displayName: 'System Migration',
    };
    events.push({
      id: `evt-seed-started-${wo.startedAt.replace(/[^a-zA-Z0-9]/g, '')}`,
      type: 'JOB_STARTED',
      at: wo.startedAt,
      actor: techActor,
    });
  }

  // For completed/closed WOs: TECH_MARKED_COMPLETE + FACILITY_APPROVED + PAYMENT_TRIGGERED
  if (wo.completedAt && (wo.status === 'completed' || wo.status === 'closed')) {
    const techActor: WorkOrderEventActor = {
      role: 'Vendor-Tech',
      id: wo.assignedTechnicianId ?? wo.createdBy,
      displayName: 'System Migration',
    };
    events.push({
      id: `evt-seed-tech-complete-${wo.completedAt.replace(/[^a-zA-Z0-9]/g, '')}`,
      type: 'TECH_MARKED_COMPLETE',
      at: wo.completedAt,
      actor: techActor,
      metadata: {
        actualCost: wo.cost,
        completionSummary: 'Migrated from v3.0',
      },
    });
    events.push({
      id: `evt-seed-approved-${wo.completedAt.replace(/[^a-zA-Z0-9]/g, '')}`,
      type: 'FACILITY_APPROVED',
      at: wo.completedAt,
      actor: adminActor,
    });
    events.push({
      id: `evt-seed-payment-${wo.completedAt.replace(/[^a-zA-Z0-9]/g, '')}`,
      type: 'PAYMENT_TRIGGERED',
      at: wo.completedAt,
      actor: SYSTEM_ACTOR,
      notes: 'Auto-triggered on facility approval',
      metadata: {
        amount: wo.cost,
        vendorId: wo.assignedVendorId,
        paymentTerms: 'net-7',
      },
    });
  }

  return events;
}
