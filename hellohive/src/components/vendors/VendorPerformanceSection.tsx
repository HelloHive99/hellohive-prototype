import { Card } from '@/components/ui/Card';
import type { Vendor } from '@/data/seed-data';

interface VendorPerformanceSectionProps {
  vendor: Vendor;
}

export function VendorPerformanceSection({ vendor }: VendorPerformanceSectionProps) {
  const metrics = [
    {
      label: 'SLA Compliance',
      value: `${vendor.slaCompliance.toFixed(1)}%`,
      description: '90-day average',
    },
    {
      label: 'Avg Response Time',
      value: `${vendor.avgResponseTime.toFixed(1)} hrs`,
      description: 'Time to acknowledge',
    },
    {
      label: 'Avg Resolution Time',
      value: `${vendor.performance.avgResolutionTime.toFixed(1)} hrs`,
      description: 'Time to complete',
    },
    {
      label: 'First-Time Fix Rate',
      value: `${vendor.performance.firstTimeFixRate}%`,
      description: 'Resolved on first visit',
    },
    {
      label: 'Missed SLAs',
      value: vendor.performance.missedSlas.toString(),
      description: 'Last 90 days',
    },
    {
      label: 'Jobs Completed',
      value: vendor.performance.jobsCompleted.toString(),
      description: 'Last 90 days',
    },
    {
      label: 'Escalations',
      value: vendor.performance.escalations.toString(),
      description: 'Last 90 days',
    },
    {
      label: 'Internal Rating',
      value: `${vendor.performance.internalRating.toFixed(1)} ⭐`,
      description: 'Overall quality score',
    },
  ];

  return (
    <Card className="animate-fadeIn">
      <h2 className="text-lg font-semibold tracking-tight text-white mb-4">
        Performance Metrics
        <span className="text-xs font-normal text-gray-400 ml-2">
          (90-day window)
        </span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="p-4 bg-gray-900 border border-neutral-800 rounded-lg"
          >
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
              {metric.label}
            </p>
            <p className="text-2xl font-semibold tracking-tight text-white mb-1">
              {metric.value}
            </p>
            <p className="text-xs text-gray-400">{metric.description}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
