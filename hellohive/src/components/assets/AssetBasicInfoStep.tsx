'use client';

import { useEffect, useState } from 'react';
import type { Asset } from '@/data/seed-data';
import { useUser } from '@/context/UserContext';
import { checkSerialNumberDuplicate } from '@/lib/asset-validation';
import { AlertTriangle } from 'lucide-react';

interface AssetBasicInfoStepProps {
  formData: Partial<Asset>;
  errors: Record<string, string>;
  onChange: (field: keyof Asset, value: string) => void;
}

const COMMON_ASSET_TYPES = [
  'HVAC Unit',
  'Boiler',
  'Chiller',
  'Air Handler',
  'Scoreboard',
  'LED Display',
  'Generator',
  'Elevator',
  'Escalator',
  'Fire Panel',
  'Security Camera',
  'Access Control Panel',
  'Lighting Control System',
  'BMS Controller',
  'Water Heater',
  'Pump',
  'Other',
];

export function AssetBasicInfoStep({
  formData,
  errors,
  onChange,
}: AssetBasicInfoStepProps) {
  const { getAllAssets } = useUser();
  const [duplicateAsset, setDuplicateAsset] = useState<Asset | null>(null);

  // Check for duplicate serial numbers
  useEffect(() => {
    if (formData.serialNumber && formData.serialNumber.trim()) {
      const allAssets = getAllAssets();
      const duplicate = checkSerialNumberDuplicate(
        formData.serialNumber,
        allAssets,
        formData.id
      );
      setDuplicateAsset(duplicate);
    } else {
      setDuplicateAsset(null);
    }
  }, [formData.serialNumber, formData.id, getAllAssets]);

  return (
    <div className="space-y-6">
      {/* Asset Name */}
      <div>
        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
          Asset Name *
        </label>
        <input
          type="text"
          value={formData.name || ''}
          onChange={(e) => onChange('name', e.target.value)}
          placeholder="e.g., Main HVAC Unit 3"
          className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
        />
        {errors.name && (
          <p className="text-xs text-red-400 mt-1">{errors.name}</p>
        )}
      </div>

      {/* Asset Type */}
      <div>
        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
          Asset Type *
        </label>
        <select
          value={formData.type || ''}
          onChange={(e) => onChange('type', e.target.value)}
          className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
        >
          <option value="">Select type...</option>
          {COMMON_ASSET_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        {errors.type && (
          <p className="text-xs text-red-400 mt-1">{errors.type}</p>
        )}
      </div>

      {/* Model & Manufacturer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
            Model
          </label>
          <input
            type="text"
            value={formData.model || ''}
            onChange={(e) => onChange('model', e.target.value)}
            placeholder="e.g., RTU-5000X"
            className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
            Manufacturer
          </label>
          <input
            type="text"
            value={formData.manufacturer || ''}
            onChange={(e) => onChange('manufacturer', e.target.value)}
            placeholder="e.g., Carrier, Trane, Daikin"
            className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
          />
        </div>
      </div>

      {/* Serial Number */}
      <div>
        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
          Serial Number
        </label>
        <input
          type="text"
          value={formData.serialNumber || ''}
          onChange={(e) => onChange('serialNumber', e.target.value)}
          placeholder="e.g., SN-12345-ABCD"
          className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
        />
        {errors.serialNumber && (
          <p className="text-xs text-red-400 mt-1">{errors.serialNumber}</p>
        )}
        {duplicateAsset && (
          <div className="flex items-start gap-2 mt-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-yellow-500">
              <p className="font-medium">Duplicate serial number detected</p>
              <p className="mt-1 text-yellow-500/80">
                This serial number is already assigned to{' '}
                <span className="font-medium">{duplicateAsset.name}</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
