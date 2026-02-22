'use client';

import { X } from 'lucide-react';

interface DateRangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  fromDate: string;
  toDate: string;
  onFromChange: (date: string) => void;
  onToChange: (date: string) => void;
  onApply: () => void;
  onClear: () => void;
}

export function DateRangeModal({
  isOpen,
  onClose,
  title,
  fromDate,
  toDate,
  onFromChange,
  onToChange,
  onApply,
  onClear,
}: DateRangeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-neutral-800 border border-gray-700 rounded-lg p-6 w-full max-w-md mx-4 z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Date Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
              From
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => onFromChange(e.target.value)}
              className="w-full bg-neutral-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
              To
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => onToChange(e.target.value)}
              className="w-full bg-neutral-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={onClear}
            className="flex-1 px-4 py-2 border border-gray-700 rounded-lg text-sm font-medium text-white hover:bg-gray-700 transition-colors"
          >
            Clear
          </button>
          <button
            onClick={onApply}
            className="flex-1 px-4 py-2 bg-[#F5C518] rounded-lg text-sm font-medium text-black hover:bg-[#F5C518]/90 transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
