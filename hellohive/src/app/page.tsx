'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { NewServiceRequestModal } from '@/components/NewServiceRequestModal';
import { users } from '@/data/seed-data';
import { useUser } from '@/context/UserContext';
import { formatDistanceToNow } from 'date-fns';

export default function Dashboard() {
  const { currentUser, getAccessibleWorkOrders, getActivityFeed, hasPermission } = useUser();
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

  // Calculate SLA compliance (completed on time vs overdue)
  const totalClosed = completedCount + overdueCount;
  const slaCompliance = totalClosed > 0 ? (completedCount / totalClosed) * 100 : 0;

  // Check if user can see full dashboard
  const canViewDashboard = hasPermission('viewDashboard');
  const canViewCost = hasPermission('viewCostData');

  // If technician or vendor, show filtered "My Work Orders" view
  if (!canViewDashboard) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#F5F0EB]">
            My Work Orders
          </h1>
          <p className="text-sm text-[#4A4953] mt-1">
            Work orders assigned to {currentUser.name}
          </p>
        </div>

        <Card>
          <div className="space-y-4">
            {accessibleWorkOrders.length === 0 ? (
              <p className="text-sm text-[#4A4953]">No work orders assigned.</p>
            ) : (
              accessibleWorkOrders.map((wo) => (
                <div
                  key={wo.id}
                  className="flex items-center justify-between pb-4 border-b border-[#4A4953]/20 last:border-0 last:pb-0"
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
                    <p className="text-sm text-[#F5F0EB]">{wo.title}</p>
                    <p className="text-xs text-[#4A4953] mt-1">
                      Created {formatDistanceToNow(new Date(wo.createdAt), { addSuffix: true })}
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
          <h1 className="text-2xl font-semibold tracking-tight text-[#F5F0EB]">
            Operations Dashboard
          </h1>
          <p className="text-sm text-[#4A4953] mt-1">
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

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Open WOs */}
        <Card>
          <div>
            <p className="uppercase tracking-wider text-xs font-medium text-[#4A4953]">
              Open Work Orders
            </p>
            <p className="text-4xl font-semibold tracking-tighter tabular-nums text-[#F5F0EB] mt-2">
              {openCount}
            </p>
          </div>
        </Card>

        {/* In Progress */}
        <Card>
          <div>
            <p className="uppercase tracking-wider text-xs font-medium text-[#4A4953]">
              In Progress
            </p>
            <p className="text-4xl font-semibold tracking-tighter tabular-nums text-[#F5F0EB] mt-2">
              {inProgressCount}
            </p>
          </div>
        </Card>

        {/* Avg Resolution Time */}
        <Card>
          <div>
            <p className="uppercase tracking-wider text-xs font-medium text-[#4A4953]">
              Avg Resolution
            </p>
            <p className="text-4xl font-semibold tracking-tighter tabular-nums text-[#F5F0EB] mt-2">
              {avgResolutionTime.toFixed(1)}
              <span className="text-lg text-[#4A4953] ml-2">hrs</span>
            </p>
          </div>
        </Card>

        {/* SLA Compliance - Highlighted */}
        <Card highlight>
          <div>
            <p className="uppercase tracking-wider text-xs font-medium text-[#4A4953]">
              SLA Compliance
            </p>
            <p className="text-4xl font-semibold tracking-tighter tabular-nums text-[#F5C518] mt-2">
              {slaCompliance.toFixed(1)}
              <span className="text-lg text-[#4A4953] ml-2">%</span>
            </p>
          </div>
        </Card>
      </div>

      {/* Work Order Status Pipeline */}
      <Card>
        <h2 className="text-xl font-semibold tracking-tight text-[#F5F0EB] mb-6">
          Work Order Pipeline
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[#F5F0EB]">Open</span>
              <Badge variant="open">{openCount}</Badge>
            </div>
            <div className="h-2 bg-[#1E1520] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#F5F0EB]"
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
              <span className="text-sm font-medium text-[#F5F0EB]">In Progress</span>
              <Badge variant="in-progress">{inProgressCount}</Badge>
            </div>
            <div className="h-2 bg-[#1E1520] rounded-full overflow-hidden">
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
              <span className="text-sm font-medium text-[#F5F0EB]">Completed</span>
              <Badge variant="completed">{completedCount}</Badge>
            </div>
            <div className="h-2 bg-[#1E1520] rounded-full overflow-hidden">
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
              <span className="text-sm font-medium text-[#F5F0EB]">Overdue</span>
              <Badge variant="overdue">{overdueCount}</Badge>
            </div>
            <div className="h-2 bg-[#1E1520] rounded-full overflow-hidden">
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
        <h2 className="text-xl font-semibold tracking-tight text-[#F5F0EB] mb-6">
          Recent Activity
        </h2>

        <div className="space-y-4">
          {activityFeed.slice(0, 10).map((activity) => {
            const user = users.find((u) => u.id === activity.userId);
            return (
              <div
                key={activity.id}
                className="flex items-start gap-4 pb-4 border-b border-[#4A4953]/20 last:border-0 last:pb-0"
              >
                <div className="flex-1">
                  <p className="text-sm text-[#F5F0EB]">
                    <Link
                      href={`/work-orders/${activity.workOrderId}`}
                      className="font-medium text-[#F5C518] hover:text-[#F5C518]/80 transition-colors"
                    >
                      {activity.workOrderId}
                    </Link>{' '}
                    — {activity.message}
                  </p>
                  <p className="text-xs text-[#4A4953] mt-1">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
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
