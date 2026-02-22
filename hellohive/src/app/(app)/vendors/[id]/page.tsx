'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useUser } from '@/context/UserContext';
import { VendorProfileSection } from '@/components/vendors/VendorProfileSection';
import { VendorContractSection } from '@/components/vendors/VendorContractSection';
import { VendorPerformanceSection } from '@/components/vendors/VendorPerformanceSection';
import { VendorLiveStatusSection } from '@/components/vendors/VendorLiveStatusSection';
import { VendorIntelligenceSection } from '@/components/vendors/VendorIntelligenceSection';
import { VendorTechniciansTable } from '@/components/vendors/VendorTechniciansTable';
import { VendorModal } from '@/components/vendors/VendorModal';
import { TechnicianModal } from '@/components/vendors/TechnicianModal';

export default function VendorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { getVendorById, getTechniciansByVendor, hasPermission, updateTechnician } = useUser();

  const vendorId = params.id as string;
  const vendor = getVendorById(vendorId);
  const technicians = getTechniciansByVendor(vendorId);
  const canManage = hasPermission('manageVendors');

  // Modal state
  const [showEditVendorModal, setShowEditVendorModal] = useState(false);
  const [showAddTechModal, setShowAddTechModal] = useState(false);
  const [showEditTechModal, setShowEditTechModal] = useState(false);
  const [selectedTechId, setSelectedTechId] = useState<string | null>(null);

  const handleEditTechnician = (techId: string) => {
    setSelectedTechId(techId);
    setShowEditTechModal(true);
  };

  const handleDeactivateTechnician = (techId: string) => {
    if (confirm('Are you sure you want to deactivate this technician?')) {
      updateTechnician(techId, { isActive: false });
    }
  };

  const selectedTech = selectedTechId
    ? technicians.find((t) => t.id === selectedTechId)
    : undefined;

  if (!vendor) {
    return (
      <div className="space-y-6">
        <Card>
          <p className="text-sm text-gray-400">Vendor not found.</p>
          <Button onClick={() => router.back()} className="mt-4">
            Back to Vendors
          </Button>
        </Card>
      </div>
    );
  }

  const statusVariant =
    vendor.operationalStatus.currentStatus === 'available'
      ? 'completed'
      : vendor.operationalStatus.currentStatus === 'limited'
      ? 'pending'
      : 'overdue';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            {vendor.name}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <Badge variant="pending">{vendor.category}</Badge>
            <Badge variant={statusVariant}>
              {vendor.operationalStatus.currentStatus.toUpperCase()}
            </Badge>
            <span className="text-sm text-gray-400">
              {vendor.performance.internalRating.toFixed(1)} ⭐
            </span>
          </div>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowEditVendorModal(true)}>
              Edit Vendor
            </Button>
          </div>
        )}
      </div>

      {/* 7 Sections */}
      <VendorProfileSection vendor={vendor} />
      <VendorContractSection vendor={vendor} />
      <VendorPerformanceSection vendor={vendor} />
      <VendorLiveStatusSection vendor={vendor} />
      <VendorIntelligenceSection vendor={vendor} />
      <VendorTechniciansTable
        technicians={technicians}
        canManage={canManage}
        onAddTechnician={() => setShowAddTechModal(true)}
        onEditTechnician={handleEditTechnician}
        onDeactivateTechnician={handleDeactivateTechnician}
      />

      {/* Modals */}
      {showEditVendorModal && (
        <VendorModal
          isOpen={showEditVendorModal}
          onClose={() => setShowEditVendorModal(false)}
          vendor={vendor}
        />
      )}
      {showAddTechModal && (
        <TechnicianModal
          isOpen={showAddTechModal}
          onClose={() => setShowAddTechModal(false)}
          vendorId={vendorId}
        />
      )}
      {showEditTechModal && selectedTech && (
        <TechnicianModal
          isOpen={showEditTechModal}
          onClose={() => {
            setShowEditTechModal(false);
            setSelectedTechId(null);
          }}
          vendorId={vendorId}
          technician={selectedTech}
        />
      )}
    </div>
  );
}
