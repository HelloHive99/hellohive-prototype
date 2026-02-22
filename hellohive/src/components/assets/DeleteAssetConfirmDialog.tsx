'use client';

import { useState } from 'react';
import { X, Trash2, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { Asset } from '@/data/seed-data';

interface DeleteAssetConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  asset: Asset | null;
  onConfirm: () => void;
}

export function DeleteAssetConfirmDialog({
  isOpen,
  onClose,
  asset,
  onConfirm,
}: DeleteAssetConfirmDialogProps) {
  const [confirmName, setConfirmName] = useState('');

  const handleConfirm = () => {
    if (confirmName === asset?.name) {
      onConfirm();
      setConfirmName('');
      onClose();
    }
  };

  const handleClose = () => {
    setConfirmName('');
    onClose();
  };

  if (!isOpen || !asset) return null;

  const isConfirmValid = confirmName === asset.name;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60" onClick={handleClose} />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-md">
        <Card className="p-6 border-red-600/30">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-600/20 rounded-lg flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <h2 className="text-xl font-semibold tracking-tight text-white">
                Delete Asset
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Warning Message */}
          <div className="mb-4 p-4 bg-red-600/10 border border-red-600/30 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-300 mb-1">
                  THIS ACTION CANNOT BE UNDONE
                </p>
                <p className="text-xs text-red-300/80">
                  This will permanently delete the asset and all associated data. Historical records will be lost.
                </p>
              </div>
            </div>
          </div>

          {/* Asset Info */}
          <div className="mb-4 p-4 bg-neutral-900 border border-gray-700/40 rounded-lg">
            <p className="text-sm font-medium text-white">{asset.name}</p>
            <p className="text-xs text-gray-400 mt-1">Type: {asset.type}</p>
            {asset.serialNumber && (
              <p className="text-xs text-gray-400 mt-0.5">
                Serial: {asset.serialNumber}
              </p>
            )}
          </div>

          {/* Confirmation Input */}
          <div className="mb-6">
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Type <span className="text-red-400 font-semibold">{asset.name}</span> to confirm
            </label>
            <input
              type="text"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder="Enter asset name"
              className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!isConfirmValid}
              className="bg-red-600 hover:bg-red-600/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Delete Permanently
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
