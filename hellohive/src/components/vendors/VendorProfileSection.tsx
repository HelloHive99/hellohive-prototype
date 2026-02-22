import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { Vendor } from '@/data/seed-data';

interface VendorProfileSectionProps {
  vendor: Vendor;
}

export function VendorProfileSection({ vendor }: VendorProfileSectionProps) {
  return (
    <Card className="animate-fadeIn">
      <h2 className="text-lg font-semibold tracking-tight text-white mb-4">
        Profile
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Primary Contact */}
        <div className="p-4 bg-gray-900 border border-neutral-800 rounded-lg">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
            Primary Contact
          </p>
          <p className="text-sm text-white font-medium">{vendor.contact}</p>
          <p className="text-sm text-gray-400 mt-1">{vendor.phone}</p>
          <p className="text-sm text-gray-400">{vendor.primaryContactEmail}</p>
        </div>

        {/* Emergency Contact */}
        <div className="p-4 bg-gray-900 border border-neutral-800 rounded-lg">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
            Emergency Contact
          </p>
          <p className="text-sm text-white font-medium">
            {vendor.emergencyContact.name}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {vendor.emergencyContact.phone}
          </p>
          <p className="text-sm text-gray-400">
            {vendor.emergencyContact.email}
          </p>
        </div>

        {/* Service Regions */}
        <div className="p-4 bg-gray-900 border border-neutral-800 rounded-lg">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
            Service Regions
          </p>
          <div className="flex flex-wrap gap-2">
            {vendor.serviceRegions.map((region) => (
              <Badge key={region} variant="pending">
                {region}
              </Badge>
            ))}
          </div>
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
            className="text-base"
          >
            {vendor.operationalStatus.priorityTier.toUpperCase()}
          </Badge>
        </div>
      </div>
    </Card>
  );
}
