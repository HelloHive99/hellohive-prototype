'use client';

import type { Asset, Technician, Vendor, User } from '@/data/seed-data';
import { Lightbulb } from 'lucide-react';

interface AssetOwnershipStepProps {
  formData: Partial<Asset>;
  errors: Record<string, string>;
  onChange: (field: keyof Asset, value: string) => void;
  technicians: Technician[];
  vendors: Vendor[];
  users: User[];
}

export function AssetOwnershipStep({
  formData,
  errors,
  onChange,
  technicians,
  vendors,
  users,
}: AssetOwnershipStepProps) {
  // Find selected entities for detail display
  const selectedTechnician = technicians.find(
    (t) => t.id === formData.primaryTechnicianId
  );
  const selectedVendor = vendors.find((v) => v.id === formData.preferredVendorId);
  const selectedEscalationOwner = users.find(
    (u) => u.id === formData.escalationOwnerId
  );

  const showRecommendationMessage =
    formData.criticality === 'critical' &&
    (!formData.primaryTechnicianId ||
      !formData.escalationOwnerId ||
      !formData.preferredVendorId);

  return (
    <div className="space-y-6">
      {/* Owner */}
      <div>
        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
          Asset Owner *
        </label>
        <input
          type="text"
          value={formData.owner || ''}
          onChange={(e) => onChange('owner', e.target.value)}
          placeholder="e.g., Facilities Team, Operations Manager"
          className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
        />
        {errors.owner && (
          <p className="text-xs text-red-400 mt-1">{errors.owner}</p>
        )}
      </div>

      {/* Recommendation Message for Critical Assets */}
      {showRecommendationMessage && (
        <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <Lightbulb className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-blue-400">
            <p className="font-medium">Recommended for critical assets</p>
            <p className="mt-1 text-blue-400/80">
              Assign a primary technician, escalation owner, and preferred vendor for
              faster response times
            </p>
          </div>
        </div>
      )}

      {/* Primary Technician */}
      <div>
        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
          Primary Technician
        </label>
        <select
          value={formData.primaryTechnicianId || ''}
          onChange={(e) => onChange('primaryTechnicianId', e.target.value)}
          className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
        >
          <option value="">None assigned</option>
          {technicians.map((tech) => (
            <option key={tech.id} value={tech.id}>
              {tech.fullName} - {tech.roleTitle}
            </option>
          ))}
        </select>
        {selectedTechnician && (
          <div className="mt-2 p-2 bg-gray-800/50 rounded border border-gray-700/40">
            <p className="text-xs text-gray-400">
              <span className="font-medium text-white">
                {selectedTechnician.fullName}
              </span>
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {selectedTechnician.phone}
            </p>
            {selectedTechnician.skillTags.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Skills: {selectedTechnician.skillTags.slice(0, 3).join(', ')}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Escalation Owner */}
      <div>
        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
          Escalation Owner
        </label>
        <select
          value={formData.escalationOwnerId || ''}
          onChange={(e) => onChange('escalationOwnerId', e.target.value)}
          className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
        >
          <option value="">None assigned</option>
          {users
            .filter((u) => u.role === 'Team-Admin' || u.role === 'Team-OpsCoordinator')
            .map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.role})
              </option>
            ))}
        </select>
        {selectedEscalationOwner && (
          <div className="mt-2 p-2 bg-gray-800/50 rounded border border-gray-700/40">
            <p className="text-xs text-gray-400">
              <span className="font-medium text-white">
                {selectedEscalationOwner.name}
              </span>
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {selectedEscalationOwner.email}
            </p>
          </div>
        )}
      </div>

      {/* Preferred Vendor */}
      <div>
        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
          Preferred Vendor
        </label>
        <select
          value={formData.preferredVendorId || ''}
          onChange={(e) => onChange('preferredVendorId', e.target.value)}
          className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
        >
          <option value="">None assigned</option>
          {vendors.map((vendor) => (
            <option key={vendor.id} value={vendor.id}>
              {vendor.name} - {vendor.category}
            </option>
          ))}
        </select>
        {selectedVendor && (
          <div className="mt-2 p-2 bg-gray-800/50 rounded border border-gray-700/40">
            <p className="text-xs text-gray-400">
              <span className="font-medium text-white">{selectedVendor.name}</span>
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{selectedVendor.phone}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              SLA Compliance: {selectedVendor.slaCompliance}% | Avg Response:{' '}
              {selectedVendor.avgResponseTime}h
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
