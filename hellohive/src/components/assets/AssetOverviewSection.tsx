import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { Asset, Property, Space } from '@/data/seed-data';
import { format } from 'date-fns';
import Link from 'next/link';

interface AssetOverviewSectionProps {
  asset: Asset;
  property: Property;
  space: Space;
}

export function AssetOverviewSection({ asset, property, space }: AssetOverviewSectionProps) {
  const isWarrantyActive = asset.warrantyExpiration && new Date(asset.warrantyExpiration) > new Date();

  return (
    <Card>
      <h2 className="text-lg font-semibold tracking-tight text-white mb-4">Asset Overview</h2>

      {/* Location Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm">
        <Link
          href={`/properties`}
          className="text-[#F5C518] hover:text-[#F5C518]/80 transition-colors"
        >
          {property.name}
        </Link>
        <span className="text-gray-400">→</span>
        <span className="text-white">{space.name}</span>
        <span className="text-gray-400">→</span>
        <span className="text-white font-medium">{asset.name}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Basic Info */}
        <div className="p-4 bg-neutral-900 rounded-lg">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
            Equipment Details
          </p>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-400">Type:</span>
              <span className="text-sm text-white font-medium">{asset.type}</span>
            </div>
            {asset.model && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Model:</span>
                <span className="text-sm text-white font-medium">{asset.model}</span>
              </div>
            )}
            {asset.manufacturer && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Manufacturer:</span>
                <span className="text-sm text-white font-medium">{asset.manufacturer}</span>
              </div>
            )}
          </div>
        </div>

        {/* Serial & Installation */}
        <div className="p-4 bg-neutral-900 rounded-lg">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
            Identification
          </p>
          <div className="space-y-2">
            {asset.serialNumber && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Serial Number:</span>
                <span className="text-sm text-white font-mono">{asset.serialNumber}</span>
              </div>
            )}
            {asset.installationDate && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Installed:</span>
                <span className="text-sm text-white">{format(new Date(asset.installationDate), 'MMM d, yyyy')}</span>
              </div>
            )}
            {asset.warrantyExpiration && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Warranty:</span>
                <div className="flex items-center gap-2">
                  <Badge variant={isWarrantyActive ? 'completed' : 'overdue'} className="text-xs">
                    {isWarrantyActive ? 'Active' : 'Expired'}
                  </Badge>
                  <span className="text-xs text-gray-400">
                    {format(new Date(asset.warrantyExpiration), 'MMM yyyy')}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Ownership */}
        <div className="p-4 bg-neutral-900 rounded-lg">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
            Primary Owner
          </p>
          <p className="text-base font-semibold text-white">{asset.owner}</p>
        </div>

        {/* Location */}
        <div className="p-4 bg-neutral-900 rounded-lg">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
            Location
          </p>
          <div className="space-y-1">
            <p className="text-sm text-white font-medium">{property.name}</p>
            <p className="text-xs text-gray-400">{space.name} ({space.type})</p>
            <p className="text-xs text-gray-400">{property.address}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
