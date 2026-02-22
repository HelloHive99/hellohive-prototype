import { Card } from '@/components/ui/Card';
import type { Asset } from '@/data/seed-data';

interface AssetCostReliabilitySectionProps {
  asset: Asset;
}

export function AssetCostReliabilitySection({ asset }: AssetCostReliabilitySectionProps) {
  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculateMTBF = () => {
    if (!asset.failureFrequency || asset.failureFrequency === 0) {
      return 'N/A';
    }
    const mtbf = 365 / asset.failureFrequency;
    return `${Math.round(mtbf)} days`;
  };

  return (
    <Card>
      <h2 className="text-lg font-semibold tracking-tight text-white mb-4">Cost & Reliability</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* YTD Cost */}
        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
            YTD Maintenance Cost
          </p>
          <p className="text-2xl font-semibold tracking-tight text-white">
            {formatCurrency(asset.maintenanceCostYTD)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Year to date spend</p>
        </div>

        {/* Last Repair Cost */}
        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
            Last Repair Cost
          </p>
          <p className="text-2xl font-semibold tracking-tight text-white">
            {formatCurrency(asset.lastRepairCost)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Most recent service</p>
        </div>

        {/* Failure Frequency */}
        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
            Failure Frequency
          </p>
          <p className="text-2xl font-semibold tracking-tight text-white">
            {asset.failureFrequency !== undefined ? asset.failureFrequency : 'N/A'}
          </p>
          <p className="text-xs text-gray-400 mt-1">Failures per year</p>
        </div>

        {/* MTBF */}
        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
            MTBF
          </p>
          <p className="text-2xl font-semibold tracking-tight text-white">
            {calculateMTBF()}
          </p>
          <p className="text-xs text-gray-400 mt-1">Mean time between failures</p>
        </div>
      </div>
    </Card>
  );
}
