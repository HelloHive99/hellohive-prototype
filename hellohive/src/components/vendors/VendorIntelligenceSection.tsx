import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { Vendor } from '@/data/seed-data';
import { properties } from '@/data/seed-data';

interface VendorIntelligenceSectionProps {
  vendor: Vendor;
}

export function VendorIntelligenceSection({ vendor }: VendorIntelligenceSectionProps) {
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get property names from IDs
  const getPrimaryPropertyNames = () => {
    return vendor.intelligence.primaryPropertiesServiced
      .map((propId) => {
        const property = properties.find((p) => p.id === propId);
        return property ? property.name : propId;
      })
      .slice(0, 3); // Limit to top 3
  };

  const primaryPropertyNames = getPrimaryPropertyNames();

  return (
    <Card className="animate-fadeIn">
      <h2 className="text-lg font-semibold tracking-tight text-white mb-4">
        Vendor Intelligence
      </h2>

      <div className="space-y-6">
        {/* Financial & Volume Metrics */}
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
            Financial & Volume
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-900 border border-neutral-800 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Total Jobs (All-Time)</p>
              <p className="text-xl font-semibold text-white">
                {vendor.intelligence.totalJobsAllTime.toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-gray-900 border border-neutral-800 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Avg Monthly Jobs</p>
              <p className="text-xl font-semibold text-white">
                {vendor.intelligence.avgMonthlyJobs}
              </p>
            </div>
            <div className="p-4 bg-gray-900 border border-neutral-800 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Avg Cost Per Job</p>
              <p className="text-xl font-semibold text-white">
                {formatCurrency(vendor.intelligence.avgCostPerJob)}
              </p>
            </div>
            <div className="p-4 bg-gray-900 border border-neutral-800 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Total Spend YTD</p>
              <p className="text-xl font-semibold text-white">
                {formatCurrency(vendor.intelligence.totalSpendYtd)}
              </p>
            </div>
          </div>
        </div>

        {/* Common Issue Types */}
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
            Common Issue Types
          </p>
          <div className="flex flex-wrap gap-2">
            {vendor.intelligence.commonIssueTypes.map((issueType) => (
              <Badge key={issueType} variant="pending">
                {issueType}
              </Badge>
            ))}
          </div>
        </div>

        {/* Primary Properties Serviced */}
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
            Primary Properties Serviced
          </p>
          <div className="flex flex-wrap gap-2">
            {primaryPropertyNames.map((propertyName) => (
              <Badge key={propertyName} variant="in-progress">
                {propertyName}
              </Badge>
            ))}
            {vendor.intelligence.primaryPropertiesServiced.length > 3 && (
              <Badge variant="in-progress">
                +{vendor.intelligence.primaryPropertiesServiced.length - 3} more
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
