import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { Asset, User, Technician, Vendor } from '@/data/seed-data';
import Link from 'next/link';

interface AssetOwnershipSectionProps {
  asset: Asset;
  primaryTech?: Technician;
  preferredVendor?: Vendor;
  escalationOwner?: User;
}

export function AssetOwnershipSection({
  asset,
  primaryTech,
  preferredVendor,
  escalationOwner,
}: AssetOwnershipSectionProps) {
  return (
    <Card>
      <h2 className="text-lg font-semibold tracking-tight text-white mb-4">Ownership & Accountability</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Primary Owner */}
        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
            Primary Owner
          </p>
          <p className="text-base font-semibold text-white mb-1">{asset.owner}</p>
          <p className="text-sm text-gray-400">Asset responsibility</p>
        </div>

        {/* Primary Technician */}
        {primaryTech && (
          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
              Assigned Technician
            </p>
            <p className="text-base font-semibold text-white mb-1">{primaryTech.fullName}</p>
            <p className="text-sm text-gray-400 mb-2">{primaryTech.roleTitle}</p>
            {primaryTech.skillTags && primaryTech.skillTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {primaryTech.skillTags.slice(0, 3).map((skill) => (
                  <Badge key={skill} variant="pending" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Escalation Owner */}
        {escalationOwner && (
          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
              Escalation Contact
            </p>
            <p className="text-base font-semibold text-white mb-1">{escalationOwner.name}</p>
            <p className="text-sm text-gray-400 mb-1 capitalize">{escalationOwner.role}</p>
            <p className="text-xs text-gray-400">{escalationOwner.email}</p>
          </div>
        )}

        {/* Preferred Vendor */}
        {preferredVendor && (
          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
              Preferred Vendor
            </p>
            <Link
              href={`/vendors/${preferredVendor.id}`}
              className="text-base font-semibold text-[#F5C518] hover:text-[#F5C518]/80 transition-colors"
            >
              {preferredVendor.name}
            </Link>
            <p className="text-sm text-gray-400 mt-1">{preferredVendor.category}</p>
            <div className="mt-2">
              <p className="text-xs text-gray-400">SLA Compliance</p>
              <p className="text-sm text-white font-medium">{preferredVendor.slaCompliance}%</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
