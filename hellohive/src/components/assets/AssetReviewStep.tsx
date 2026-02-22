'use client';

import { format } from 'date-fns';
import type { Asset, Property, Technician, Vendor, User } from '@/data/seed-data';
import { Edit2, CheckCircle, XCircle } from 'lucide-react';

interface AssetReviewStepProps {
  formData: Partial<Asset>;
  properties: Property[];
  technicians?: Technician[];
  vendors?: Vendor[];
  users?: User[];
  onEditStep: (stepNumber: number) => void;
}

export function AssetReviewStep({
  formData,
  properties,
  technicians = [],
  vendors = [],
  users = [],
  onEditStep,
}: AssetReviewStepProps) {
  // Find property and space names
  const currentProperty = properties.find((p) =>
    p.spaces.some((s) => s.id === formData.spaceId)
  );
  const currentSpace = currentProperty?.spaces.find(
    (s) => s.id === formData.spaceId
  );

  // Find related entities
  const primaryTechnician = technicians.find(
    (t) => t.id === formData.primaryTechnicianId
  );
  const escalationOwner = users.find((u) => u.id === formData.escalationOwnerId);
  const preferredVendor = vendors.find((v) => v.id === formData.preferredVendorId);

  // Format dates
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  // Warranty status
  const isWarrantyActive =
    formData.warrantyExpiration &&
    new Date(formData.warrantyExpiration) > new Date();

  return (
    <div className="space-y-6">
      {/* Basic Information Section */}
      <div className="bg-neutral-900 border border-gray-700/40 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
            Basic Information
          </h3>
          <button
            type="button"
            onClick={() => onEditStep(0)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
          >
            <Edit2 className="w-3 h-3" />
            Edit
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-400 mb-1">Asset Name</p>
            <p className="text-sm text-white font-medium">
              {formData.name || 'Not specified'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Type</p>
            <p className="text-sm text-white">{formData.type || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Manufacturer</p>
            <p className="text-sm text-white">
              {formData.manufacturer || 'Not specified'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Model</p>
            <p className="text-sm text-white">{formData.model || 'Not specified'}</p>
          </div>
          {formData.serialNumber && (
            <div className="col-span-2">
              <p className="text-xs text-gray-400 mb-1">Serial Number</p>
              <p className="text-sm text-white font-mono">{formData.serialNumber}</p>
            </div>
          )}
        </div>
      </div>

      {/* Location & Classification Section */}
      <div className="bg-neutral-900 border border-gray-700/40 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
            Location & Classification
          </h3>
          <button
            type="button"
            onClick={() => onEditStep(1)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
          >
            <Edit2 className="w-3 h-3" />
            Edit
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-400 mb-1">Property</p>
            <p className="text-sm text-white">
              {currentProperty?.name || 'Not specified'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Space</p>
            <p className="text-sm text-white">{currentSpace?.name || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Health Status</p>
            <p className="text-sm text-white capitalize">
              {formData.health || 'Not specified'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Criticality</p>
            <p className="text-sm text-white capitalize">
              {formData.criticality?.replace('-', ' ') || 'Not specified'}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-gray-400 mb-1">Operational Impact</p>
            <p className="text-sm text-white capitalize">
              {formData.operationalImpact || 'Not specified'}
            </p>
          </div>
        </div>
      </div>

      {/* Maintenance Schedule Section */}
      <div className="bg-neutral-900 border border-gray-700/40 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
            Maintenance Schedule
          </h3>
          <button
            type="button"
            onClick={() => onEditStep(2)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
          >
            <Edit2 className="w-3 h-3" />
            Edit
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-400 mb-1">Installation Date</p>
            <p className="text-sm text-white">{formatDate(formData.installationDate)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Warranty Expiration</p>
            <div className="flex items-center gap-2">
              <p className="text-sm text-white">
                {formatDate(formData.warrantyExpiration)}
              </p>
              {formData.warrantyExpiration && (
                <>
                  {isWarrantyActive ? (
                    <CheckCircle className="w-3 h-3 text-green-500" />
                  ) : (
                    <XCircle className="w-3 h-3 text-gray-500" />
                  )}
                </>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">PM Frequency</p>
            <p className="text-sm text-white">
              {formData.pmFrequencyDays
                ? `Every ${formData.pmFrequencyDays} days`
                : 'Not specified'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Last PM Date</p>
            <p className="text-sm text-white">{formatDate(formData.lastPmDate)}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-gray-400 mb-1">
              Next PM Date (Auto-calculated)
            </p>
            <p className="text-sm text-white font-medium">
              {formatDate(formData.nextPmDate)}
            </p>
          </div>
        </div>
      </div>

      {/* Ownership & Accountability Section */}
      <div className="bg-neutral-900 border border-gray-700/40 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
            Ownership & Accountability
          </h3>
          <button
            type="button"
            onClick={() => onEditStep(3)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
          >
            <Edit2 className="w-3 h-3" />
            Edit
          </button>
        </div>
        <div className="grid grid-cols-1 gap-3">
          <div>
            <p className="text-xs text-gray-400 mb-1">Asset Owner</p>
            <p className="text-sm text-white">{formData.owner || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Primary Technician</p>
            <p className="text-sm text-white">
              {primaryTechnician
                ? `${primaryTechnician.fullName} - ${primaryTechnician.roleTitle}`
                : 'None assigned'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Escalation Owner</p>
            <p className="text-sm text-white">
              {escalationOwner
                ? `${escalationOwner.name} (${escalationOwner.role})`
                : 'None assigned'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Preferred Vendor</p>
            <p className="text-sm text-white">
              {preferredVendor
                ? `${preferredVendor.name} - ${preferredVendor.category}`
                : 'None assigned'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
