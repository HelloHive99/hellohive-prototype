'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useUser } from '@/context/UserContext';
import type {
  AssetHealthScore,
  AssetCriticality,
  OperationalImpact,
} from '@/data/seed-data';

interface BulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAssetIds: string[];
}

interface FieldSelection {
  health: boolean;
  criticality: boolean;
  operationalImpact: boolean;
  primaryTechnicianId: boolean;
  preferredVendorId: boolean;
  pmFrequencyDays: boolean;
}

export function BulkEditModal({
  isOpen,
  onClose,
  selectedAssetIds,
}: BulkEditModalProps) {
  const { getAllAssets, bulkUpdateAssets, getAllVendors, getTechnicianById } = useUser();

  // Field selection checkboxes
  const [selectedFields, setSelectedFields] = useState<FieldSelection>({
    health: false,
    criticality: false,
    operationalImpact: false,
    primaryTechnicianId: false,
    preferredVendorId: false,
    pmFrequencyDays: false,
  });

  // Field values
  const [health, setHealth] = useState<AssetHealthScore>('good');
  const [criticality, setCriticality] = useState<AssetCriticality>('non-critical');
  const [operationalImpact, setOperationalImpact] = useState<OperationalImpact>('low');
  const [primaryTechnicianId, setPrimaryTechnicianId] = useState('');
  const [preferredVendorId, setPreferredVendorId] = useState('');
  const [pmFrequencyDays, setPmFrequencyDays] = useState(90);

  const selectedAssets = getAllAssets().filter((a) =>
    selectedAssetIds.includes(a.id)
  );
  const vendors = getAllVendors();

  const toggleField = (field: keyof FieldSelection) => {
    setSelectedFields((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = () => {
    const updates: any = {};

    if (selectedFields.health) updates.health = health;
    if (selectedFields.criticality) updates.criticality = criticality;
    if (selectedFields.operationalImpact) updates.operationalImpact = operationalImpact;
    if (selectedFields.primaryTechnicianId) updates.primaryTechnicianId = primaryTechnicianId || undefined;
    if (selectedFields.preferredVendorId) updates.preferredVendorId = preferredVendorId || undefined;
    if (selectedFields.pmFrequencyDays) updates.pmFrequencyDays = pmFrequencyDays;

    // Apply bulk update
    bulkUpdateAssets(selectedAssetIds, updates);
    onClose();
  };

  const resetForm = () => {
    setSelectedFields({
      health: false,
      criticality: false,
      operationalImpact: false,
      primaryTechnicianId: false,
      preferredVendorId: false,
      pmFrequencyDays: false,
    });
    setHealth('good');
    setCriticality('non-critical');
    setOperationalImpact('low');
    setPrimaryTechnicianId('');
    setPreferredVendorId('');
    setPmFrequencyDays(90);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60" onClick={handleClose} />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <Card className="p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-white">
                Bulk Edit Assets
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Select fields to update for {selectedAssets.length} assets
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Preview */}
          <div className="mb-6 p-4 bg-neutral-900 border border-gray-700/40 rounded-lg">
            <p className="text-sm text-gray-300">
              Will update <span className="font-semibold text-[#F5C518]">{selectedAssets.length}</span> assets
            </p>
          </div>

          {/* Field Selection */}
          <div className="space-y-4">
            {/* Health */}
            <div>
              <label className="flex items-center gap-3 mb-2">
                <input
                  type="checkbox"
                  checked={selectedFields.health}
                  onChange={() => toggleField('health')}
                  className="w-4 h-4 bg-neutral-900 border-gray-700/40 rounded focus:ring-2 focus:ring-[#F5C518]"
                />
                <span className="text-sm font-medium text-gray-300">Health Score</span>
              </label>
              {selectedFields.health && (
                <select
                  value={health}
                  onChange={(e) => setHealth(e.target.value as AssetHealthScore)}
                  className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
                >
                  <option value="good">Good</option>
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                </select>
              )}
            </div>

            {/* Criticality */}
            <div>
              <label className="flex items-center gap-3 mb-2">
                <input
                  type="checkbox"
                  checked={selectedFields.criticality}
                  onChange={() => toggleField('criticality')}
                  className="w-4 h-4 bg-neutral-900 border-gray-700/40 rounded focus:ring-2 focus:ring-[#F5C518]"
                />
                <span className="text-sm font-medium text-gray-300">Criticality</span>
              </label>
              {selectedFields.criticality && (
                <select
                  value={criticality}
                  onChange={(e) => setCriticality(e.target.value as AssetCriticality)}
                  className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
                >
                  <option value="non-critical">Non-Critical</option>
                  <option value="important">Important</option>
                  <option value="critical">Critical</option>
                </select>
              )}
            </div>

            {/* Operational Impact */}
            <div>
              <label className="flex items-center gap-3 mb-2">
                <input
                  type="checkbox"
                  checked={selectedFields.operationalImpact}
                  onChange={() => toggleField('operationalImpact')}
                  className="w-4 h-4 bg-neutral-900 border-gray-700/40 rounded focus:ring-2 focus:ring-[#F5C518]"
                />
                <span className="text-sm font-medium text-gray-300">Operational Impact</span>
              </label>
              {selectedFields.operationalImpact && (
                <select
                  value={operationalImpact}
                  onChange={(e) => setOperationalImpact(e.target.value as OperationalImpact)}
                  className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              )}
            </div>

            {/* Primary Technician */}
            <div>
              <label className="flex items-center gap-3 mb-2">
                <input
                  type="checkbox"
                  checked={selectedFields.primaryTechnicianId}
                  onChange={() => toggleField('primaryTechnicianId')}
                  className="w-4 h-4 bg-neutral-900 border-gray-700/40 rounded focus:ring-2 focus:ring-[#F5C518]"
                />
                <span className="text-sm font-medium text-gray-300">Primary Technician</span>
              </label>
              {selectedFields.primaryTechnicianId && (
                <input
                  type="text"
                  value={primaryTechnicianId}
                  onChange={(e) => setPrimaryTechnicianId(e.target.value)}
                  placeholder="Enter technician ID (optional)"
                  className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
                />
              )}
            </div>

            {/* Preferred Vendor */}
            <div>
              <label className="flex items-center gap-3 mb-2">
                <input
                  type="checkbox"
                  checked={selectedFields.preferredVendorId}
                  onChange={() => toggleField('preferredVendorId')}
                  className="w-4 h-4 bg-neutral-900 border-gray-700/40 rounded focus:ring-2 focus:ring-[#F5C518]"
                />
                <span className="text-sm font-medium text-gray-300">Preferred Vendor</span>
              </label>
              {selectedFields.preferredVendorId && (
                <select
                  value={preferredVendorId}
                  onChange={(e) => setPreferredVendorId(e.target.value)}
                  className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
                >
                  <option value="">None</option>
                  {vendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* PM Frequency */}
            <div>
              <label className="flex items-center gap-3 mb-2">
                <input
                  type="checkbox"
                  checked={selectedFields.pmFrequencyDays}
                  onChange={() => toggleField('pmFrequencyDays')}
                  className="w-4 h-4 bg-neutral-900 border-gray-700/40 rounded focus:ring-2 focus:ring-[#F5C518]"
                />
                <span className="text-sm font-medium text-gray-300">PM Frequency (Days)</span>
              </label>
              {selectedFields.pmFrequencyDays && (
                <input
                  type="number"
                  value={pmFrequencyDays}
                  onChange={(e) => setPmFrequencyDays(parseInt(e.target.value, 10))}
                  min={1}
                  className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
                />
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-8">
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!Object.values(selectedFields).some((v) => v)}
            >
              Apply Changes
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
