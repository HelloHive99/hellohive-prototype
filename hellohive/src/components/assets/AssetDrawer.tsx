'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { WizardStepper } from '@/components/ui/WizardStepper';
import { useUser } from '@/context/UserContext';
import type { Asset } from '@/data/seed-data';
import { users } from '@/data/seed-data';
import {
  validateBasicInfo,
  validateLocation,
  validateMaintenance,
  validateOwnership,
} from '@/lib/asset-validation';

// Import step components
import { AssetBasicInfoStep } from './AssetBasicInfoStep';
import { AssetLocationStep } from './AssetLocationStep';
import { AssetMaintenanceStep } from './AssetMaintenanceStep';
import { AssetOwnershipStep } from './AssetOwnershipStep';
import { AssetReviewStep } from './AssetReviewStep';

interface AssetDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  asset?: Asset; // If provided = edit mode
  initialPropertyId?: string;
  initialSpaceId?: string;
}

const WIZARD_STEPS = [
  'Basic Information',
  'Location & Classification',
  'Maintenance Schedule',
  'Ownership & Accountability',
  'Review & Submit',
];

export function AssetDrawer({
  isOpen,
  onClose,
  asset,
  initialPropertyId,
  initialSpaceId,
}: AssetDrawerProps) {
  const { getAllAssets, addAsset, updateAsset, getAllProperties, getAllTechnicians, getAllVendors } = useUser();

  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [maxReachedStep, setMaxReachedStep] = useState(1);
  const [formData, setFormData] = useState<Partial<Asset>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pre-populate form data in edit mode
  useEffect(() => {
    if (asset && isOpen) {
      setFormData(asset);
      setCurrentStep(1);
      setMaxReachedStep(5); // In edit mode, allow navigation to all steps
    } else if (!isOpen) {
      // Reset form when drawer closes
      setFormData({
        spaceId: initialSpaceId || '',
      });
      setCurrentStep(1);
      setMaxReachedStep(1);
      setErrors({});
    } else if (isOpen && !asset) {
      // Initialize for create mode
      setFormData({
        spaceId: initialSpaceId || '',
      });
      setCurrentStep(1);
      setMaxReachedStep(1);
      setErrors({});
    }
  }, [asset, isOpen, initialSpaceId]);

  // Reset errors when changing steps
  useEffect(() => {
    setErrors({});
  }, [currentStep]);

  // Validation function for current step
  const validateCurrentStep = (): boolean => {
    let stepErrors: Record<string, string> = {};

    switch (currentStep) {
      case 1:
        stepErrors = validateBasicInfo(formData);
        break;
      case 2:
        stepErrors = validateLocation(formData);
        break;
      case 3:
        stepErrors = validateMaintenance(formData);
        break;
      case 4:
        stepErrors = validateOwnership(formData);
        break;
      case 5:
        // Step 5 is review, no additional validation needed
        stepErrors = {};
        break;
      default:
        stepErrors = {};
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  // Handle next button
  const handleNext = () => {
    if (!validateCurrentStep()) {
      return;
    }

    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);

    // Update max reached step
    if (nextStep > maxReachedStep) {
      setMaxReachedStep(nextStep);
    }
  };

  // Handle back button
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle step click from stepper
  const handleStepClick = (step: number) => {
    if (step <= maxReachedStep) {
      setCurrentStep(step);
    }
  };

  // Handle form data updates from step components
  const updateFormData = (updates: Partial<Asset>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  // onChange wrapper for step components
  const onChange = (field: keyof Asset, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle submit
  const handleSubmit = () => {
    if (!validateCurrentStep()) {
      return;
    }

    // Ensure spaceId is set
    if (!formData.spaceId) {
      setErrors({ spaceId: 'Space is required' });
      return;
    }

    if (asset) {
      // Edit mode: update existing asset
      updateAsset(asset.id, formData);
    } else {
      // Create mode: generate new ID and add asset
      const allAssets = getAllAssets();
      const maxId = Math.max(
        0,
        ...allAssets.map((a) => {
          const match = a.id.match(/asset-(\d+)/);
          return match ? parseInt(match[1], 10) : 0;
        })
      );
      const newId = `asset-${maxId + 1}`;

      const newAsset: Asset = {
        id: newId,
        spaceId: formData.spaceId!,
        name: formData.name || '',
        type: formData.type || '',
        model: formData.model,
        health: formData.health || 'good',
        criticality: formData.criticality || 'important',
        operationalImpact: formData.operationalImpact || 'medium',
        owner: formData.owner || '',
        lastPmDate: formData.lastPmDate,
        nextPmDate: formData.nextPmDate,
        pmFrequencyDays: formData.pmFrequencyDays || 90,
        manufacturer: formData.manufacturer,
        serialNumber: formData.serialNumber,
        installationDate: formData.installationDate,
        warrantyExpiration: formData.warrantyExpiration,
        pmCompletionRate: formData.pmCompletionRate,
        lastRepairCost: formData.lastRepairCost,
        maintenanceCostYTD: formData.maintenanceCostYTD,
        failureFrequency: formData.failureFrequency,
        trendDirection: formData.trendDirection,
        primaryTechnicianId: formData.primaryTechnicianId,
        escalationOwnerId: formData.escalationOwnerId,
        preferredVendorId: formData.preferredVendorId,
        commonParts: formData.commonParts,
        dependencyNotes: formData.dependencyNotes,
        isRetired: false,
      };

      addAsset(newAsset, formData.spaceId);
    }

    onClose();
  };

  // Render current step component
  const renderStepContent = () => {
    const stepProps = {
      formData,
      onChange,
      errors,
    };

    switch (currentStep) {
      case 1:
        return <AssetBasicInfoStep {...stepProps} />;
      case 2:
        return (
          <AssetLocationStep
            {...stepProps}
            properties={getAllProperties()}
          />
        );
      case 3:
        return <AssetMaintenanceStep {...stepProps} />;
      case 4:
        return (
          <AssetOwnershipStep
            {...stepProps}
            technicians={getAllTechnicians()}
            vendors={getAllVendors()}
            users={users}
          />
        );
      case 5:
        return (
          <AssetReviewStep
            formData={formData}
            properties={getAllProperties()}
            technicians={getAllTechnicians()}
            vendors={getAllVendors()}
            users={users}
            onEditStep={(stepNumber) => {
              setCurrentStep(stepNumber);
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-3xl bg-neutral-900 border-l border-neutral-800 z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } flex flex-col`}
      >
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-800">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-white">
              {asset ? 'Edit Asset' : 'Add Asset'}
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {asset
                ? 'Update asset details and configuration'
                : 'Create a new asset with multi-step wizard'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Wizard Stepper */}
          <WizardStepper
            steps={WIZARD_STEPS}
            currentStep={currentStep}
            maxReachedStep={maxReachedStep}
            onStepClick={handleStepClick}
          />

          {/* Step Content */}
          <div className="mt-6">
            {renderStepContent()}
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="flex items-center justify-between gap-3 p-6 border-t border-neutral-800 bg-neutral-900">
          <div className="flex gap-3">
            {currentStep > 1 && (
              <Button variant="ghost" onClick={handleBack}>
                Back
              </Button>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            {currentStep < 5 ? (
              <Button onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button onClick={handleSubmit}>
                {asset ? 'Save Changes' : 'Create Asset'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
