'use client';

import { startOfDay, endOfDay, subDays } from 'date-fns';
import { isWorkOrderOverdue } from '@/lib/workorder-compute';
import type { WorkOrder } from '@/data/seed-data';

interface Props {
  workOrders: WorkOrder[];
}

function MetricRow({
  value,
  label,
  alert,
}: {
  value: string | number;
  label: string;
  alert?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-xs text-gray-500 truncate">{label}</span>
      <span className={`text-sm font-semibold tabular-nums whitespace-nowrap ${alert ? 'text-[#F5C518]' : 'text-gray-300'}`}>
        {value}
      </span>
    </div>
  );
}

export function VendorSummaryPanel({ workOrders }: Props) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd   = endOfDay(now);
  const weekStart  = startOfDay(subDays(now, 7));

  // TODAY
  const dueToday = workOrders.filter(
    (wo) => wo.dueDate && new Date(wo.dueDate) >= todayStart && new Date(wo.dueDate) <= todayEnd && wo.status !== 'closed' && wo.status !== 'cancelled'
  ).length;
  const overdueNow = workOrders.filter((wo) => isWorkOrderOverdue(wo)).length;
  const unassigned = workOrders.filter(
    (wo) => ['dispatched', 'in-progress'].includes(wo.status) && !wo.assignedTechnicianId
  ).length;
  const urgentOpen = workOrders.filter(
    (wo) => ['urgent', 'high'].includes(wo.priority) && wo.status !== 'closed' && wo.status !== 'cancelled'
  ).length;

  // THIS WEEK
  const weekWOs = workOrders.filter((wo) => new Date(wo.createdAt) >= weekStart);
  const weekCompleted = weekWOs.filter((wo) => wo.completedAt);
  const isOnTime = (wo: WorkOrder) => !wo.dueDate || new Date(wo.completedAt!) <= new Date(wo.dueDate);

  const withDispatch = weekWOs.filter((wo) => wo.dispatchedAt);
  const avgResponse =
    withDispatch.length > 0
      ? withDispatch.reduce(
          (s, wo) => s + (new Date(wo.dispatchedAt!).getTime() - new Date(wo.createdAt).getTime()) / 3_600_000,
          0
        ) / withDispatch.length
      : null;

  const avgResolution =
    weekCompleted.length > 0
      ? weekCompleted.reduce(
          (s, wo) => s + (new Date(wo.completedAt!).getTime() - new Date(wo.createdAt).getTime()) / 3_600_000,
          0
        ) / weekCompleted.length
      : null;

  const weekSla =
    weekCompleted.length > 0
      ? (weekCompleted.filter(isOnTime).length / weekCompleted.length) * 100
      : null;

  return (
    <div className="mb-5 pb-5 border-b border-slate-800/50">
      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2">Today</p>
      <div className="space-y-1.5 mb-4">
        <MetricRow value={dueToday} label="due today" alert={dueToday > 0} />
        <MetricRow value={overdueNow} label="overdue" alert={overdueNow > 0} />
        <MetricRow value={unassigned} label="unassigned" alert={unassigned > 0} />
        <MetricRow value={urgentOpen} label="urgent / high open" />
      </div>

      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2">This Week</p>
      <div className="space-y-1.5">
        <MetricRow value={weekCompleted.length} label="completed" />
        <MetricRow value={avgResponse !== null ? `${avgResponse.toFixed(1)}h` : '—'} label="avg response" />
        <MetricRow value={avgResolution !== null ? `${avgResolution.toFixed(1)}h` : '—'} label="avg resolution" />
        <MetricRow value={weekSla !== null ? `${weekSla.toFixed(0)}%` : '—'} label="SLA compliance" />
      </div>
    </div>
  );
}
