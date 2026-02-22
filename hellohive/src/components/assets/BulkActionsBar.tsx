'use client';

import { Button } from '@/components/ui/Button';

interface BulkActionsBarProps {
  selectedCount: number;
  onBulkEdit: () => void;
  onBulkRetire: () => void;
  onClearSelection: () => void;
}

export function BulkActionsBar({
  selectedCount,
  onBulkEdit,
  onBulkRetire,
  onClearSelection,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 bg-neutral-900 border-t border-neutral-800 transform transition-transform duration-300 ease-out"
      style={{
        transform: selectedCount > 0 ? 'translateY(0)' : 'translateY(100%)',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Selection Count */}
          <div className="flex items-center gap-3">
            <span className="text-white font-medium">
              {selectedCount} {selectedCount === 1 ? 'asset' : 'assets'} selected
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={onBulkEdit}>
              Bulk Edit
            </Button>
            <Button
              variant="secondary"
              onClick={onBulkRetire}
              className="border-amber-600/40 text-amber-400 hover:bg-amber-600/10"
            >
              Bulk Retire
            </Button>
            <Button variant="ghost" onClick={onClearSelection}>
              Clear Selection
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
