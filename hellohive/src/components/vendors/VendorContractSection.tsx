import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { Vendor } from '@/data/seed-data';

interface VendorContractSectionProps {
  vendor: Vendor;
}

export function VendorContractSection({ vendor }: VendorContractSectionProps) {
  // Format dates for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Determine badge variant for compliance items
  const getComplianceBadge = (status: string) => {
    if (status === 'Current') return 'completed';
    if (status === 'Expiring Soon') return 'pending';
    return 'overdue'; // Expired
  };

  return (
    <Card className="animate-fadeIn">
      <h2 className="text-lg font-semibold tracking-tight text-white mb-4">
        Contract & Compliance
      </h2>

      <div className="space-y-6">
        {/* Contract Details */}
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
            Contract Details
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-900 border border-neutral-800 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Contract Type</p>
              <p className="text-sm font-medium text-white">
                {vendor.contract.type}
              </p>
            </div>
            <div className="p-4 bg-gray-900 border border-neutral-800 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Start Date</p>
              <p className="text-sm font-medium text-white">
                {formatDate(vendor.contract.startDate)}
              </p>
            </div>
            <div className="p-4 bg-gray-900 border border-neutral-800 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">End Date</p>
              <p className="text-sm font-medium text-white">
                {formatDate(vendor.contract.endDate)}
              </p>
            </div>
            <div className="p-4 bg-gray-900 border border-neutral-800 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Rate Card</p>
              <p className="text-sm font-medium text-white">
                {vendor.contract.rateCard}
              </p>
            </div>
          </div>
        </div>

        {/* Compliance Status */}
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
            Compliance Status
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-900 border border-neutral-800 rounded-lg">
              <p className="text-xs text-gray-400 mb-2">Insurance Certificate</p>
              <Badge variant={getComplianceBadge(vendor.compliance.insuranceCert)}>
                {vendor.compliance.insuranceCert}
              </Badge>
            </div>
            <div className="p-4 bg-gray-900 border border-neutral-800 rounded-lg">
              <p className="text-xs text-gray-400 mb-2">Background Checks</p>
              <Badge variant={getComplianceBadge(vendor.compliance.backgroundChecks)}>
                {vendor.compliance.backgroundChecks}
              </Badge>
            </div>
            <div className="p-4 bg-gray-900 border border-neutral-800 rounded-lg">
              <p className="text-xs text-gray-400 mb-2">Safety Training</p>
              <Badge variant={getComplianceBadge(vendor.compliance.safetyTraining)}>
                {vendor.compliance.safetyTraining}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
