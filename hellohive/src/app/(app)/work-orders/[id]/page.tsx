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
import { formatRelativeAgo, formatDuration } from '@/lib/date-utils';
import { getStatusBadgeVariant, getStatusDisplayLabel, EVENT_TYPE_LABELS, BLOCKER_REASON_LABELS } from '@/lib/workorder-types';
import { computeSlaRisk } from '@/lib/workorder-compute';
import { isWorkOrderOverdue, computeStall, hasActiveBlocker } from '@/lib/workorder-compute';
import type { WorkOrder, WorkOrderPriority } from '@/data/seed-data';

// ── Time context string ────────────────────────────────────────────────────────

function getTimeContext(wo: WorkOrder): string {
  // Check overdue first (computed flag)
  if (isWorkOrderOverdue(wo) && wo.dueDate) {
    return `Overdue by ${formatDuration(wo.dueDate)}`;
  }
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
    case 'pending-approval':
      return 'Awaiting facility approval';
    case 'closed': {
      const hrs =
        (new Date(wo.completedAt!).getTime() - new Date(wo.createdAt).getTime()) / 3_600_000;
      return `Resolved in ${hrs.toFixed(1)}h`;
    }
    case 'cancelled':
      return 'Cancelled';
    default:
      return formatRelativeAgo(wo.createdAt);
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function WorkOrderDetailPage() {
  const params = useParams();
  const {
    getAllWorkOrders,
    hasPermission,
    updateWorkOrder,
    performTransition,
    appendWorkOrderEvent,
    currentUser,
    getAllVendors,
    getTechnicianById,
  } = useUser();

  const workOrderId = params.id as string;
  const workOrder = getAllWorkOrders().find((wo) => wo.id === workOrderId);

  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

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

  // Timeline events from wo.events[] (newest first)
  const timelineEvents = [...(workOrder.events ?? [])]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  // Stall detection using v3.1 compute
  const stallInfo = computeStall(workOrder);
  const stallWarning = stallInfo.stalled ? stallInfo.explanation : null;

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

  const slaRisk = computeSlaRisk(workOrder);
  const overdue = isWorkOrderOverdue(workOrder);
  const blockerActive = hasActiveBlocker(workOrder);

  // Actions
  const handleDispatch = () => {
    if (!suggestedVendor) return;
    // First set the vendor (since transition needs it), then transition
    updateWorkOrder(workOrder.id, { assignedVendorId: suggestedVendor.id });
    performTransition(workOrder.id, 'DISPATCHED', `Dispatched to ${suggestedVendor.name}`, {
      selectedVendorId: suggestedVendor.id,
    });
  };

  const PRIORITY_ORDER: WorkOrderPriority[] = ['low', 'medium', 'high', 'urgent'];
  const handleEscalate = () => {
    const idx = PRIORITY_ORDER.indexOf(workOrder.priority);
    if (idx < PRIORITY_ORDER.length - 1) {
      const next = PRIORITY_ORDER[idx + 1];
      appendWorkOrderEvent(workOrder.id, 'PRIORITY_CHANGED', `Priority escalated to ${next}`, {
        oldPriority: workOrder.priority,
        newPriority: next,
      });
    }
  };

  const handleApprove = () => {
    performTransition(workOrder.id, 'FACILITY_APPROVED');
  };

  const handleReject = () => {
    if (!rejectReason.trim()) return;
    performTransition(workOrder.id, 'FACILITY_REJECTED', rejectReason);
    setShowRejectInput(false);
    setRejectReason('');
  };

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    const eventType = currentUser.role === 'Vendor-Tech' ? 'TECH_NOTE_ADDED' : 'NOTE_ADDED';
    appendWorkOrderEvent(workOrder.id, eventType, noteText);
    setNoteText('');
    setShowNoteInput(false);
  };

  const canDispatch = hasPermission('dispatchVendors') && workOrder.status === 'open';
  const showVendorMatch = workOrder.status === 'open' && suggestedVendor;
  const canApprove = hasPermission('approveWorkOrders') && workOrder.status === 'pending-approval';
  const canAddNote = currentUser.role !== 'Team-Viewer';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            {workOrder.id}
          </h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <Badge variant={getStatusBadgeVariant(workOrder.status)}>
              {getStatusDisplayLabel(workOrder.status)}
            </Badge>
            {overdue && (
              <Badge variant="overdue">Overdue</Badge>
            )}
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
          {asset && (
            <>
              <span className="text-gray-400">→</span>
              <span className="text-white font-medium">{asset.name}</span>
            </>
          )}
        </div>
        {asset?.model && (
          <p className="text-xs text-gray-400 mt-2">Model: {asset.model}</p>
        )}
      </Card>

      {/* Cost Summary */}
      {(workOrder.estimatedCost || workOrder.actualCost || workOrder.cost) && (
        <Card className="animate-fadeIn">
          <h2 className="text-lg font-semibold tracking-tight text-white mb-4">Cost</h2>
          <div className="flex items-center gap-6 text-sm">
            {(workOrder.estimatedCost ?? workOrder.cost) != null && (
              <div>
                <span className="text-gray-400">Estimated: </span>
                <span className="text-white font-medium">
                  ${(workOrder.estimatedCost ?? workOrder.cost)?.toLocaleString()}
                </span>
              </div>
            )}
            {workOrder.actualCost != null && (
              <div>
                <span className="text-gray-400">Actual: </span>
                <span className="text-white font-medium">
                  ${workOrder.actualCost.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Payment Status (closed WOs only) */}
      {workOrder.status === 'closed' && workOrder.payment && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-5 py-3">
          <p className="text-sm text-green-400">
            Payment initiated — ${workOrder.payment.amount.toLocaleString()} — Net 7
          </p>
        </div>
      )}

      {/* Blocker Banner */}
      {blockerActive && workOrder.blocker && (
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl px-5 py-4">
          <p className="text-sm font-medium text-orange-400 mb-1">
            Blocker: {BLOCKER_REASON_LABELS[workOrder.blocker.reason]}
          </p>
          {workOrder.blocker.notes && (
            <p className="text-xs text-orange-300">{workOrder.blocker.notes}</p>
          )}
          {workOrder.blocker.estimatedResolutionDate && (
            <p className="text-xs text-orange-300/70 mt-1">
              Estimated resolution: {formatRelativeAgo(workOrder.blocker.estimatedResolutionDate)}
            </p>
          )}
        </div>
      )}

      {/* Approval Section (pending-approval state) */}
      {canApprove && (
        <Card className="animate-fadeIn border-[#8B5CF6]/30">
          <h2 className="text-lg font-semibold tracking-tight text-white mb-4">
            Approval Required
          </h2>
          {workOrder.actualCost != null && (
            <p className="text-sm text-gray-400 mb-4">
              Technician reported cost: <span className="text-white font-medium">${workOrder.actualCost.toLocaleString()}</span>
            </p>
          )}
          {!showRejectInput ? (
            <div className="flex items-center gap-3">
              <Button onClick={handleApprove}>Approve & Close</Button>
              <Button variant="secondary" onClick={() => setShowRejectInput(true)}>
                Reject
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Rejection reason (required)..."
                className="w-full bg-neutral-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] resize-none"
                rows={2}
              />
              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={handleReject}>
                  Confirm Rejection
                </Button>
                <button
                  onClick={() => { setShowRejectInput(false); setRejectReason(''); }}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </Card>
      )}

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
          <p className="text-sm font-medium text-yellow-400 mb-3">{stallWarning}</p>
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

      {/* Pending-approval notice for vendors */}
      {workOrder.status === 'pending-approval' && !canApprove && (
        <div className="bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 rounded-xl px-5 py-3">
          <p className="text-sm text-[#8B5CF6]">Awaiting facility approval</p>
        </div>
      )}

      {/* Timeline */}
      <Card className="animate-fadeIn">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold tracking-tight text-white">Timeline</h2>
          {canAddNote && (
            <button
              onClick={() => setShowNoteInput(!showNoteInput)}
              className="text-xs text-[#F5C518] hover:text-[#F5C518]/80 transition-colors"
            >
              {showNoteInput ? 'Cancel' : '+ Add Note'}
            </button>
          )}
        </div>

        {/* Add Note Input */}
        {showNoteInput && (
          <div className="mb-6 space-y-2">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add a note..."
              className="w-full bg-neutral-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] resize-none"
              rows={2}
            />
            <Button onClick={handleAddNote} disabled={!noteText.trim()}>
              Add Note
            </Button>
          </div>
        )}

        {timelineEvents.length === 0 ? (
          <p className="text-sm text-gray-400">No activity yet.</p>
        ) : (
          <div>
            {timelineEvents.map((event, idx) => {
              const isLatest = idx === 0;
              const isLast = idx === timelineEvents.length - 1;
              const label = EVENT_TYPE_LABELS[event.type] ?? event.type;
              const actorName = event.actor.displayName ??
                users.find((u) => u.id === event.actor.id)?.name ??
                event.actor.id;

              // Event color by category
              const isTransition = [
                'WO_CREATED', 'DISPATCHED', 'JOB_STARTED', 'TECH_MARKED_COMPLETE',
                'FACILITY_APPROVED', 'FACILITY_REJECTED', 'WO_CANCELLED',
              ].includes(event.type);
              const isPayment = event.type === 'PAYMENT_TRIGGERED';
              const isBlocker = event.type === 'BLOCKER_SET' || event.type === 'BLOCKER_CLEARED';

              let dotColor = '#374151'; // default gray
              if (isLatest) dotColor = '#F5C518';
              else if (isTransition) dotColor = '#3B82F6';
              else if (isPayment) dotColor = '#10B981';
              else if (isBlocker) dotColor = '#F97316';

              return (
                <div key={event.id} className="relative flex gap-4">
                  {/* Dot + connector */}
                  <div className="flex flex-col items-center shrink-0 w-5 pt-0.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0 z-10"
                      style={{ backgroundColor: dotColor }}
                    />
                    {!isLast && (
                      <div className="w-px flex-1 bg-slate-700/60 mt-1 mb-0" />
                    )}
                  </div>

                  {/* Content */}
                  <div className={`flex-1 min-w-0 ${isLast ? 'pb-0' : 'pb-5'}`}>
                    <p className="text-sm text-white leading-snug">{label}</p>
                    {event.notes && (
                      <p className="text-xs text-gray-300 mt-0.5">{event.notes}</p>
                    )}
                    {/* Show metadata for cost events */}
                    {event.type === 'TECH_MARKED_COMPLETE' && event.metadata?.actualCost != null && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Reported cost: ${(event.metadata.actualCost as number).toLocaleString()}
                      </p>
                    )}
                    {event.type === 'PRIORITY_CHANGED' && event.metadata && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {event.metadata.oldPriority as string} → {event.metadata.newPriority as string}
                      </p>
                    )}
                    {event.type === 'PAYMENT_TRIGGERED' && event.metadata?.amount != null && (
                      <p className="text-xs text-green-400 mt-0.5">
                        ${(event.metadata.amount as number).toLocaleString()} — Net 7
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-0.5">
                      {event.actor.role !== 'system' && (
                        <span className="text-gray-400">{actorName} · </span>
                      )}
                      {event.actor.role === 'system' && (
                        <span className="text-gray-400">System · </span>
                      )}
                      {formatRelativeAgo(event.at)}
                      {' · '}
                      {format(new Date(event.at), 'MMM d, h:mm a')}
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
