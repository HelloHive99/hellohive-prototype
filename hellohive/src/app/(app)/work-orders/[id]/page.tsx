'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useUser } from '@/context/UserContext';
import { SimulateAssignmentModal } from '@/components/work-orders/SimulateAssignmentModal';
import { properties, users } from '@/data/seed-data';
import { formatRelativeAgo, formatDuration, getSlaRisk } from '@/lib/date-utils';
import type { WorkOrder, WorkOrderPriority } from '@/data/seed-data';

// ── Time context string ────────────────────────────────────────────────────────

function getTimeContext(wo: WorkOrder): string {
  switch (wo.status) {
    case 'open':
      return wo.dueDate
        ? `Created ${formatRelativeAgo(wo.createdAt)} · Due ${formatRelativeAgo(wo.dueDate)}`
        : `Created ${formatRelativeAgo(wo.createdAt)}`;
    case 'dispatched':
      return wo.dispatchedAt
        ? `Dispatched ${formatRelativeAgo(wo.dispatchedAt)} · Not yet started`
        : `Created ${formatRelativeAgo(wo.createdAt)}`;
    case 'in-progress': {
      const elapsed = formatDuration(wo.startedAt ?? wo.dispatchedAt ?? wo.createdAt);
      return wo.dueDate
        ? `In progress for ${elapsed} · Due ${formatRelativeAgo(wo.dueDate)}`
        : `In progress for ${elapsed}`;
    }
    case 'overdue':
      return wo.dueDate ? `Overdue by ${formatDuration(wo.dueDate)}` : 'Overdue';
    case 'completed': {
      const hrs =
        (new Date(wo.completedAt!).getTime() - new Date(wo.createdAt).getTime()) / 3_600_000;
      return `Resolved in ${hrs.toFixed(1)}h`;
    }
    default:
      return formatRelativeAgo(wo.createdAt);
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function WorkOrderDetailPage() {
  const params = useParams();
  const {
    getAllWorkOrders,
    getActivityFeed,
    hasPermission,
    updateWorkOrder,
    addActivityFeedItem,
    currentUser,
    getAllVendors,
    getTechnicianById,
  } = useUser();

  const workOrderId = params.id as string;
  const workOrder = getAllWorkOrders().find((wo) => wo.id === workOrderId);

  const [showSimulateModal, setShowSimulateModal] = useState(false);

  if (!workOrder) {
    return (
      <div className="space-y-6">
        <Card>
          <p className="text-sm text-gray-400">Work order not found.</p>
        </Card>
      </div>
    );
  }

  // Location
  const property = properties.find((p) => p.id === workOrder.propertyId);
  const space = property?.spaces.find((s) => s.id === workOrder.spaceId);
  const asset = space?.assets.find((a) => a.id === workOrder.assetId);

  // Vendor / technician
  const vendors = getAllVendors();
  const assignedVendor = workOrder.assignedVendorId
    ? vendors.find((v) => v.id === workOrder.assignedVendorId)
    : undefined;
  const assignedTech = workOrder.assignedTechnicianId
    ? getTechnicianById(workOrder.assignedTechnicianId)
    : undefined;

  // Suggested vendor (best SLA in same category)
  const suggestedVendor = vendors
    .filter((v) => v.category === workOrder.category)
    .sort((a, b) => b.slaCompliance - a.slaCompliance)[0];

  // Timeline events (newest first)
  const timelineEvents = getActivityFeed()
    .filter((item) => item.workOrderId === workOrder.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Stall detection
  const stallWarning: string | null = (() => {
    if (workOrder.status === 'dispatched' && !workOrder.startedAt && workOrder.dispatchedAt) {
      const h = (Date.now() - new Date(workOrder.dispatchedAt).getTime()) / 3_600_000;
      if (h >= 2) return `Dispatched ${formatDuration(workOrder.dispatchedAt)} ago — not yet started`;
    }
    if (workOrder.status === 'in-progress' && timelineEvents[0]) {
      const h = (Date.now() - new Date(timelineEvents[0].timestamp).getTime()) / 3_600_000;
      if (h >= 24) return `In progress — no status update in ${Math.floor(h / 24)}d`;
    }
    return null;
  })();

  // Priority badge variant
  const priorityBadgeVariant: Record<
    WorkOrderPriority,
    'completed' | 'in-progress' | 'open' | 'overdue' | 'pending'
  > = {
    low: 'completed',
    medium: 'pending',
    high: 'in-progress',
    urgent: 'overdue',
  };

  const slaRisk = getSlaRisk(workOrder);

  // Actions
  const handleDispatch = () => {
    if (!suggestedVendor) return;
    updateWorkOrder(workOrder.id, { status: 'dispatched', assignedVendorId: suggestedVendor.id });
    addActivityFeedItem({
      id: `activity-${Date.now()}`,
      workOrderId: workOrder.id,
      message: `Dispatched to ${suggestedVendor.name}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
    });
  };

  const PRIORITY_ORDER: WorkOrderPriority[] = ['low', 'medium', 'high', 'urgent'];
  const handleEscalate = () => {
    const idx = PRIORITY_ORDER.indexOf(workOrder.priority);
    if (idx < PRIORITY_ORDER.length - 1) {
      const next = PRIORITY_ORDER[idx + 1];
      updateWorkOrder(workOrder.id, { priority: next });
      addActivityFeedItem({
        id: `activity-${Date.now()}`,
        workOrderId: workOrder.id,
        message: `Priority escalated to ${next}`,
        timestamp: new Date().toISOString(),
        userId: currentUser.id,
      });
    }
  };

  const canDispatch = hasPermission('dispatchVendors') && workOrder.status === 'open';
  const showVendorMatch = workOrder.status === 'open' && suggestedVendor;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            {workOrder.id}
          </h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <Badge variant={workOrder.status}>{workOrder.status}</Badge>
            <Badge variant={priorityBadgeVariant[workOrder.priority]}>
              {workOrder.priority} priority
            </Badge>
            {slaRisk === 'approaching' && (
              <Badge variant="pending">Approaching SLA</Badge>
            )}
            {slaRisk === 'breached' && (
              <Badge variant="overdue">SLA Breached</Badge>
            )}
            <span className="text-sm text-gray-400">{getTimeContext(workOrder)}</span>
          </div>
        </div>
      </div>

      {/* Description */}
      <Card className="animate-fadeIn">
        <h2 className="text-lg font-semibold tracking-tight text-white mb-4">
          Description
        </h2>
        <p className="text-sm text-white leading-relaxed">{workOrder.description}</p>
      </Card>

      {/* Location */}
      <Card className="animate-fadeIn">
        <h2 className="text-lg font-semibold tracking-tight text-white mb-4">
          Location
        </h2>
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <span className="text-white font-medium">{property?.name}</span>
          <span className="text-gray-400">→</span>
          <span className="text-white font-medium">{space?.name}</span>
          <span className="text-gray-400">→</span>
          <span className="text-white font-medium">{asset?.name}</span>
        </div>
        {asset?.model && (
          <p className="text-xs text-gray-400 mt-2">Model: {asset.model}</p>
        )}
      </Card>

      {/* Vendor Match Panel */}
      {showVendorMatch && (
        <Card className="animate-fadeIn">
          <h2 className="text-lg font-semibold tracking-tight text-white mb-4">
            Suggested Vendor
          </h2>
          <div className="space-y-4">
            <div className="p-4 bg-neutral-900 rounded-lg">
              <p className="text-base font-semibold text-white mb-2">{suggestedVendor.name}</p>
              <p className="text-sm text-gray-400">
                {suggestedVendor.category} category · {suggestedVendor.slaCompliance.toFixed(1)}%
                SLA compliance · {suggestedVendor.avgResponseTime.toFixed(1)}h avg response ·
                Currently available
              </p>
            </div>
            {canDispatch && (
              <Button onClick={handleDispatch}>Dispatch to {suggestedVendor.name}</Button>
            )}
          </div>
        </Card>
      )}

      {/* Assignment */}
      {workOrder.status !== 'open' && assignedVendor && (
        <Card className="animate-fadeIn">
          <h2 className="text-lg font-semibold tracking-tight text-white mb-4">
            Assignment
          </h2>

          <div className="p-4 bg-neutral-900 rounded-lg mb-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
              Assigned Vendor
            </p>
            <p className="text-base font-semibold text-white mb-1">{assignedVendor.name}</p>
            <p className="text-sm text-gray-400">
              {assignedVendor.category} · {assignedVendor.slaCompliance.toFixed(1)}% SLA
            </p>
          </div>

          {assignedTech ? (
            <div className="p-4 bg-neutral-900 rounded-lg">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                Assigned Technician
              </p>
              <p className="text-base font-semibold text-white mb-1">{assignedTech.fullName}</p>
              <p className="text-sm text-gray-400 mb-2">{assignedTech.roleTitle}</p>
              <div className="flex gap-2 mb-2 flex-wrap">
                {assignedTech.skillTags.slice(0, 3).map((skill) => (
                  <Badge key={skill} variant="pending" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
              {workOrder.vendorReportedEta && (
                <p className="text-xs text-gray-400 mt-2">
                  ETA: {formatRelativeAgo(workOrder.vendorReportedEta)}
                </p>
              )}
            </div>
          ) : (
            <div className="p-4 bg-neutral-900 rounded-lg border border-[#F5C518]/20">
              <p className="text-sm text-gray-400">Vendor will assign technician</p>
            </div>
          )}

          {hasPermission('manageVendors') && !assignedTech && (
            <Button
              variant="secondary"
              onClick={() => setShowSimulateModal(true)}
              className="mt-4"
            >
              Simulate Vendor Assignment
            </Button>
          )}
        </Card>
      )}

      {/* Stall Detection Banner */}
      {stallWarning && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-5 py-4">
          <p className="text-sm font-medium text-yellow-400 mb-3">⚠ {stallWarning}</p>
          <div className="flex items-center gap-2 flex-wrap">
            {hasPermission('manageVendors') && (
              <Button variant="secondary" onClick={() => setShowSimulateModal(true)}>
                Reassign Technician
              </Button>
            )}
            {workOrder.priority !== 'urgent' && (
              <Button variant="secondary" onClick={handleEscalate}>
                Escalate Priority
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Timeline */}
      <Card className="animate-fadeIn">
        <h2 className="text-lg font-semibold tracking-tight text-white mb-6">Timeline</h2>

        {timelineEvents.length === 0 ? (
          <p className="text-sm text-gray-400">No activity yet.</p>
        ) : (
          <div>
            {timelineEvents.map((event, idx) => {
              const user = users.find((u) => u.id === event.userId);
              const isLatest = idx === 0;
              const isLast = idx === timelineEvents.length - 1;

              return (
                <div key={event.id} className="relative flex gap-4">
                  {/* Dot + connector */}
                  <div className="flex flex-col items-center shrink-0 w-5 pt-0.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0 z-10"
                      style={{ backgroundColor: isLatest ? '#F5C518' : '#374151' }}
                    />
                    {!isLast && (
                      <div className="w-px flex-1 bg-slate-700/60 mt-1 mb-0" />
                    )}
                  </div>

                  {/* Content */}
                  <div className={`flex-1 min-w-0 ${isLast ? 'pb-0' : 'pb-5'}`}>
                    <p className="text-sm text-white leading-snug">{event.message}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {user?.name && (
                        <span className="text-gray-400">{user.name} · </span>
                      )}
                      {formatRelativeAgo(event.timestamp)}
                      {' · '}
                      {format(new Date(event.timestamp), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Simulate Assignment Modal */}
      {showSimulateModal && (
        <SimulateAssignmentModal
          isOpen={showSimulateModal}
          onClose={() => setShowSimulateModal(false)}
          workOrder={workOrder}
        />
      )}
    </div>
  );
}
