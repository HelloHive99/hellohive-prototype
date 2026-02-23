import { subHours, subDays, addDays, startOfDay, endOfDay, isBefore, isWithinInterval } from 'date-fns';
import type { WorkOrder } from '@/data/seed-data';

/**
 * Check if a date is within the last 24 hours
 */
export function isLast24Hours(dateString: string): boolean {
  const date = new Date(dateString);
  const cutoff = subHours(new Date(), 24);
  return date >= cutoff;
}

/**
 * Check if a date is within the last 7 days
 */
export function isLast7Days(dateString: string): boolean {
  const date = new Date(dateString);
  const cutoff = subDays(startOfDay(new Date()), 7);
  return date >= cutoff;
}

/**
 * Check if a work order is overdue
 * Overdue = has dueDate AND dueDate < now AND status !== 'completed'
 */
export function isOverdue(dueDate: string | undefined, status: string): boolean {
  if (!dueDate) return false;
  if (status === 'closed' || status === 'cancelled' || status === 'completed') return false;
  return isBefore(new Date(dueDate), new Date());
}

/**
 * Check if a date is within the next 3 days
 */
export function isNext3Days(dateString: string): boolean {
  const date = new Date(dateString);
  const now = new Date();
  const threeDaysFromNow = addDays(endOfDay(new Date()), 3);
  return date >= now && date <= threeDaysFromNow;
}

/**
 * Check if a date falls within a custom range
 * Handles partial ranges (only from, only to, or both)
 */
export function isInDateRange(
  dateString: string | undefined,
  fromDate: string | undefined,
  toDate: string | undefined
): boolean {
  if (!dateString) return false;

  const date = new Date(dateString);

  // No range specified = no constraint
  if (!fromDate && !toDate) return true;

  // Only fromDate specified
  if (fromDate && !toDate) {
    return date >= startOfDay(new Date(fromDate));
  }

  // Only toDate specified
  if (!fromDate && toDate) {
    return date <= endOfDay(new Date(toDate));
  }

  // Both specified
  return isWithinInterval(date, {
    start: startOfDay(new Date(fromDate!)),
    end: endOfDay(new Date(toDate!))
  });
}

/**
 * Format a timestamp as a human-readable relative time ("12m ago", "1h 08m ago", "2d ago")
 */
export function formatRelativeAgo(isoString: string | undefined): string {
  if (!isoString) return '';
  const ms = Date.now() - new Date(isoString).getTime();
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) {
    const remainMinutes = totalMinutes % 60;
    return remainMinutes > 0 ? `${hours}h ${String(remainMinutes).padStart(2, '0')}m ago` : `${hours}h ago`;
  }
  if (totalMinutes > 0) return `${totalMinutes}m ago`;
  return 'just now';
}

/**
 * Format elapsed duration from a start timestamp ("45m", "1h 08m", "2h 30m")
 * Used for "In progress for X" display.
 */
export function formatDuration(isoString: string | undefined): string {
  if (!isoString) return '';
  const ms = Date.now() - new Date(isoString).getTime();
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);

  if (hours > 0) {
    const remainMinutes = totalMinutes % 60;
    return remainMinutes > 0 ? `${hours}h ${String(remainMinutes).padStart(2, '0')}m` : `${hours}h`;
  }
  return `${totalMinutes}m`;
}

export type SlaRisk = 'on-track' | 'approaching' | 'breached' | null;

// Priority-based SLA windows (in hours) when no dueDate is set
const PRIORITY_SLA_HOURS: Record<string, number> = {
  urgent: 2,
  critical: 2, // safety alias
  high: 4,
  medium: 8,
  low: 24,
};

/**
 * Compute SLA risk for a work order.
 * Returns null for completed/open/overdue orders (no running SLA).
 * Uses dueDate if present; otherwise derives window from priority + dispatchedAt.
 */
export function getSlaRisk(workOrder: WorkOrder): SlaRisk {
  if (workOrder.status === 'closed' || workOrder.status === 'cancelled' ||
      workOrder.status === 'open') {
    return null;
  }

  const now = Date.now();
  const startMs = new Date(workOrder.dispatchedAt ?? workOrder.createdAt).getTime();

  if (workOrder.dueDate) {
    const dueMs = new Date(workOrder.dueDate).getTime();
    const total = dueMs - startMs;
    if (total <= 0) return 'breached';
    const elapsed = now - startMs;
    const pct = elapsed / total;
    if (pct >= 1) return 'breached';
    if (pct >= 0.75) return 'approaching';
    return 'on-track';
  }

  // No dueDate — use priority window
  const slaHours = PRIORITY_SLA_HOURS[workOrder.priority] ?? 8;
  const slaMs = slaHours * 60 * 60 * 1000;
  const elapsed = now - startMs;
  const pct = elapsed / slaMs;
  if (pct >= 1) return 'breached';
  if (pct >= 0.75) return 'approaching';
  return 'on-track';
}
