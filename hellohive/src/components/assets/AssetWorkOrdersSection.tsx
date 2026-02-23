import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { Asset, WorkOrder, WorkOrderPriority } from '@/data/seed-data';
import { formatDistanceToNow, format } from 'date-fns';
import Link from 'next/link';
import { getStatusBadgeVariant, getStatusDisplayLabel } from '@/lib/workorder-types';
import { isWorkOrderOverdue } from '@/lib/workorder-compute';

interface AssetWorkOrdersSectionProps {
  asset: Asset;
  workOrders: WorkOrder[];
}

export function AssetWorkOrdersSection({ asset, workOrders }: AssetWorkOrdersSectionProps) {
  const totalWorkOrders = workOrders.length;
  const openWorkOrders = workOrders.filter(wo => ['open', 'in-progress', 'dispatched', 'pending-approval'].includes(wo.status)).length;
  const overdueWorkOrders = workOrders.filter(wo => isWorkOrderOverdue(wo)).length;

  const priorityBadgeVariant = (priority: WorkOrderPriority) => {
    switch (priority) {
      case 'urgent':
      case 'high':
        return 'overdue';
      case 'medium':
        return 'pending';
      default:
        return 'open';
    }
  };

  return (
    <Card>
      <h2 className="text-lg font-semibold tracking-tight text-white mb-4">Related Work Orders</h2>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
            Total Work Orders
          </p>
          <p className="text-2xl font-semibold tracking-tight text-white">
            {totalWorkOrders}
          </p>
          <p className="text-xs text-gray-400 mt-1">All time</p>
        </div>

        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
            Open Work Orders
          </p>
          <p className="text-2xl font-semibold tracking-tight text-white">
            {openWorkOrders}
          </p>
          <p className="text-xs text-gray-400 mt-1">Currently active</p>
        </div>

        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
            Overdue Work Orders
          </p>
          <p className="text-2xl font-semibold tracking-tight text-white">
            {overdueWorkOrders}
          </p>
          <p className="text-xs text-gray-400 mt-1">Past due date</p>
        </div>
      </div>

      {/* Work Orders Table */}
      {workOrders.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider pb-3">
                  ID
                </th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider pb-3">
                  Title
                </th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider pb-3">
                  Status
                </th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider pb-3">
                  Priority
                </th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider pb-3">
                  Created
                </th>
              </tr>
            </thead>
            <tbody>
              {workOrders.map((wo) => (
                <tr key={wo.id} className="border-b border-neutral-800 last:border-0">
                  <td className="py-3">
                    <Link
                      href={`/work-orders/${wo.id}`}
                      className="text-sm text-[#F5C518] hover:text-[#F5C518]/80 transition-colors font-medium"
                    >
                      #{wo.id}
                    </Link>
                  </td>
                  <td className="py-3">
                    <p className="text-sm text-white">{wo.title}</p>
                  </td>
                  <td className="py-3">
                    <Badge variant={getStatusBadgeVariant(wo.status)} className="capitalize">
                      {getStatusDisplayLabel(wo.status)}
                    </Badge>
                  </td>
                  <td className="py-3">
                    <Badge variant={priorityBadgeVariant(wo.priority)} className="capitalize">
                      {wo.priority}
                    </Badge>
                  </td>
                  <td className="py-3">
                    <p className="text-sm text-gray-400">
                      {formatDistanceToNow(new Date(wo.createdAt), { addSuffix: true })}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8 text-center">
          <p className="text-gray-400">No work orders found for this asset</p>
        </div>
      )}
    </Card>
  );
}
