'use client';

import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { Asset } from '@/data/seed-data';

interface RetireAssetConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  asset?: Asset | null;
  selectedCount?: number; // For bulk retire
  onConfirm: (reason?: string) => void;
}

export function RetireAssetConfirmDialog({
  isOpen,
  onClose,
  asset,
  selectedCount,
  onConfirm,
}: RetireAssetConfirmDialogProps) {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    onConfirm(reason.trim() || undefined);
    setReason('');
    onClose();
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  if (!isOpen) return null;

  const isBulk = !asset && (selectedCount ?? 0) > 0;
  const criticalityVariant = asset?.criticality === 'critical'
    ? 'overdue'
    : asset?.criticality === 'important'
    ? 'in-progress'
    : 'completed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60" onClick={handleClose} />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-md">
        <Card className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-600/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <h2 className="text-xl font-semibold tracking-tight text-white">
                Retire Asset
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Asset Info */}
          <div className="mb-4 p-4 bg-neutral-900 border border-gray-700/40 rounded-lg">
            {isBulk ? (
              <p className="text-sm font-medium text-white">
                {selectedCount} asset{selectedCount !== 1 ? 's' : ''} selected
              </p>
            ) : asset ? (
              <>
                <p className="text-sm font-medium text-white mb-2">{asset.name}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Criticality:</span>
                  <Badge variant={criticalityVariant}>
                    {asset.criticality}
                  </Badge>
                </div>
              </>
            ) : null}
          </div>

          {/* Explanation */}
          <div className="mb-4 p-3 bg-amber-600/10 border border-amber-600/30 rounded-lg">
            <p className="text-xs text-amber-300">
              Asset will be hidden but preserved for historical records. This is a soft delete and can be reversed by administrators.
            </p>
          </div>

          {/* Reason (Optional) */}
          <div className="mb-6">
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Reason (Optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this asset being retired?"
              rows={3}
              className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              className="bg-amber-600 hover:bg-amber-600/90 text-white"
            >
              Retire Asset
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
