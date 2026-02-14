'use client';

import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useUser } from '@/context/UserContext';
import { properties, vendors, users } from '@/data/seed-data';
import { formatDistanceToNow } from 'date-fns';
import type { WorkOrderPriority } from '@/data/seed-data';

export default function WorkOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { getAllWorkOrders, getActivityFeed, hasPermission, updateWorkOrder, addActivityFeedItem, currentUser } = useUser();

  const workOrderId = params.id as string;
  const workOrder = getAllWorkOrders().find((wo) => wo.id === workOrderId);

  if (!workOrder) {
    return (
      <div className="space-y-6">
        <Card>
          <p className="text-sm text-[#4A4953]">Work order not found.</p>
        </Card>
      </div>
    );
  }

  // Get location information
  const property = properties.find((p) => p.id === workOrder.propertyId);
  const space = property?.spaces.find((s) => s.id === workOrder.spaceId);
  const asset = space?.assets.find((a) => a.id === workOrder.assetId);

  // Get assigned vendor if any
  const assignedVendor = workOrder.assignedVendorId
    ? vendors.find((v) => v.id === workOrder.assignedVendorId)
    : undefined;

  // Find suggested vendor based on category (best SLA in category)
  const suggestedVendor = vendors
    .filter((v) => v.category === workOrder.category)
    .sort((a, b) => b.slaCompliance - a.slaCompliance)[0];

  // Get timeline events for this work order
  const timelineEvents = getActivityFeed()
    .filter((item) => item.workOrderId === workOrder.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Priority badge variant mapping
  const priorityBadgeVariant: Record<WorkOrderPriority, 'completed' | 'in-progress' | 'open' | 'overdue' | 'pending'> = {
    low: 'completed',
    medium: 'pending',
    high: 'in-progress',
    urgent: 'overdue',
  };

  // Handle dispatch
  const handleDispatch = () => {
    if (!suggestedVendor) return;

    updateWorkOrder(workOrder.id, {
      status: 'dispatched',
      assignedVendorId: suggestedVendor.id,
    });

    // Add activity feed item
    const activityId = `activity-${Date.now()}`;
    addActivityFeedItem({
      id: activityId,
      workOrderId: workOrder.id,
      message: `Dispatched to ${suggestedVendor.name}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
    });
  };

  const canDispatch = hasPermission('dispatchVendors') && workOrder.status === 'open';
  const showVendorMatch = workOrder.status === 'open' && suggestedVendor;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#F5F0EB]">
            {workOrder.id}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <Badge variant={workOrder.status}>{workOrder.status}</Badge>
            <Badge variant={priorityBadgeVariant[workOrder.priority]}>
              {workOrder.priority} priority
            </Badge>
            <span className="text-sm text-[#4A4953]">
              Created {formatDistanceToNow(new Date(workOrder.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      <Card className="animate-fadeIn">
        <h2 className="text-lg font-semibold tracking-tight text-[#F5F0EB] mb-4">
          Description
        </h2>
        <p className="text-sm text-[#F5F0EB] leading-relaxed">
          {workOrder.description}
        </p>
      </Card>

      {/* Location */}
      <Card className="animate-fadeIn">
        <h2 className="text-lg font-semibold tracking-tight text-[#F5F0EB] mb-4">
          Location
        </h2>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-[#F5F0EB] font-medium">{property?.name}</span>
          <span className="text-[#4A4953]">→</span>
          <span className="text-[#F5F0EB] font-medium">{space?.name}</span>
          <span className="text-[#4A4953]">→</span>
          <span className="text-[#F5F0EB] font-medium">{asset?.name}</span>
        </div>
        {asset?.model && (
          <p className="text-xs text-[#4A4953] mt-2">
            Model: {asset.model}
          </p>
        )}
      </Card>

      {/* Vendor Match Panel - Only show if work order is open */}
      {showVendorMatch && (
        <Card className="animate-fadeIn">
          <h2 className="text-lg font-semibold tracking-tight text-[#F5F0EB] mb-4">
            Suggested Vendor
          </h2>
          <div className="space-y-4">
            <div className="p-4 bg-[#1E1520] rounded-lg">
              <p className="text-base font-semibold text-[#F5F0EB] mb-2">
                {suggestedVendor.name}
              </p>
              <p className="text-sm text-[#4A4953]">
                {suggestedVendor.category} category • {suggestedVendor.slaCompliance.toFixed(1)}% SLA compliance • {suggestedVendor.avgResponseTime.toFixed(1)} hr avg response • Currently available
              </p>
            </div>

            {canDispatch && (
              <Button onClick={handleDispatch}>
                Dispatch to {suggestedVendor.name}
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Assigned Vendor - Show if already dispatched */}
      {workOrder.status !== 'open' && assignedVendor && (
        <Card className="animate-fadeIn">
          <h2 className="text-lg font-semibold tracking-tight text-[#F5F0EB] mb-4">
            Assigned Vendor
          </h2>
          <div className="p-4 bg-[#1E1520] rounded-lg">
            <p className="text-base font-semibold text-[#F5F0EB] mb-2">
              {assignedVendor.name}
            </p>
            <p className="text-sm text-[#4A4953]">
              {assignedVendor.category} category • {assignedVendor.slaCompliance.toFixed(1)}% SLA compliance • {assignedVendor.avgResponseTime.toFixed(1)} hr avg response
            </p>
          </div>
        </Card>
      )}

      {/* Timeline */}
      <Card className="animate-fadeIn">
        <h2 className="text-lg font-semibold tracking-tight text-[#F5F0EB] mb-6">
          Timeline
        </h2>
        <div className="space-y-4">
          {timelineEvents.length === 0 ? (
            <p className="text-sm text-[#4A4953]">No activity yet.</p>
          ) : (
            timelineEvents.map((event) => {
              const user = users.find((u) => u.id === event.userId);
              return (
                <div
                  key={event.id}
                  className="flex items-start gap-4 pb-4 border-b border-[#4A4953]/20 last:border-0 last:pb-0"
                >
                  <div className="flex-1">
                    <p className="text-sm text-[#F5F0EB]">
                      {event.message}
                    </p>
                    <p className="text-xs text-[#4A4953] mt-1">
                      {user?.name} • {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}
