'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useUser } from '@/context/UserContext';
import type { WorkOrder } from '@/data/seed-data';

interface SimulateAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: WorkOrder;
}

export function SimulateAssignmentModal({
  isOpen,
  onClose,
  workOrder,
}: SimulateAssignmentModalProps) {
  const { getTechniciansByVendor, getVendorById, updateWorkOrder, addActivityFeedItem, currentUser } = useUser();

  const [selectedTechnicianId, setSelectedTechnicianId] = useState('');
  const [eta, setEta] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get vendor and available technicians
  const vendor = workOrder.assignedVendorId ? getVendorById(workOrder.assignedVendorId) : undefined;
  const availableTechnicians = workOrder.assignedVendorId
    ? getTechniciansByVendor(workOrder.assignedVendorId)
    : [];

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedTechnicianId('');
      setEta('');
      setErrors({});
    }
  }, [isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedTechnicianId) {
      newErrors.technician = 'Please select a technician';
    }

    // Validate ETA if provided
    if (eta && new Date(eta) <= new Date()) {
      newErrors.eta = 'ETA must be in the future';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    // Update work order with technician assignment
    const updates: Partial<WorkOrder> = {
      assignedTechnicianId: selectedTechnicianId,
    };

    if (eta) {
      updates.vendorReportedEta = new Date(eta).toISOString();
    }

    updateWorkOrder(workOrder.id, updates);

    // Add activity feed entry
    const selectedTech = availableTechnicians.find((t) => t.id === selectedTechnicianId);
    if (selectedTech) {
      const activityId = `activity-${Date.now()}`;
      addActivityFeedItem({
        id: activityId,
        workOrderId: workOrder.id,
        message: `Technician assigned: ${selectedTech.fullName}${eta ? ` (ETA: ${new Date(eta).toLocaleString()})` : ''}`,
        timestamp: new Date().toISOString(),
        userId: currentUser.id,
      });
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <Card className="p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-white">
                Simulate Vendor Assignment
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Assign a technician to work order {workOrder.id}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Explanation */}
          <div className="mb-6 p-4 bg-neutral-900 border border-[#F5C518]/20 rounded-lg">
            <p className="text-sm text-white mb-2">
              <span className="font-semibold">Demo Feature:</span> In production, vendors assign
              technicians through their own portal.
            </p>
            <p className="text-xs text-gray-400">
              This simulation allows you to test the assignment workflow for demo purposes.
            </p>
          </div>

          {/* Vendor Info */}
          {vendor && (
            <div className="mb-6 p-4 bg-neutral-900 rounded-lg">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                Assigned Vendor
              </p>
              <p className="text-sm font-medium text-white">{vendor.name}</p>
              <p className="text-xs text-gray-400">{vendor.category}</p>
            </div>
          )}

          {/* Form */}
          <div className="space-y-6">
            {/* Technician Selection */}
            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                Select Technician *
              </label>
              {availableTechnicians.length === 0 ? (
                <div className="p-4 bg-neutral-900 rounded-lg border border-gray-700/40">
                  <p className="text-sm text-gray-400">
                    No available technicians for this vendor.
                  </p>
                </div>
              ) : (
                <select
                  value={selectedTechnicianId}
                  onChange={(e) => setSelectedTechnicianId(e.target.value)}
                  className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
                >
                  <option value="">-- Select a technician --</option>
                  {availableTechnicians.map((tech) => (
                    <option key={tech.id} value={tech.id}>
                      {tech.fullName} - {tech.roleTitle} ({tech.currentStatus})
                    </option>
                  ))}
                </select>
              )}
              {errors.technician && (
                <p className="text-xs text-red-400 mt-1">{errors.technician}</p>
              )}
            </div>

            {/* Technician Details (if selected) */}
            {selectedTechnicianId && (() => {
              const selectedTech = availableTechnicians.find((t) => t.id === selectedTechnicianId);
              if (!selectedTech) return null;

              return (
                <div className="p-4 bg-neutral-900 rounded-lg">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                    Technician Details
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Phone:</span>
                      <span className="text-sm text-white">{selectedTech.phone}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Status:</span>
                      <Badge
                        variant={
                          selectedTech.currentStatus === 'available'
                            ? 'completed'
                            : selectedTech.currentStatus === 'on-job'
                            ? 'in-progress'
                            : 'pending'
                        }
                        className="text-xs"
                      >
                        {selectedTech.currentStatus}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Skills:</span>
                      <span className="text-sm text-white">
                        {selectedTech.skillTags.slice(0, 3).join(', ')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Avg Response:</span>
                      <span className="text-sm text-white">
                        {selectedTech.avgResponseTime.toFixed(1)} hrs
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ETA (Optional) */}
            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                Estimated Time of Arrival (Optional)
              </label>
              <input
                type="datetime-local"
                value={eta}
                onChange={(e) => setEta(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
              />
              {errors.eta && <p className="text-xs text-red-400 mt-1">{errors.eta}</p>}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-8">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={availableTechnicians.length === 0}>
              Assign Technician
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
