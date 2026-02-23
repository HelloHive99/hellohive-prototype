// ─── HelloHive Work Order Lifecycle v3.1 — Type Definitions ─────────────────

// === Workflow States ===

export type WorkflowState =
  | 'open'
  | 'dispatched'
  | 'in-progress'
  | 'pending-approval'
  | 'closed'
  | 'cancelled';

/** Display labels: internal state name → user-facing label */
export const WORKFLOW_STATE_LABELS: Record<WorkflowState, string> = {
  'open': 'Open',
  'dispatched': 'Dispatched',
  'in-progress': 'In Progress',
  'pending-approval': 'Pending Approval',
  'closed': 'Completed',
  'cancelled': 'Cancelled',
};

// === Event Types ===

export type WorkOrderEventType =
  // Lifecycle (state-transition events)
  | 'WO_CREATED'
  | 'DISPATCHED'
  | 'VENDOR_SELECTED'
  | 'VENDOR_ACCEPTED'
  | 'VENDOR_REASSIGNED'
  | 'TECH_ASSIGNED'
  | 'JOB_STARTED'
  | 'TECH_MARKED_COMPLETE'
  | 'FACILITY_APPROVED'
  | 'FACILITY_REJECTED'
  | 'WO_CANCELLED'
  // Notes & progress
  | 'NOTE_ADDED'
  | 'TECH_NOTE_ADDED'
  | 'PROGRESS_UPDATE'
  | 'SITE_VISIT_RECORDED'
  | 'RETURN_VISIT_REQUIRED'
  | 'PARTS_ORDERED'
  | 'PARTS_RECEIVED'
  // Blockers
  | 'BLOCKER_SET'
  | 'BLOCKER_CLEARED'
  // Cost & scope
  | 'COST_ESTIMATE_UPDATED'
  | 'SCOPE_CHANGE_REQUESTED'
  | 'SCOPE_CHANGE_APPROVED'
  | 'SCOPE_CHANGE_REJECTED'
  // Priority
  | 'PRIORITY_CHANGED'
  // Payment
  | 'PAYMENT_TRIGGERED'
  // ETA
  | 'ETA_UPDATED';

/** Human-readable event labels for timeline rendering */
export const EVENT_TYPE_LABELS: Record<WorkOrderEventType, string> = {
  'WO_CREATED': 'Work order created',
  'DISPATCHED': 'Dispatched to vendor',
  'VENDOR_SELECTED': 'Vendor selected',
  'VENDOR_ACCEPTED': 'Vendor accepted',
  'VENDOR_REASSIGNED': 'Vendor reassigned',
  'TECH_ASSIGNED': 'Technician assigned',
  'JOB_STARTED': 'Job started',
  'TECH_MARKED_COMPLETE': 'Marked complete by technician',
  'FACILITY_APPROVED': 'Approved by facilities',
  'FACILITY_REJECTED': 'Rejected by facilities',
  'WO_CANCELLED': 'Work order cancelled',
  'NOTE_ADDED': 'Note added',
  'TECH_NOTE_ADDED': 'Technician note',
  'PROGRESS_UPDATE': 'Progress update',
  'SITE_VISIT_RECORDED': 'Site visit recorded',
  'RETURN_VISIT_REQUIRED': 'Return visit required',
  'PARTS_ORDERED': 'Parts ordered',
  'PARTS_RECEIVED': 'Parts received',
  'BLOCKER_SET': 'Blocker set',
  'BLOCKER_CLEARED': 'Blocker cleared',
  'COST_ESTIMATE_UPDATED': 'Cost estimate updated',
  'SCOPE_CHANGE_REQUESTED': 'Scope change requested',
  'SCOPE_CHANGE_APPROVED': 'Scope change approved',
  'SCOPE_CHANGE_REJECTED': 'Scope change rejected',
  'PRIORITY_CHANGED': 'Priority changed',
  'PAYMENT_TRIGGERED': 'Payment initiated',
  'ETA_UPDATED': 'ETA updated',
};

// === Event Interface ===

export interface WorkOrderEventActor {
  role: string;
  id: string;
  displayName?: string;
}

export interface WorkOrderEvent {
  id: string;
  type: WorkOrderEventType;
  at: string;                              // ISO 8601 timestamp
  actor: WorkOrderEventActor;
  notes?: string;
  metadata?: Record<string, unknown>;
}

/** System actor for auto-generated events (e.g. PAYMENT_TRIGGERED) */
export const SYSTEM_ACTOR: WorkOrderEventActor = {
  role: 'system',
  id: 'system',
  displayName: 'System',
};

/**
 * Events that count as "meaningful activity" for stall detection.
 * System-generated events do NOT reset the stall clock.
 */
export const STALL_RESETTING_EVENTS: WorkOrderEventType[] = [
  'JOB_STARTED',
  'TECH_NOTE_ADDED',
  'NOTE_ADDED',
  'PROGRESS_UPDATE',
  'SITE_VISIT_RECORDED',
  'RETURN_VISIT_REQUIRED',
  'PARTS_ORDERED',
  'PARTS_RECEIVED',
  'BLOCKER_SET',
  'BLOCKER_CLEARED',
  'SCOPE_CHANGE_REQUESTED',
  'SCOPE_CHANGE_APPROVED',
  'COST_ESTIMATE_UPDATED',
  'PRIORITY_CHANGED',
  'TECH_MARKED_COMPLETE',
  'FACILITY_APPROVED',
  'FACILITY_REJECTED',
];

// === Blocker Types ===

export type BlockerReason =
  | 'waiting_on_parts'
  | 'awaiting_access'
  | 'awaiting_customer_response'
  | 'requires_additional_tools'
  | 'requires_additional_scope_approval'
  | 'weather_delay'
  | 'return_visit_scheduled'
  | 'other';

export const BLOCKER_REASON_LABELS: Record<BlockerReason, string> = {
  'waiting_on_parts': 'Waiting on Parts',
  'awaiting_access': 'Awaiting Access',
  'awaiting_customer_response': 'Awaiting Customer Response',
  'requires_additional_tools': 'Requires Additional Tools',
  'requires_additional_scope_approval': 'Requires Scope Approval',
  'weather_delay': 'Weather Delay',
  'return_visit_scheduled': 'Return Visit Scheduled',
  'other': 'Other',
};

export interface Blocker {
  reason: BlockerReason;
  setAt: string;
  notes?: string;
  estimatedResolutionDate?: string;
}

export interface ReturnVisit {
  required: boolean;
  reason?: string;
  neededTools?: string[];
  neededMaterials?: string[];
  targetDate?: string;
}

// === Cost & Scope ===

export interface ScopeChange {
  id: string;
  requestedAt: string;
  requestedBy: { role: string; id: string };
  description: string;
  revisedEstimate?: number;
  status: 'pending' | 'approved' | 'rejected';
  resolvedAt?: string;
  resolvedBy?: { role: string; id: string };
  reason?: string;
}

export type PaymentStatus = 'triggered' | 'processing' | 'paid' | 'failed' | 'disputed';

export interface PaymentInfo {
  status: PaymentStatus;
  triggeredAt: string;
  amount: number;
  vendorId: string;
}

// === SLA ===

export type DueAtSource = 'computed' | 'manual';

export interface SlaResult {
  dueAt: string;
  dueAtSource: DueAtSource;
  elapsedMs: number;
  remainingMs: number;
  percentConsumed: number;
  riskBand: 'on-track' | 'approaching' | 'breached';
  breached: boolean;
  breachedAt?: string;
  explanation: string;
  primarySlaType: 'time-to-tech-complete';
  secondaryApprovalSla?: {
    elapsedMs: number;
    thresholdMs: number;
    breached: boolean;
    explanation: string;
  };
}

// === Stall Detection ===

export interface StallResult {
  stalled: boolean;
  reason: string;
  lastMeaningfulEventAt: string;
  thresholdMs: number;
  explanation: string;
  blockerActive: boolean;
  blockerOverdue: boolean;
}

// === Transition Result ===

export interface TransitionResult {
  success: boolean;
  error?: string;
  events?: WorkOrderEvent[];  // events to append (may include side-effect events)
}

// === Badge Mapping ===
// Maps WorkflowState → BadgeVariant for display

import type { BadgeVariant } from '@/components/ui/Badge';

export const WORKFLOW_STATE_BADGE: Record<WorkflowState, BadgeVariant> = {
  'open': 'open',
  'dispatched': 'dispatched',
  'in-progress': 'in-progress',
  'pending-approval': 'pending-approval',
  'closed': 'completed',
  'cancelled': 'cancelled',
};

export function getStatusBadgeVariant(status: WorkflowState): BadgeVariant {
  return WORKFLOW_STATE_BADGE[status] ?? 'open';
}

export function getStatusDisplayLabel(status: WorkflowState): string {
  return WORKFLOW_STATE_LABELS[status] ?? status;
}

// === Priority SLA Windows ===

export const PRIORITY_SLA_HOURS: Record<string, number> = {
  urgent: 2,
  high: 4,
  medium: 8,
  low: 24,
};
