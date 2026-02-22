'use client';

import { useEffect } from 'react';
import { addDays, format } from 'date-fns';
import type { Asset } from '@/data/seed-data';
import { CheckCircle, XCircle } from 'lucide-react';

interface AssetMaintenanceStepProps {
  formData: Partial<Asset>;
  errors: Record<string, string>;
  onChange: (field: keyof Asset, value: string | number) => void;
}

const PM_PRESETS = [
  { label: 'Monthly', days: 30 },
  { label: 'Bi-Monthly', days: 60 },
  { label: 'Quarterly', days: 90 },
  { label: 'Semi-Annual', days: 180 },
  { label: 'Annual', days: 365 },
];

export function AssetMaintenanceStep({
  formData,
  errors,
  onChange,
}: AssetMaintenanceStepProps) {
  // Auto-calculate nextPmDate when lastPmDate or pmFrequencyDays change
  useEffect(() => {
    if (formData.lastPmDate && formData.pmFrequencyDays && formData.pmFrequencyDays > 0) {
      const lastPm = new Date(formData.lastPmDate);
      const nextPm = addDays(lastPm, formData.pmFrequencyDays);
      const nextPmString = format(nextPm, 'yyyy-MM-dd');

      // Only update if it's different to avoid infinite loops
      if (formData.nextPmDate !== nextPmString) {
        onChange('nextPmDate', nextPmString);
      }
    }
  }, [formData.lastPmDate, formData.pmFrequencyDays]);

  const handlePresetClick = (days: number) => {
    onChange('pmFrequencyDays', days);
  };

  // Check if warranty is active
  const isWarrantyActive =
    formData.warrantyExpiration && new Date(formData.warrantyExpiration) > new Date();

  return (
    <div className="space-y-6">
      {/* Installation Date */}
      <div>
        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
          Installation Date
        </label>
        <input
          type="date"
          value={formData.installationDate || ''}
          onChange={(e) => onChange('installationDate', e.target.value)}
          className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
        />
      </div>

      {/* Warranty Expiration */}
      <div>
        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
          Warranty Expiration
        </label>
        <input
          type="date"
          value={formData.warrantyExpiration || ''}
          onChange={(e) => onChange('warrantyExpiration', e.target.value)}
          className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
        />
        {errors.warrantyExpiration && (
          <p className="text-xs text-red-400 mt-1">{errors.warrantyExpiration}</p>
        )}
        {formData.warrantyExpiration && (
          <div className="mt-2 flex items-center gap-2">
            {isWarrantyActive ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-xs text-green-500">Warranty Active</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-gray-500" />
                <span className="text-xs text-gray-500">Warranty Expired</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* PM Frequency */}
      <div>
        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
          PM Frequency *
        </label>
        <div className="flex flex-wrap gap-2 mb-3">
          {PM_PRESETS.map((preset) => (
            <button
              key={preset.days}
              type="button"
              onClick={() => handlePresetClick(preset.days)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                formData.pmFrequencyDays === preset.days
                  ? 'bg-[#F5C518] border-[#F5C518] text-black font-medium'
                  : 'bg-neutral-900 border-gray-700/40 text-gray-400 hover:border-gray-600 hover:text-white'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={formData.pmFrequencyDays || ''}
            onChange={(e) => onChange('pmFrequencyDays', parseInt(e.target.value) || 0)}
            placeholder="Custom days"
            min="1"
            className="flex-1 bg-neutral-900 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
          />
          <span className="text-xs text-gray-400">days</span>
        </div>
        {errors.pmFrequencyDays && (
          <p className="text-xs text-red-400 mt-1">{errors.pmFrequencyDays}</p>
        )}
      </div>

      {/* Last PM Date */}
      <div>
        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
          Last PM Date
        </label>
        <input
          type="date"
          value={formData.lastPmDate || ''}
          onChange={(e) => onChange('lastPmDate', e.target.value)}
          className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
        />
      </div>

      {/* Next PM Date - Auto-calculated */}
      <div>
        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
          Next PM Date (Auto-calculated)
        </label>
        <input
          type="date"
          value={formData.nextPmDate || ''}
          readOnly
          className="w-full bg-gray-800/50 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-gray-400 cursor-not-allowed"
        />
        {formData.nextPmDate && (
          <p className="text-xs text-gray-500 mt-1">
            Calculated from last PM date + frequency
          </p>
        )}
      </div>
    </div>
  );
}
