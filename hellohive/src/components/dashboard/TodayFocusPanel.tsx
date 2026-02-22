'use client';

import Link from 'next/link';
import { startOfDay, endOfDay, subDays, addDays } from 'date-fns';
import type { WorkOrder, Asset } from '@/data/seed-data';

// ── Helpers ───────────────────────────────────────────────────────────────────

const isOnTime = (wo: WorkOrder) =>
  !wo.dueDate || new Date(wo.completedAt!) <= new Date(wo.dueDate);

// ── Metric Row ────────────────────────────────────────────────────────────────

function MetricRow({
  label,
  value,
  unit,
  href,
  accent,
}: {
  label: string;
  value: number | string | null;
  unit?: string;
  href?: string;
  accent?: 'red' | 'orange';
}) {
  const isEmpty = value === null || value === 0;
  const valueColor = isEmpty
    ? 'text-gray-600'
    : accent === 'red'
    ? 'text-red-400'
    : accent === 'orange'
    ? 'text-orange-400'
    : 'text-white';

  const content = (
    <div className="flex items-baseline gap-2 py-2">
      <span className={`text-2xl font-semibold tabular-nums tracking-tight ${valueColor}`}>
        {value ?? '—'}
        {unit && !isEmpty && (
          <span className="text-sm text-gray-400 ml-1">{unit}</span>
        )}
      </span>
      <span className="text-xs text-gray-500 flex-1">{label}</span>
    </div>
  );

  if (href && !isEmpty) {
    return (
      <Link href={href} className="block hover:bg-white/[0.03] -mx-3 px-3 rounded-md transition-colors">
        {content}
      </Link>
    );
  }
  return <div>{content}</div>;
}

// ── Panel ─────────────────────────────────────────────────────────────────────

export function TodayFocusPanel({
  workOrders,
  assets,
}: {
  workOrders: WorkOrder[];
  assets: Asset[];
}) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfDay(subDays(now, 7));
  const sevenDaysOut = addDays(endOfDay(now), 7);

  // ── TODAY ──────────────────────────────────────────────────────────────────

  const needsAssign = workOrders.filter((wo) => wo.status === 'open').length;

  const dueToday = workOrders.filter(
    (wo) =>
      wo.dueDate &&
      new Date(wo.dueDate) >= todayStart &&
      new Date(wo.dueDate) <= todayEnd &&
      wo.status !== 'completed'
  ).length;

  const overdueCount = workOrders.filter((wo) => wo.status === 'overdue').length;

  const urgentOpen = workOrders.filter(
    (wo) => wo.priority === 'urgent' && wo.status === 'open'
  ).length;

  // ── THIS WEEK ──────────────────────────────────────────────────────────────

  const pmDue = assets.filter(
    (a) =>
      a.nextPmDate &&
      new Date(a.nextPmDate) >= now &&
      new Date(a.nextPmDate) <= sevenDaysOut
  ).length;

  const weekWOs = workOrders.filter((wo) => new Date(wo.createdAt) >= weekStart);

  const weekWithDispatch = weekWOs.filter((wo) => wo.dispatchedAt);
  const avgResponse =
    weekWithDispatch.length > 0
      ? weekWithDispatch.reduce(
          (sum, wo) =>
            sum +
            (new Date(wo.dispatchedAt!).getTime() - new Date(wo.createdAt).getTime()) /
              3_600_000,
          0
        ) / weekWithDispatch.length
      : null;

  const weekCompleted = weekWOs.filter((wo) => wo.completedAt);
  const avgResolution =
    weekCompleted.length > 0
      ? weekCompleted.reduce(
          (sum, wo) =>
            sum +
            (new Date(wo.completedAt!).getTime() - new Date(wo.createdAt).getTime()) /
              3_600_000,
          0
        ) / weekCompleted.length
      : null;

  const weekSla =
    weekCompleted.length > 0
      ? (weekCompleted.filter(isOnTime).length / weekCompleted.length) * 100
      : null;

  return (
    <div className="bg-neutral-900 border border-slate-800/50 rounded-xl px-6 py-5">
      <div className="grid grid-cols-2 gap-0 divide-x divide-slate-800/60">
        {/* TODAY */}
        <div className="pr-8">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">
            Today
          </p>
          <MetricRow
            label="needs assignment"
            value={needsAssign}
            href="/work-orders?status=open"
            accent={needsAssign > 0 ? 'orange' : undefined}
          />
          <MetricRow
            label="due today"
            value={dueToday}
            href="/work-orders?status=open"
          />
          <MetricRow
            label="overdue"
            value={overdueCount}
            href="/work-orders?status=overdue"
            accent={overdueCount > 0 ? 'red' : undefined}
          />
          <MetricRow
            label="urgent open"
            value={urgentOpen}
            href="/work-orders?status=open"
            accent={urgentOpen > 0 ? 'orange' : undefined}
          />
        </div>

        {/* THIS WEEK */}
        <div className="pl-8">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">
            This Week (7d)
          </p>
          <MetricRow
            label="PM due"
            value={pmDue}
            href="/assets"
            accent={pmDue > 0 ? 'orange' : undefined}
          />
          <MetricRow
            label="avg response"
            value={avgResponse !== null ? avgResponse.toFixed(1) : null}
            unit="h"
          />
          <MetricRow
            label="avg resolution"
            value={avgResolution !== null ? avgResolution.toFixed(1) : null}
            unit="h"
          />
          <MetricRow
            label="SLA compliance"
            value={weekSla !== null ? `${weekSla.toFixed(1)}%` : null}
          />
        </div>
      </div>
    </div>
  );
}
