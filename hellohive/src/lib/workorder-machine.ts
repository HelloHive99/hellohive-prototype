// ─── HelloHive Work Order Lifecycle v3.1 — State Machine ────────────────────

import type {
  WorkflowState,
  WorkOrderEventType,
  WorkOrderEvent,
  WorkOrderEventActor,
  TransitionResult,
} from './workorder-types';
import { SYSTEM_ACTOR } from './workorder-types';

// === Transition Rule ===

interface TransitionRule {
  nextState: WorkflowState;
  allowedRoles: string[];
  /** Fields that MUST be present in metadata for this transition */
  requiredMeta?: string[];
  /** Fields that MUST be present in notes for this transition */
  requiresNotes?: boolean;
}

// === Transition Table ===
// currentState → eventType → rule

const TRANSITION_TABLE: Record<string, Record<string, TransitionRule>> = {
  'open': {
    'DISPATCHED': {
      nextState: 'dispatched',
      allowedRoles: ['Team-Admin', 'Team-OpsCoordinator'],
      requiredMeta: ['selectedVendorId'],
    },
    'WO_CANCELLED': {
      nextState: 'cancelled',
      allowedRoles: ['Team-Admin', 'Team-OpsCoordinator'],
      requiresNotes: true,
    },
  },
  'dispatched': {
    'JOB_STARTED': {
      nextState: 'in-progress',
      allowedRoles: ['Vendor-Admin', 'Vendor-Tech'],
    },
    'VENDOR_REASSIGNED': {
      nextState: 'dispatched',
      allowedRoles: ['Team-Admin', 'Team-OpsCoordinator'],
      requiredMeta: ['newVendorId'],
      requiresNotes: true,
    },
    'WO_CANCELLED': {
      nextState: 'cancelled',
      allowedRoles: ['Team-Admin', 'Team-OpsCoordinator'],
      requiresNotes: true,
    },
  },
  'in-progress': {
    'TECH_MARKED_COMPLETE': {
      nextState: 'pending-approval',
      allowedRoles: ['Vendor-Tech', 'Vendor-Admin'],
      requiredMeta: ['actualCost', 'completionSummary'],
    },
    'VENDOR_REASSIGNED': {
      nextState: 'dispatched',
      allowedRoles: ['Team-Admin', 'Team-OpsCoordinator'],
      requiredMeta: ['newVendorId'],
      requiresNotes: true,
    },
    'WO_CANCELLED': {
      nextState: 'cancelled',
      allowedRoles: ['Team-Admin', 'Team-OpsCoordinator'],
      requiresNotes: true,
    },
  },
  'pending-approval': {
    'FACILITY_APPROVED': {
      nextState: 'closed',
      allowedRoles: ['Team-Admin', 'Team-OpsCoordinator'],
    },
    'FACILITY_REJECTED': {
      nextState: 'in-progress',
      allowedRoles: ['Team-Admin', 'Team-OpsCoordinator'],
      requiresNotes: true,
    },
    'WO_CANCELLED': {
      nextState: 'cancelled',
      allowedRoles: ['Team-Admin', 'Team-OpsCoordinator'],
      requiresNotes: true,
    },
  },
  // Terminal states: no transitions out (except optional REOPEN — future)
  'closed': {},
  'cancelled': {},
};

// === Non-transition event permissions ===
// eventType → allowedRoles

const APPEND_EVENT_PERMISSIONS: Record<string, string[]> = {
  'NOTE_ADDED': ['Team-Admin', 'Team-OpsCoordinator', 'Vendor-Admin'],
  'TECH_NOTE_ADDED': ['Vendor-Tech'],
  'PROGRESS_UPDATE': ['Vendor-Tech', 'Vendor-Admin'],
  'SITE_VISIT_RECORDED': ['Vendor-Tech', 'Vendor-Admin'],
  'RETURN_VISIT_REQUIRED': ['Vendor-Tech', 'Vendor-Admin'],
  'PARTS_ORDERED': ['Vendor-Tech', 'Vendor-Admin'],
  'PARTS_RECEIVED': ['Vendor-Tech', 'Vendor-Admin'],
  'BLOCKER_SET': ['Team-Admin', 'Team-OpsCoordinator', 'Vendor-Admin', 'Vendor-Tech'],
  'BLOCKER_CLEARED': ['Team-Admin', 'Team-OpsCoordinator', 'Vendor-Admin', 'Vendor-Tech'],
  'COST_ESTIMATE_UPDATED': ['Team-Admin', 'Team-OpsCoordinator', 'Vendor-Admin'],
  'SCOPE_CHANGE_REQUESTED': ['Vendor-Admin', 'Vendor-Tech'],
  'SCOPE_CHANGE_APPROVED': ['Team-Admin', 'Team-OpsCoordinator'],
  'SCOPE_CHANGE_REJECTED': ['Team-Admin', 'Team-OpsCoordinator'],
  'PRIORITY_CHANGED': ['Team-Admin', 'Team-OpsCoordinator'],
  'ETA_UPDATED': ['Vendor-Admin', 'Vendor-Tech'],
  'TECH_ASSIGNED': ['Team-Admin', 'Team-OpsCoordinator', 'Vendor-Admin'],
  // System events bypass permissions — never in this table
};

// === ID generation ===

function generateEventId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `evt-${crypto.randomUUID()}`;
  }
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// === Core: transitionWorkOrder ===

/**
 * Validates and produces the events for a state transition.
 * Returns { success, error?, events? }.
 * Does NOT mutate anything — caller applies the returned events and new state.
 */
export function transitionWorkOrder(
  currentState: WorkflowState,
  eventType: WorkOrderEventType,
  actor: WorkOrderEventActor,
  notes?: string,
  metadata?: Record<string, unknown>,
): TransitionResult {
  const stateRules = TRANSITION_TABLE[currentState];
  if (!stateRules) {
    return { success: false, error: `No transitions defined for state: ${currentState}` };
  }

  const rule = stateRules[eventType];
  if (!rule) {
    return {
      success: false,
      error: `Event ${eventType} is not valid in state ${currentState}`,
    };
  }

  // Permission check
  if (!rule.allowedRoles.includes(actor.role)) {
    return {
      success: false,
      error: `Role ${actor.role} cannot perform ${eventType} in state ${currentState}`,
    };
  }

  // Required metadata validation
  if (rule.requiredMeta) {
    for (const field of rule.requiredMeta) {
      if (metadata?.[field] === undefined || metadata[field] === null) {
        return {
          success: false,
          error: `Missing required field: ${field} for ${eventType}`,
        };
      }
    }
  }

  // Required notes validation
  if (rule.requiresNotes && !notes?.trim()) {
    return {
      success: false,
      error: `A reason (notes) is required for ${eventType}`,
    };
  }

  const now = new Date().toISOString();
  const events: WorkOrderEvent[] = [];

  // Build the primary transition event
  const primaryEvent: WorkOrderEvent = {
    id: generateEventId(),
    type: eventType,
    at: now,
    actor,
    notes,
    metadata,
  };
  events.push(primaryEvent);

  // === Side-effect events ===

  // DISPATCHED: auto-emit VENDOR_SELECTED + VENDOR_ACCEPTED (simulated instant acceptance)
  if (eventType === 'DISPATCHED') {
    events.push({
      id: generateEventId(),
      type: 'VENDOR_SELECTED',
      at: now,
      actor,
      metadata: { vendorId: metadata?.selectedVendorId },
    });
    events.push({
      id: generateEventId(),
      type: 'VENDOR_ACCEPTED',
      at: now,
      actor: SYSTEM_ACTOR,
      notes: 'Simulated instant acceptance (prototype)',
      metadata: { vendorId: metadata?.selectedVendorId },
    });
  }

  // FACILITY_APPROVED: auto-emit PAYMENT_TRIGGERED
  if (eventType === 'FACILITY_APPROVED') {
    events.push({
      id: generateEventId(),
      type: 'PAYMENT_TRIGGERED',
      at: now,
      actor: SYSTEM_ACTOR,
      notes: 'Auto-triggered on facility approval',
      metadata: {
        amount: metadata?.amount,
        vendorId: metadata?.vendorId,
        paymentTerms: 'net-7',
      },
    });
  }

  return { success: true, events };
}

// === Permission check (read-only) ===

/**
 * Check if an actor can perform a transition event in the current state.
 * Does not check non-transition events — use canAppendEvent for those.
 */
export function canTransition(
  currentState: WorkflowState,
  eventType: WorkOrderEventType,
  actorRole: string,
): boolean {
  const rule = TRANSITION_TABLE[currentState]?.[eventType];
  if (!rule) return false;
  return rule.allowedRoles.includes(actorRole);
}

/**
 * Check if an actor can append a non-transition event.
 * System events (PAYMENT_TRIGGERED) always return false — they are internal side effects.
 */
export function canAppendEvent(
  eventType: WorkOrderEventType,
  actorRole: string,
): boolean {
  const allowedRoles = APPEND_EVENT_PERMISSIONS[eventType];
  if (!allowedRoles) return false;
  return allowedRoles.includes(actorRole);
}

/**
 * Get all valid transition events for a given state and role.
 * Used by UI to show/hide action buttons.
 */
export function getAvailableTransitions(
  currentState: WorkflowState,
  actorRole: string,
): { eventType: WorkOrderEventType; nextState: WorkflowState }[] {
  const stateRules = TRANSITION_TABLE[currentState];
  if (!stateRules) return [];

  return Object.entries(stateRules)
    .filter(([_, rule]) => (rule as TransitionRule).allowedRoles.includes(actorRole))
    .map(([eventType, rule]) => ({
      eventType: eventType as WorkOrderEventType,
      nextState: (rule as TransitionRule).nextState,
    }));
}

/**
 * Get the next state for a given transition, or null if not valid.
 */
export function getNextState(
  currentState: WorkflowState,
  eventType: WorkOrderEventType,
): WorkflowState | null {
  const rule = TRANSITION_TABLE[currentState]?.[eventType];
  return rule ? (rule as TransitionRule).nextState : null;
}
