'use client';

import { X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface ResetDemoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ResetDemoDialog({ isOpen, onClose, onConfirm }: ResetDemoDialogProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />

      {/* Dialog Card */}
      <div className="relative z-10 w-full max-w-md">
        <Card className="p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-white">
                Reset Demo Data
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                This action cannot be undone
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Message */}
          <div className="mb-6">
            <p className="text-sm text-white leading-relaxed">
              Reset all demo data to defaults? This will remove any work orders created during this session and restore the original seed data.
            </p>
            <p className="text-sm text-gray-400 mt-3">
              All metrics, work orders, and activity feed entries will be restored to their initial state.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-sm font-medium transition-colors px-4 py-2"
            >
              Cancel
            </button>
            <Button onClick={handleConfirm}>
              Reset
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
