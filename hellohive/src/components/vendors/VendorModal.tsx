'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useUser } from '@/context/UserContext';
import type { Vendor, ServiceRegion, ContractType, VendorPriorityTier, VendorCategory } from '@/data/seed-data';

interface VendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendor?: Vendor; // If provided, edit mode; otherwise, add mode
}

export function VendorModal({ isOpen, onClose, vendor }: VendorModalProps) {
  const { addVendor, updateVendor, getAllVendors } = useUser();
  const isEditMode = !!vendor;

  // Form state - Basic Info
  const [name, setName] = useState('');
  const [category, setCategory] = useState<VendorCategory>('MEP');
  const [contact, setContact] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Service Coverage
  const [selectedRegions, setSelectedRegions] = useState<ServiceRegion[]>([]);
  const [priorityTier, setPriorityTier] = useState<VendorPriorityTier>('standard');

  // Contract
  const [contractType, setContractType] = useState<ContractType>('T&M');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rateCard, setRateCard] = useState('');

  // Emergency Contact
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyEmail, setEmergencyEmail] = useState('');

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pre-populate form if editing
  useEffect(() => {
    if (vendor) {
      setName(vendor.name);
      setCategory(vendor.category);
      setContact(vendor.contact);
      setPhone(vendor.phone);
      setEmail(vendor.primaryContactEmail);
      setSelectedRegions(vendor.serviceRegions);
      setPriorityTier(vendor.operationalStatus.priorityTier);
      setContractType(vendor.contract.type);
      setStartDate(vendor.contract.startDate);
      setEndDate(vendor.contract.endDate);
      setRateCard(vendor.contract.rateCard);
      setEmergencyName(vendor.emergencyContact.name);
      setEmergencyPhone(vendor.emergencyContact.phone);
      setEmergencyEmail(vendor.emergencyContact.email);
    }
  }, [vendor]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setName('');
      setCategory('MEP');
      setContact('');
      setPhone('');
      setEmail('');
      setSelectedRegions([]);
      setPriorityTier('standard');
      setContractType('T&M');
      setStartDate('');
      setEndDate('');
      setRateCard('');
      setEmergencyName('');
      setEmergencyPhone('');
      setEmergencyEmail('');
      setErrors({});
    }
  }, [isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Name is required';
    if (!contact.trim()) newErrors.contact = 'Contact name is required';
    if (!phone.trim()) newErrors.phone = 'Phone is required';
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email format';
    }

    // Date validation
    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      newErrors.endDate = 'End date must be after start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    if (isEditMode && vendor) {
      // Update existing vendor
      const updates: Partial<Vendor> = {
        name,
        category,
        contact,
        phone,
        primaryContactEmail: email,
        serviceRegions: selectedRegions,
        emergencyContact: {
          name: emergencyName || contact,
          phone: emergencyPhone || phone,
          email: emergencyEmail || email,
        },
        contract: {
          type: contractType,
          startDate: startDate || new Date().toISOString().split('T')[0],
          endDate: endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          rateCard: rateCard || 'Standard Rates',
        },
        operationalStatus: {
          ...vendor.operationalStatus,
          priorityTier,
        },
      };
      updateVendor(vendor.id, updates);
    } else {
      // Create new vendor
      const vendors = getAllVendors();
      const maxId = Math.max(0, ...vendors.map((v) => {
        const match = v.id.match(/vendor-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      }));
      const newId = `vendor-${maxId + 1}`;

      const newVendor: Vendor = {
        id: newId,
        name,
        category,
        contact,
        phone,
        slaCompliance: 95.0,
        avgResponseTime: 2.5,
        primaryContactEmail: email,
        serviceRegions: selectedRegions.length > 0 ? selectedRegions : ['National'],
        emergencyContact: {
          name: emergencyName || contact,
          phone: emergencyPhone || phone,
          email: emergencyEmail || email,
        },
        contract: {
          type: contractType,
          startDate: startDate || new Date().toISOString().split('T')[0],
          endDate: endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          rateCard: rateCard || 'Standard Rates',
        },
        compliance: {
          insuranceCert: 'Current',
          backgroundChecks: 'All Clear',
          safetyTraining: 'Current',
        },
        performance: {
          avgResolutionTime: 5.0,
          firstTimeFixRate: 85,
          missedSlas: 2,
          jobsCompleted: 0,
          escalations: 0,
          internalRating: 4.0,
        },
        operationalStatus: {
          currentStatus: 'available',
          activeWorkOrdersCount: 0,
          lastDispatchTime: new Date().toISOString(),
          priorityTier,
        },
        intelligence: {
          totalJobsAllTime: 0,
          avgMonthlyJobs: 0,
          avgCostPerJob: 0,
          totalSpendYtd: 0,
          commonIssueTypes: [],
          primaryPropertiesServiced: [],
        },
      };

      addVendor(newVendor);
    }

    onClose();
  };

  const toggleRegion = (region: ServiceRegion) => {
    setSelectedRegions((prev) =>
      prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region]
    );
  };

  const regions: ServiceRegion[] = ['Philadelphia Metro', 'Clearwater/Tampa Bay', 'Northeast Corridor', 'National'];
  const categories: VendorCategory[] = ['MEP', 'Electrical', 'Janitorial', 'Security', 'AV/Broadcast'];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <Card className="p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-white">
                {isEditMode ? 'Edit Vendor' : 'Add Vendor'}
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {isEditMode ? 'Update vendor information' : 'Enter vendor details'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form Sections */}
          <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                Basic Information
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">
                    Vendor Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
                  />
                  {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as VendorCategory)}
                    className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
                  />
                  {errors.contact && <p className="text-xs text-red-400 mt-1">{errors.contact}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
                  />
                  {errors.phone && <p className="text-xs text-red-400 mt-1">{errors.phone}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-400 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
                  />
                  {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
                </div>
              </div>
            </div>

            {/* Service Coverage */}
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                Service Coverage
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">
                    Service Regions
                  </label>
                  <div className="space-y-2">
                    {regions.map((region) => (
                      <label key={region} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedRegions.includes(region)}
                          onChange={() => toggleRegion(region)}
                          className="w-4 h-4 bg-neutral-900 border-gray-700/40 rounded focus:ring-2 focus:ring-[#F5C518]"
                        />
                        <span className="text-sm text-white">{region}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">
                    Priority Tier
                  </label>
                  <select
                    value={priorityTier}
                    onChange={(e) => setPriorityTier(e.target.value as VendorPriorityTier)}
                    className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
                  >
                    <option value="standard">Standard</option>
                    <option value="gold">Gold</option>
                    <option value="platinum">Platinum</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Contract */}
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                Contract Details
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">
                    Contract Type
                  </label>
                  <select
                    value={contractType}
                    onChange={(e) => setContractType(e.target.value as ContractType)}
                    className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
                  >
                    <option value="T&M">T&M (Time & Materials)</option>
                    <option value="MSA">MSA (Master Service Agreement)</option>
                    <option value="SOW">SOW (Statement of Work)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">
                    Rate Card
                  </label>
                  <input
                    type="text"
                    value={rateCard}
                    onChange={(e) => setRateCard(e.target.value)}
                    placeholder="Standard Rates"
                    className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
                  />
                  {errors.endDate && <p className="text-xs text-red-400 mt-1">{errors.endDate}</p>}
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                Emergency Contact (Optional)
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                    placeholder="Same as primary"
                    className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    placeholder="Same as primary"
                    className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={emergencyEmail}
                    onChange={(e) => setEmergencyEmail(e.target.value)}
                    placeholder="Same as primary"
                    className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-8">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {isEditMode ? 'Save Changes' : 'Add Vendor'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
