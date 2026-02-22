'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { NewServiceRequestModal } from '@/components/NewServiceRequestModal';
import { ActionRequiredStrip } from '@/components/dashboard/ActionRequiredStrip';
import { TodayFocusPanel } from '@/components/dashboard/TodayFocusPanel';
import { users } from '@/data/seed-data';
import type { WorkOrder } from '@/data/seed-data';
import { useUser } from '@/context/UserContext';
import { formatRelativeAgo } from '@/lib/date-utils';

export default function Dashboard() {
  const { currentUser, getAccessibleWorkOrders, getActivityFeed, hasPermission, getAllAssets } = useUser();
  const accessibleWorkOrders = getAccessibleWorkOrders();
  const activityFeed = getActivityFeed();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Compute metrics from accessible work orders
  const openCount = accessibleWorkOrders.filter((wo) => wo.status === 'open').length;
  const inProgressCount = accessibleWorkOrders.filter((wo) => wo.status === 'in-progress').length;
  const completedCount = accessibleWorkOrders.filter((wo) => wo.status === 'completed').length;
  const overdueCount = accessibleWorkOrders.filter((wo) => wo.status === 'overdue').length;

  // Calculate average resolution time (in hours) for completed work orders
  const completedWOs = accessibleWorkOrders.filter((wo) => wo.completedAt);
  const avgResolutionTime =
    completedWOs.length > 0
      ? completedWOs.reduce((sum, wo) => {
          const created = new Date(wo.createdAt).getTime();
          const completed = new Date(wo.completedAt!).getTime();
          const hours = (completed - created) / (1000 * 60 * 60);
          return sum + hours;
        }, 0) / completedWOs.length
      : 0;

  // SLA compliance = onTimeCompletions / totalCompletions
  // A WO is "on time" if it was completed before or on its dueDate (or has no dueDate).
  // Overdue status does NOT affect this percentage — it only shows in the Action Required strip.
  const isOnTime = (wo: WorkOrder) =>
    !wo.dueDate || new Date(wo.completedAt!) <= new Date(wo.dueDate);
  const onTimeCount = completedWOs.filter(isOnTime).length;
  const slaCompliance = completedWOs.length > 0 ? (onTimeCount / completedWOs.length) * 100 : 0;

  // 7-day SLA sparkline
  const now = new Date();
  const sparklineData = Array.from({ length: 7 }, (_, i) => {
    const dayStart = startOfDay(subDays(now, 6 - i));
    const dayEnd = endOfDay(dayStart);
    const dayWOs = completedWOs.filter((wo) => {
      const d = new Date(wo.completedAt!);
      return d >= dayStart && d <= dayEnd;
    });
    return {
      day: format(dayStart, 'EEE'),
      compliance:
        dayWOs.length > 0 ? (dayWOs.filter(isOnTime).length / dayWOs.length) * 100 : null,
    };
  });

  // Trend arrow: compare avg of last 7 days vs previous 7 days
  const curr7 = sparklineData.filter((p) => p.compliance !== null);
  const curr7Avg =
    curr7.length > 0 ? curr7.reduce((s, p) => s + p.compliance!, 0) / curr7.length : null;
  const prev7WOs = completedWOs.filter((wo) => {
    const d = new Date(wo.completedAt!);
    return d >= subDays(now, 14) && d < subDays(now, 7);
  });
  const prev7Avg =
    prev7WOs.length > 0
      ? (prev7WOs.filter(isOnTime).length / prev7WOs.length) * 100
      : null;
  const slaTrend: 'up' | 'down' | 'flat' =
    curr7Avg !== null && prev7Avg !== null
      ? curr7Avg > prev7Avg + 1
        ? 'up'
        : curr7Avg < prev7Avg - 1
        ? 'down'
        : 'flat'
      : 'flat';

  // Check if user can see full dashboard
  const canViewDashboard = hasPermission('viewDashboard');

  // If technician or vendor, show filtered "My Work Orders" view
  if (!canViewDashboard) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            My Work Orders
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Work orders assigned to {currentUser.name}
          </p>
        </div>

        <Card>
          <div className="space-y-4">
            {accessibleWorkOrders.length === 0 ? (
              <p className="text-sm text-gray-400">No work orders assigned.</p>
            ) : (
              accessibleWorkOrders.map((wo) => (
                <div
                  key={wo.id}
                  className="flex items-center justify-between pb-4 border-b border-gray-700/20 last:border-0 last:pb-0"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <Link
                        href={`/work-orders/${wo.id}`}
                        className="text-sm font-medium text-[#F5C518] hover:text-[#F5C518]/80 transition-colors"
                      >
                        {wo.id}
                      </Link>
                      <Badge variant={wo.status}>{wo.status}</Badge>
                    </div>
                    <p className="text-sm text-white">{wo.title}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Created {formatRelativeAgo(wo.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    );
  }

  // Full dashboard for users with viewDashboard permission
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Operations Dashboard
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            MLB Studio Campus facilities overview
          </p>
        </div>

        {/* New Service Request Button - Only visible to users with createWorkOrders permission */}
        {hasPermission('createWorkOrders') && (
          <Button onClick={() => setIsModalOpen(true)}>
            New Service Request
          </Button>
        )}
      </div>

      {/* Action Required Strip */}
      <ActionRequiredStrip workOrders={accessibleWorkOrders} />

      {/* Today / This Week Focus Panel */}
      <TodayFocusPanel workOrders={accessibleWorkOrders} assets={getAllAssets()} />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Open WOs */}
        <Card>
          <div>
            <p className="uppercase tracking-wider text-xs font-medium text-gray-400">
              Open Work Orders
            </p>
            <p className="text-4xl font-semibold tracking-tighter tabular-nums text-white mt-2">
              {openCount}
            </p>
          </div>
        </Card>

        {/* In Progress */}
        <Card>
          <div>
            <p className="uppercase tracking-wider text-xs font-medium text-gray-400">
              In Progress
            </p>
            <p className="text-4xl font-semibold tracking-tighter tabular-nums text-white mt-2">
              {inProgressCount}
            </p>
          </div>
        </Card>

        {/* Avg Resolution Time */}
        <Card>
          <div>
            <p className="uppercase tracking-wider text-xs font-medium text-gray-400">
              Avg Resolution
            </p>
            <p className="text-4xl font-semibold tracking-tighter tabular-nums text-white mt-2">
              {avgResolutionTime.toFixed(1)}
              <span className="text-lg text-gray-400 ml-2">hrs</span>
            </p>
          </div>
        </Card>

        {/* SLA Compliance - Highlighted with sparkline + trend */}
        <Card highlight>
          <div className="flex items-start justify-between">
            <div>
              <p className="uppercase tracking-wider text-xs font-medium text-gray-400">
                SLA Compliance
              </p>
              <div className="flex items-baseline gap-2 mt-2">
                <p className="text-4xl font-semibold tracking-tighter tabular-nums text-[#F5C518]">
                  {slaCompliance.toFixed(1)}
                  <span className="text-lg text-gray-400 ml-1">%</span>
                </p>
                {slaTrend === 'up' && (
                  <span className="text-sm font-medium text-green-400">↑</span>
                )}
                {slaTrend === 'down' && (
                  <span className="text-sm font-medium text-red-400">↓</span>
                )}
                {slaTrend === 'flat' && (
                  <span className="text-sm font-medium text-gray-500">→</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">vs prev 7d</p>
            </div>
            {sparklineData.some((d) => d.compliance !== null) && (
              <ResponsiveContainer width={80} height={40}>
                <LineChart data={sparklineData}>
                  <Line
                    type="monotone"
                    dataKey="compliance"
                    stroke="#F5C518"
                    strokeWidth={1.5}
                    dot={false}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* Work Order Status Pipeline */}
      <Card>
        <h2 className="text-xl font-semibold tracking-tight text-white mb-6">
          Work Order Pipeline
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white">Open</span>
              <Badge variant="open">{openCount}</Badge>
            </div>
            <div className="h-2 bg-neutral-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-white"
                style={{
                  width: `${
                    accessibleWorkOrders.length > 0
                      ? (openCount / accessibleWorkOrders.length) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white">In Progress</span>
              <Badge variant="in-progress">{inProgressCount}</Badge>
            </div>
            <div className="h-2 bg-neutral-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#F5C518]"
                style={{
                  width: `${
                    accessibleWorkOrders.length > 0
                      ? (inProgressCount / accessibleWorkOrders.length) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white">Completed</span>
              <Badge variant="completed">{completedCount}</Badge>
            </div>
            <div className="h-2 bg-neutral-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#2ECC71]"
                style={{
                  width: `${
                    accessibleWorkOrders.length > 0
                      ? (completedCount / accessibleWorkOrders.length) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white">Overdue</span>
              <Badge variant="overdue">{overdueCount}</Badge>
            </div>
            <div className="h-2 bg-neutral-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#E74C3C]"
                style={{
                  width: `${
                    accessibleWorkOrders.length > 0
                      ? (overdueCount / accessibleWorkOrders.length) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Recent Activity Feed */}
      <Card>
        <h2 className="text-xl font-semibold tracking-tight text-white mb-6">
          Recent Activity
        </h2>

        <div className="space-y-4">
          {activityFeed.slice(0, 10).map((activity) => {
            const user = users.find((u) => u.id === activity.userId);
            return (
              <div
                key={activity.id}
                className="flex items-start gap-4 pb-4 border-b border-gray-700/20 last:border-0 last:pb-0"
              >
                <div className="flex-1">
                  <p className="text-sm text-white">
                    <Link
                      href={`/work-orders/${activity.workOrderId}`}
                      className="font-medium text-[#F5C518] hover:text-[#F5C518]/80 transition-colors"
                    >
                      {activity.workOrderId}
                    </Link>{' '}
                    — {activity.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatRelativeAgo(activity.timestamp)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* New Service Request Modal */}
      <NewServiceRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
