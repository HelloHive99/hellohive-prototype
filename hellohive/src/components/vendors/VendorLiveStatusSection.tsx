import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatDistanceToNow } from 'date-fns';
import type { Vendor } from '@/data/seed-data';

interface VendorLiveStatusSectionProps {
  vendor: Vendor;
}

export function VendorLiveStatusSection({ vendor }: VendorLiveStatusSectionProps) {
  const statusVariant =
    vendor.operationalStatus.currentStatus === 'available' ? 'completed' :
    vendor.operationalStatus.currentStatus === 'limited' ? 'pending' : 'overdue';

  return (
    <Card className="animate-fadeIn">
      <h2 className="text-lg font-semibold tracking-tight text-white mb-4">
        Live Operational Status
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current Status */}
        <div className="p-4 bg-gray-900 border border-neutral-800 rounded-lg">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
            Current Status
          </p>
          <Badge variant={statusVariant} className="text-sm">
            {vendor.operationalStatus.currentStatus.toUpperCase()}
          </Badge>
        </div>

        {/* Active Work Orders */}
        <div className="p-4 bg-gray-900 border border-neutral-800 rounded-lg">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
            Active Work Orders
          </p>
          <p className="text-2xl font-semibold tracking-tight text-white">
            {vendor.operationalStatus.activeWorkOrdersCount}
          </p>
        </div>

        {/* Last Dispatch */}
        <div className="p-4 bg-gray-900 border border-neutral-800 rounded-lg">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
            Last Dispatch
          </p>
          <p className="text-sm text-white">
            {formatDistanceToNow(new Date(vendor.operationalStatus.lastDispatchTime), {
              addSuffix: true,
            })}
          </p>
        </div>

        {/* Priority Tier */}
        <div className="p-4 bg-gray-900 border border-neutral-800 rounded-lg">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
            Priority Tier
          </p>
          <Badge
            variant={
              vendor.operationalStatus.priorityTier === 'platinum'
                ? 'completed'
                : vendor.operationalStatus.priorityTier === 'gold'
                ? 'in-progress'
                : 'pending'
            }
            className="text-sm"
          >
            {vendor.operationalStatus.priorityTier.toUpperCase()}
          </Badge>
        </div>
      </div>
    </Card>
  );
}
