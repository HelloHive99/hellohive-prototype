import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { Asset, AssetHealthScore, AssetCriticality, OperationalImpact } from '@/data/seed-data';
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';

interface AssetRiskHealthPanelProps {
  asset: Asset;
}

export function AssetRiskHealthPanel({ asset }: AssetRiskHealthPanelProps) {
  const healthBadgeVariant = (health: AssetHealthScore) => {
    switch (health) {
      case 'good': return 'completed';
      case 'warning': return 'pending';
      case 'critical': return 'overdue';
    }
  };

  const criticalityBadgeVariant = (criticality: AssetCriticality) => {
    switch (criticality) {
      case 'critical': return 'overdue';
      case 'important': return 'in-progress';
      case 'non-critical': return 'open';
    }
  };

  const impactBadgeVariant = (impact: OperationalImpact) => {
    switch (impact) {
      case 'high': return 'overdue';
      case 'medium': return 'pending';
      case 'low': return 'completed';
    }
  };

  const getTrendIcon = () => {
    switch (asset.trendDirection) {
      case 'improving':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'degrading':
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      default:
        return <Minus className="w-5 h-5 text-gray-400" />;
    }
  };

  const getTrendColor = () => {
    switch (asset.trendDirection) {
      case 'improving': return 'text-green-500';
      case 'degrading': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };

  return (
    <Card>
      <h2 className="text-lg font-semibold tracking-tight text-white mb-4">Risk & Health Assessment</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Health Score */}
        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
            Health Status
          </p>
          <Badge variant={healthBadgeVariant(asset.health)} className="capitalize">
            {asset.health}
          </Badge>
          <p className="text-xs text-gray-400 mt-2">Current condition</p>
        </div>

        {/* Criticality */}
        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
            Criticality Level
          </p>
          <Badge variant={criticalityBadgeVariant(asset.criticality)} className="capitalize">
            {asset.criticality}
          </Badge>
          <p className="text-xs text-gray-400 mt-2">System importance</p>
        </div>

        {/* Operational Impact */}
        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
            Operational Impact
          </p>
          <Badge variant={impactBadgeVariant(asset.operationalImpact)} className="capitalize">
            {asset.operationalImpact}
          </Badge>
          <p className="text-xs text-gray-400 mt-2">Failure consequence</p>
        </div>

        {/* Trend Direction */}
        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
            Performance Trend
          </p>
          <div className="flex items-center gap-2 mt-1">
            {getTrendIcon()}
            <span className={`text-base font-semibold capitalize ${getTrendColor()}`}>
              {asset.trendDirection || 'stable'}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-2">Reliability direction</p>
        </div>

        {/* Failure Frequency */}
        {asset.failureFrequency !== undefined && (
          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
              Failure Frequency
            </p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-semibold tracking-tight text-white">
                {asset.failureFrequency}
              </p>
              <AlertTriangle className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-xs text-gray-400 mt-1">Failures per year</p>
          </div>
        )}

        {/* PM Completion Rate */}
        {asset.pmCompletionRate !== undefined && (
          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
              PM Completion Rate
            </p>
            <p className="text-2xl font-semibold tracking-tight text-white">
              {asset.pmCompletionRate}%
            </p>
            <p className="text-xs text-gray-400 mt-1">Maintenance compliance</p>
          </div>
        )}
      </div>
    </Card>
  );
}
