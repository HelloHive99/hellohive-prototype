import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { Asset } from '@/data/seed-data';
import { formatDistanceToNow, format, subDays } from 'date-fns';

interface AssetPreventiveMaintenanceSectionProps {
  asset: Asset;
}

export function AssetPreventiveMaintenanceSection({ asset }: AssetPreventiveMaintenanceSectionProps) {
  const isOverdue = asset.nextPmDate && new Date(asset.nextPmDate) < new Date();
  const pmCompletionRate = asset.pmCompletionRate ?? 0;

  // Simulate PM history based on PM frequency
  const generatePmHistory = () => {
    if (!asset.lastPmDate) return [];

    const history = [];
    const lastPmDate = new Date(asset.lastPmDate);

    for (let i = 0; i < 5; i++) {
      const pmDate = subDays(lastPmDate, i * asset.pmFrequencyDays);
      const wasCompleted = Math.random() > 0.15; // 85% completion rate simulation

      history.push({
        date: pmDate,
        completed: wasCompleted,
      });
    }

    return history.reverse();
  };

  const pmHistory = generatePmHistory();

  return (
    <Card>
      <h2 className="text-lg font-semibold tracking-tight text-white mb-4">Preventive Maintenance Schedule</h2>

      {/* PM Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
            PM Frequency
          </p>
          <p className="text-2xl font-semibold tracking-tight text-white">
            {asset.pmFrequencyDays}
          </p>
          <p className="text-xs text-gray-400 mt-1">Days between service</p>
        </div>

        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
            Last PM
          </p>
          {asset.lastPmDate ? (
            <>
              <p className="text-base font-semibold text-white">
                {format(new Date(asset.lastPmDate), 'MMM d, yyyy')}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {formatDistanceToNow(new Date(asset.lastPmDate), { addSuffix: true })}
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-400">Not recorded</p>
          )}
        </div>

        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
            Next PM
          </p>
          {asset.nextPmDate ? (
            <>
              {isOverdue ? (
                <>
                  <Badge variant="overdue">Overdue</Badge>
                  <p className="text-xs text-gray-400 mt-2">
                    Due {format(new Date(asset.nextPmDate), 'MMM d, yyyy')}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-base font-semibold text-white">
                    {format(new Date(asset.nextPmDate), 'MMM d, yyyy')}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDistanceToNow(new Date(asset.nextPmDate), { addSuffix: true })}
                  </p>
                </>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-400">Not scheduled</p>
          )}
        </div>

        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
            Completion Rate
          </p>
          <p className="text-2xl font-semibold tracking-tight text-white">
            {pmCompletionRate}%
          </p>
          <p className="text-xs text-gray-400 mt-1">On-time compliance</p>
        </div>
      </div>

      {/* PM History */}
      {pmHistory.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-white mb-3">Recent PM History</h3>
          <div className="space-y-2">
            {pmHistory.map((event, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-neutral-900 border border-neutral-800 rounded-lg"
              >
                <div>
                  <p className="text-sm text-white font-medium">
                    {format(event.date, 'MMM d, yyyy')}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatDistanceToNow(event.date, { addSuffix: true })}
                  </p>
                </div>
                <Badge variant={event.completed ? 'completed' : 'overdue'}>
                  {event.completed ? 'Completed' : 'Missed'}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
