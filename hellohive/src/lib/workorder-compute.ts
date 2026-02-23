// ─── HelloHive Work Order Lifecycle v3.1 — Compute Functions ────────────────

import type {
  WorkflowState,
  WorkOrderEvent,
  Blocker,
  SlaResult,
  StallResult,
  DueAtSource,
} from './workorder-types';
import { STALL_RESETTING_EVENTS, PRIORITY_SLA_HOURS } from './workorder-types';

// === Minimal WO shape for compute functions (avoids circular imports) ===

interface WorkOrderForCompute {
  status: WorkflowState;
  dueDate?: string;
  dueAtSource?: DueAtSource;
  createdAt: string;
  dispatchedAt?: string;
  startedAt?: string;
  completedAt?: string;
  priority: string;
  events: WorkOrderEvent[];
  blocker?: Blocker;
}

// === Overdue (computed, NOT a workflow state) ===

/**
 * A WO is overdue if:
 * 1. It has a dueDate
 * 2. dueDate is in the past
 * 3. It is NOT in a terminal state (closed, cancelled)
 */
export function isWorkOrderOverdue(wo: WorkOrderForCompute): boolean {
  if (!wo.dueDate) return false;
  if (wo.status === 'closed' || wo.status === 'cancelled') return false;
  return new Date(wo.dueDate) < new Date();
}

// === SLA Computation ===

/**
 * Compute SLA status for a work order.
 *
 * Anchor rule:
 * - If dueDate exists (manual), use it as dueAt.
 * - If no dueDate, compute dueAt = createdAt + priorityWindow.
 * - On PRIORITY_CHANGED with computed dueAt: recompute. With manual dueAt: keep.
 *
 * Primary SLA: time-to-tech-complete (was TECH_MARKED_COMPLETE recorded before dueAt?)
 * Secondary SLA: approval delay (time between TECH_MARKED_COMPLETE and FACILITY_APPROVED)
 */
export function computeSla(wo: WorkOrderForCompute, now?: Date): SlaResult {
  const nowMs = (now ?? new Date()).getTime();

  // Determine dueAt and source
  const dueAtSource: DueAtSource = wo.dueAtSource ?? (wo.dueDate ? 'manual' : 'computed');
  let dueAtMs: number;

  if (wo.dueDate) {
    dueAtMs = new Date(wo.dueDate).getTime();
  } else {
    const slaHours = PRIORITY_SLA_HOURS[wo.priority] ?? 8;
    dueAtMs = new Date(wo.createdAt).getTime() + slaHours * 3_600_000;
  }

  const startMs = new Date(wo.dispatchedAt ?? wo.createdAt).getTime();

  // For closed/cancelled: freeze SLA at final values
  const isFrozen = wo.status === 'closed' || wo.status === 'cancelled';
  const techCompleteEvent = wo.events.find(e => e.type === 'TECH_MARKED_COMPLETE');
  const approvalEvent = wo.events.find(e => e.type === 'FACILITY_APPROVED');

  // Calculate elapsed — if frozen, use tech completion time or completion time
  let elapsedMs: number;
  if (isFrozen && techCompleteEvent) {
    elapsedMs = new Date(techCompleteEvent.at).getTime() - startMs;
  } else if (isFrozen && wo.completedAt) {
    elapsedMs = new Date(wo.completedAt).getTime() - startMs;
  } else {
    elapsedMs = nowMs - startMs;
  }

  const totalMs = dueAtMs - startMs;
  const remainingMs = isFrozen
    ? Math.max(0, totalMs - elapsedMs)
    : Math.max(0, dueAtMs - nowMs);

  const percentConsumed = totalMs > 0 ? elapsedMs / totalMs : (elapsedMs > 0 ? 1.1 : 0);

  let riskBand: 'on-track' | 'approaching' | 'breached';
  if (percentConsumed >= 1) riskBand = 'breached';
  else if (percentConsumed >= 0.75) riskBand = 'approaching';
  else riskBand = 'on-track';

  const breached = percentConsumed >= 1;

  // Explanation
  let explanation: string;
  if (wo.status === 'open') {
    explanation = 'SLA not yet active (work order not dispatched)';
    riskBand = 'on-track'; // No risk for open WOs
  } else if (isFrozen) {
    explanation = breached
      ? `SLA breached — tech completed ${((elapsedMs / 3_600_000)).toFixed(1)}h after dispatch`
      : `SLA met — tech completed within ${((elapsedMs / 3_600_000)).toFixed(1)}h`;
  } else if (breached) {
    explanation = `SLA breached — ${((elapsedMs / 3_600_000)).toFixed(1)}h elapsed, ${((totalMs / 3_600_000)).toFixed(1)}h allowed`;
  } else if (riskBand === 'approaching') {
    explanation = `SLA approaching — ${Math.round(percentConsumed * 100)}% consumed, ${((remainingMs / 60_000)).toFixed(0)}m remaining`;
  } else {
    explanation = `On track — ${Math.round(percentConsumed * 100)}% consumed`;
  }

  // Secondary SLA: approval delay
  let secondaryApprovalSla: SlaResult['secondaryApprovalSla'];
  if (techCompleteEvent) {
    const approvalThresholdMs = 24 * 3_600_000; // 24h default
    const techCompleteMs = new Date(techCompleteEvent.at).getTime();
    let approvalElapsedMs: number;

    if (approvalEvent) {
      approvalElapsedMs = new Date(approvalEvent.at).getTime() - techCompleteMs;
    } else if (isFrozen) {
      approvalElapsedMs = 0; // shouldn't happen for closed, but guard
    } else {
      approvalElapsedMs = nowMs - techCompleteMs;
    }

    secondaryApprovalSla = {
      elapsedMs: approvalElapsedMs,
      thresholdMs: approvalThresholdMs,
      breached: approvalElapsedMs >= approvalThresholdMs,
      explanation: approvalElapsedMs >= approvalThresholdMs
        ? `Approval delay: ${((approvalElapsedMs / 3_600_000)).toFixed(1)}h (threshold: 24h)`
        : `Approval pending: ${((approvalElapsedMs / 3_600_000)).toFixed(1)}h elapsed`,
    };
  }

  return {
    dueAt: new Date(dueAtMs).toISOString(),
    dueAtSource,
    elapsedMs,
    remainingMs,
    percentConsumed,
    riskBand: wo.status === 'open' ? 'on-track' : riskBand,
    breached: wo.status === 'open' ? false : breached,
    explanation,
    primarySlaType: 'time-to-tech-complete',
    secondaryApprovalSla,
  };
}

/**
 * Legacy-compatible SLA risk band for components that expect the old getSlaRisk() return.
 */
export type SlaRisk = 'on-track' | 'approaching' | 'breached' | null;

export function computeSlaRisk(wo: WorkOrderForCompute): SlaRisk {
  if (wo.status === 'closed' || wo.status === 'cancelled' || wo.status === 'open') {
    return null;
  }
  const sla = computeSla(wo);
  return sla.riskBand;
}

// === Stall Detection ===

/**
 * Default stall thresholds (in milliseconds).
 */
const STALL_THRESHOLDS: Record<string, number> = {
  'dispatched': 2 * 3_600_000,           // 2h
  'in-progress': 24 * 3_600_000,         // 24h
  'pending-approval': 24 * 3_600_000,    // 24h
};

/**
 * Compute stall detection for a work order.
 *
 * Rules:
 * - dispatched: stalled if no JOB_STARTED AND no meaningful vendor-originated activity
 *   (only events where actor.role is Vendor-Admin or Vendor-Tech reset the clock)
 * - in-progress: stalled if no meaningful activity from ANY human role within threshold
 * - pending-approval: stalled if no FACILITY_APPROVED or FACILITY_REJECTED within threshold
 * - open / closed / cancelled: never stalled
 *
 * Blocker behavior:
 * - If blocker is active, stall clock is paused
 * - If blocker has estimatedResolutionDate that has passed, set blockerOverdue
 */
export function computeStall(wo: WorkOrderForCompute, now?: Date): StallResult {
  const nowMs = (now ?? new Date()).getTime();

  const noStall: StallResult = {
    stalled: false,
    reason: '',
    lastMeaningfulEventAt: '',
    thresholdMs: 0,
    explanation: '',
    blockerActive: !!wo.blocker,
    blockerOverdue: wo.blocker?.estimatedResolutionDate
      ? new Date(wo.blocker.estimatedResolutionDate).getTime() < nowMs
      : false,
  };

  // Only active states can be stalled
  if (!['dispatched', 'in-progress', 'pending-approval'].includes(wo.status)) {
    return { ...noStall, explanation: 'Not in a stall-eligible state' };
  }

  // If blocker is active, stall clock is paused
  const blockerActive = !!wo.blocker;
  const blockerOverdue = wo.blocker?.estimatedResolutionDate
    ? new Date(wo.blocker.estimatedResolutionDate).getTime() < nowMs
    : false;

  if (blockerActive) {
    return {
      stalled: false,
      reason: '',
      lastMeaningfulEventAt: '',
      thresholdMs: STALL_THRESHOLDS[wo.status] ?? 0,
      explanation: blockerOverdue
        ? `Stall paused (blocker active) — blocker resolution date has passed`
        : `Stall paused (blocker active)`,
      blockerActive: true,
      blockerOverdue,
    };
  }

  const thresholdMs = STALL_THRESHOLDS[wo.status] ?? 24 * 3_600_000;

  // Find last meaningful event
  let lastMeaningfulAt: number;
  const events = wo.events ?? [];

  if (wo.status === 'dispatched') {
    // Only vendor-originated events reset dispatched stall clock
    const vendorEvents = events.filter(
      e => STALL_RESETTING_EVENTS.includes(e.type) &&
           (e.actor.role === 'Vendor-Admin' || e.actor.role === 'Vendor-Tech')
    );
    if (vendorEvents.length > 0) {
      lastMeaningfulAt = Math.max(...vendorEvents.map(e => new Date(e.at).getTime()));
    } else {
      // Fall back to dispatch time
      lastMeaningfulAt = wo.dispatchedAt
        ? new Date(wo.dispatchedAt).getTime()
        : new Date(wo.createdAt).getTime();
    }
  } else if (wo.status === 'pending-approval') {
    // Look for the TECH_MARKED_COMPLETE event as the anchor
    const techComplete = [...events].reverse().find(e => e.type === 'TECH_MARKED_COMPLETE');
    lastMeaningfulAt = techComplete
      ? new Date(techComplete.at).getTime()
      : new Date(wo.createdAt).getTime();
  } else {
    // in-progress: any human-initiated meaningful event resets the clock
    const meaningfulEvents = events.filter(
      e => STALL_RESETTING_EVENTS.includes(e.type) && e.actor.role !== 'system'
    );
    if (meaningfulEvents.length > 0) {
      lastMeaningfulAt = Math.max(...meaningfulEvents.map(e => new Date(e.at).getTime()));
    } else {
      lastMeaningfulAt = wo.startedAt
        ? new Date(wo.startedAt).getTime()
        : new Date(wo.createdAt).getTime();
    }
  }

  const elapsedMs = nowMs - lastMeaningfulAt;
  const stalled = elapsedMs >= thresholdMs;

  let reason = '';
  let explanation = '';
  if (stalled) {
    const hours = Math.floor(elapsedMs / 3_600_000);
    const days = Math.floor(hours / 24);
    const timeStr = days > 0 ? `${days}d ${hours % 24}h` : `${hours}h`;

    if (wo.status === 'dispatched') {
      reason = 'Dispatched but not started';
      explanation = `Dispatched ${timeStr} ago — no vendor activity`;
    } else if (wo.status === 'pending-approval') {
      reason = 'Awaiting facility approval';
      explanation = `Pending approval for ${timeStr} — no response from facilities`;
    } else {
      reason = 'No recent activity';
      explanation = `No update in ${timeStr}`;
    }
  }

  return {
    stalled,
    reason,
    lastMeaningfulEventAt: new Date(lastMeaningfulAt).toISOString(),
    thresholdMs,
    explanation: explanation || 'No stall detected',
    blockerActive,
    blockerOverdue,
  };
}

// === Blocker Helpers ===

export function hasActiveBlocker(wo: { blocker?: Blocker }): boolean {
  return !!wo.blocker;
}

export function getActiveBlocker(wo: { blocker?: Blocker }): Blocker | undefined {
  return wo.blocker;
}
