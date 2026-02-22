'use client';

import { useEffect, useMemo } from 'react';
import type { Asset, Property, Space, AssetHealthScore, AssetCriticality, OperationalImpact } from '@/data/seed-data';

interface AssetLocationStepProps {
  formData: Partial<Asset>;
  errors: Record<string, string>;
  onChange: (field: keyof Asset, value: string) => void;
  properties: Property[];
}

// Badge color helpers
const getHealthBadgeColor = (health: AssetHealthScore): string => {
  switch (health) {
    case 'good':
      return 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/30';
    case 'warning':
      return 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/30';
    case 'critical':
      return 'bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/30';
  }
};

const getCriticalityBadgeColor = (criticality: AssetCriticality): string => {
  switch (criticality) {
    case 'critical':
      return 'bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/30';
    case 'important':
      return 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/30';
    case 'non-critical':
      return 'bg-white/20 text-white border-white/30';
  }
};

const getImpactBadgeColor = (impact: OperationalImpact): string => {
  switch (impact) {
    case 'high':
      return 'bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/30';
    case 'medium':
      return 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/30';
    case 'low':
      return 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/30';
  }
};

export function AssetLocationStep({
  formData,
  errors,
  onChange,
  properties,
}: AssetLocationStepProps) {
  // Find current property and spaces
  const currentProperty = useMemo(() => {
    if (!formData.spaceId) return null;
    return properties.find((p) =>
      p.spaces.some((s) => s.id === formData.spaceId)
    );
  }, [formData.spaceId, properties]);

  const currentPropertyId = currentProperty?.id || '';

  const availableSpaces: Space[] = useMemo(() => {
    if (!currentPropertyId) return [];
    const property = properties.find((p) => p.id === currentPropertyId);
    return property?.spaces || [];
  }, [currentPropertyId, properties]);

  // Reset space when property changes
  useEffect(() => {
    if (currentProperty && formData.spaceId) {
      const spaceStillValid = currentProperty.spaces.some(
        (s) => s.id === formData.spaceId
      );
      if (!spaceStillValid) {
        onChange('spaceId', '');
      }
    }
  }, [currentPropertyId]);

  const handlePropertyChange = (propertyId: string) => {
    const property = properties.find((p) => p.id === propertyId);
    if (property && property.spaces.length > 0) {
      onChange('spaceId', property.spaces[0].id);
    } else {
      onChange('spaceId', '');
    }
  };

  return (
    <div className="space-y-6">
      {/* Property Selection */}
      <div>
        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
          Property *
        </label>
        <select
          value={currentPropertyId}
          onChange={(e) => handlePropertyChange(e.target.value)}
          className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
        >
          <option value="">Select property...</option>
          {properties.map((property) => (
            <option key={property.id} value={property.id}>
              {property.name}
            </option>
          ))}
        </select>
        {errors.property && (
          <p className="text-xs text-red-400 mt-1">{errors.property}</p>
        )}
      </div>

      {/* Space Selection */}
      <div>
        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
          Space *
        </label>
        <select
          value={formData.spaceId || ''}
          onChange={(e) => onChange('spaceId', e.target.value)}
          disabled={!currentPropertyId}
          className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">Select space...</option>
          {availableSpaces.map((space) => (
            <option key={space.id} value={space.id}>
              {space.name}
            </option>
          ))}
        </select>
        {errors.spaceId && (
          <p className="text-xs text-red-400 mt-1">{errors.spaceId}</p>
        )}
      </div>

      {/* Health Status */}
      <div>
        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
          Health Status *
        </label>
        <select
          value={formData.health || ''}
          onChange={(e) => onChange('health', e.target.value as AssetHealthScore)}
          className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
        >
          <option value="">Select health status...</option>
          <option value="good">Good</option>
          <option value="warning">Warning</option>
          <option value="critical">Critical</option>
        </select>
        {formData.health && (
          <div className="mt-2">
            <span
              className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getHealthBadgeColor(
                formData.health as AssetHealthScore
              )}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {formData.health.charAt(0).toUpperCase() + formData.health.slice(1)}
            </span>
          </div>
        )}
        {errors.health && (
          <p className="text-xs text-red-400 mt-1">{errors.health}</p>
        )}
      </div>

      {/* Criticality */}
      <div>
        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
          Criticality *
        </label>
        <select
          value={formData.criticality || ''}
          onChange={(e) => onChange('criticality', e.target.value as AssetCriticality)}
          className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
        >
          <option value="">Select criticality...</option>
          <option value="critical">Critical</option>
          <option value="important">Important</option>
          <option value="non-critical">Non-Critical</option>
        </select>
        {formData.criticality && (
          <div className="mt-2">
            <span
              className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getCriticalityBadgeColor(
                formData.criticality as AssetCriticality
              )}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {formData.criticality.charAt(0).toUpperCase() +
                formData.criticality.slice(1).replace('-', ' ')}
            </span>
          </div>
        )}
        {errors.criticality && (
          <p className="text-xs text-red-400 mt-1">{errors.criticality}</p>
        )}
      </div>

      {/* Operational Impact */}
      <div>
        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
          Operational Impact *
        </label>
        <select
          value={formData.operationalImpact || ''}
          onChange={(e) => onChange('operationalImpact', e.target.value as OperationalImpact)}
          className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
        >
          <option value="">Select operational impact...</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        {formData.operationalImpact && (
          <div className="mt-2">
            <span
              className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getImpactBadgeColor(
                formData.operationalImpact as OperationalImpact
              )}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {formData.operationalImpact.charAt(0).toUpperCase() +
                formData.operationalImpact.slice(1)}
            </span>
          </div>
        )}
        {errors.operationalImpact && (
          <p className="text-xs text-red-400 mt-1">{errors.operationalImpact}</p>
        )}
      </div>
    </div>
  );
}
