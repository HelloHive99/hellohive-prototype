import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { Asset, Property, Space } from '@/data/seed-data';

interface AssetPartsSectionProps {
  asset: Asset;
  property: Property;
  space: Space;
}

export function AssetPartsSection({ asset, property, space }: AssetPartsSectionProps) {
  // Find related assets in the same space
  const relatedAssets = space.assets.filter((a) => a.id !== asset.id);

  return (
    <Card>
      <h2 className="text-lg font-semibold tracking-tight text-white mb-4">Parts & Dependencies</h2>

      {/* Common Parts */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-white mb-3">Common Replacement Parts</h3>
        {asset.commonParts && asset.commonParts.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {asset.commonParts.map((part) => (
              <Badge key={part} variant="pending">
                {part}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No parts information available</p>
        )}
      </div>

      {/* Dependencies */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-white mb-3">System Dependencies</h3>
        {asset.dependencyNotes ? (
          <p className="text-sm text-gray-300 leading-relaxed">{asset.dependencyNotes}</p>
        ) : (
          <p className="text-sm text-gray-400">No dependency information available</p>
        )}
      </div>

      {/* Related Assets */}
      {relatedAssets.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-white mb-3">
            Related Assets in {space.name}
          </h3>
          <div className="space-y-2">
            {relatedAssets.slice(0, 5).map((relatedAsset) => (
              <div
                key={relatedAsset.id}
                className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{relatedAsset.name}</p>
                    <p className="text-xs text-gray-400">{relatedAsset.type}</p>
                  </div>
                  <Badge
                    variant={
                      relatedAsset.health === 'good'
                        ? 'completed'
                        : relatedAsset.health === 'warning'
                        ? 'pending'
                        : 'overdue'
                    }
                    className="capitalize"
                  >
                    {relatedAsset.health}
                  </Badge>
                </div>
              </div>
            ))}
            {relatedAssets.length > 5 && (
              <p className="text-xs text-gray-400 text-center pt-2">
                +{relatedAssets.length - 5} more assets in this space
              </p>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
