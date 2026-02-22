import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { Asset, WorkOrder } from '@/data/seed-data';
import { formatDistanceToNow, format, subDays } from 'date-fns';

interface AssetTimelineSectionProps {
  asset: Asset;
  workOrders: WorkOrder[];
}

interface TimelineEvent {
  date: Date;
  type: 'installation' | 'work-order' | 'pm';
  message: string;
  status?: string;
}

export function AssetTimelineSection({ asset, workOrders }: AssetTimelineSectionProps) {
  // Aggregate all events
  const events: TimelineEvent[] = [];

  // Add installation date
  if (asset.installationDate) {
    events.push({
      date: new Date(asset.installationDate),
      type: 'installation',
      message: `Asset installed at current location`,
    });
  }

  // Add completed work orders
  workOrders
    .filter((wo) => wo.completedAt)
    .forEach((wo) => {
      events.push({
        date: new Date(wo.completedAt!),
        type: 'work-order',
        message: `Work order completed: ${wo.title}`,
        status: wo.status,
      });
    });

  // Simulate PM events based on last PM date and frequency
  if (asset.lastPmDate && asset.pmFrequencyDays) {
    const lastPmDate = new Date(asset.lastPmDate);

    for (let i = 0; i < 5; i++) {
      const pmDate = subDays(lastPmDate, i * asset.pmFrequencyDays);

      // Only add if in the past
      if (pmDate < new Date()) {
        events.push({
          date: pmDate,
          type: 'pm',
          message: `Preventive maintenance completed`,
          status: 'completed',
        });
      }
    }
  }

  // Sort events by date (most recent first)
  events.sort((a, b) => b.date.getTime() - a.date.getTime());

  const getEventIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'installation':
        return '🏗️';
      case 'work-order':
        return '🔧';
      case 'pm':
        return '📋';
    }
  };

  const getEventBadge = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'installation':
        return 'Installation';
      case 'work-order':
        return 'Work Order';
      case 'pm':
        return 'PM Service';
    }
  };

  return (
    <Card>
      <h2 className="text-lg font-semibold tracking-tight text-white mb-4">Asset Timeline</h2>

      {events.length > 0 ? (
        <div className="space-y-0">
          {events.map((event, index) => (
            <div
              key={index}
              className={`py-4 ${
                index < events.length - 1 ? 'border-b border-neutral-800' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-neutral-900 border border-neutral-800 rounded-full text-lg">
                  {getEventIcon(event.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant={
                        event.type === 'installation'
                          ? 'open'
                          : event.status === 'completed'
                          ? 'completed'
                          : 'pending'
                      }
                      className="text-xs"
                    >
                      {getEventBadge(event.type)}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      {format(event.date, 'MMM d, yyyy')}
                    </span>
                  </div>
                  <p className="text-sm text-white mb-1">{event.message}</p>
                  <p className="text-xs text-gray-400">
                    {formatDistanceToNow(event.date, { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center">
          <p className="text-gray-400">No timeline events available</p>
        </div>
      )}
    </Card>
  );
}
