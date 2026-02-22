'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useUser } from '@/context/UserContext';
import { properties } from '@/data/seed-data';
import type { Technician, ClearanceLevel } from '@/data/seed-data';

interface TechnicianModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendorId: string;
  technician?: Technician; // If provided, edit mode; otherwise, add mode
}

export function TechnicianModal({ isOpen, onClose, vendorId, technician }: TechnicianModalProps) {
  const { addTechnician, updateTechnician, getTechniciansByVendor } = useUser();
  const isEditMode = !!technician;

  // Form state - Basic Info
  const [fullName, setFullName] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Skills
  const [skillTagsInput, setSkillTagsInput] = useState('');
  const [certificationsInput, setCertificationsInput] = useState('');
  const [equipmentInput, setEquipmentInput] = useState('');

  // Clearance
  const [clearanceLevel, setClearanceLevel] = useState<ClearanceLevel>('basic');

  // Availability
  const [shiftHours, setShiftHours] = useState('');
  const [homeProperty, setHomeProperty] = useState('');

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pre-populate form if editing
  useEffect(() => {
    if (technician) {
      setFullName(technician.fullName);
      setRoleTitle(technician.roleTitle);
      setPhone(technician.phone);
      setEmail(technician.email);
      setSkillTagsInput(technician.skillTags.join(', '));
      setCertificationsInput(technician.certifications.join('\n'));
      setEquipmentInput(technician.equipmentAuthorizedFor.join('\n'));
      setClearanceLevel(technician.clearanceLevel);
      setShiftHours(technician.shiftHours);
      setHomeProperty(technician.homeProperty);
    }
  }, [technician]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFullName('');
      setRoleTitle('');
      setPhone('');
      setEmail('');
      setSkillTagsInput('');
      setCertificationsInput('');
      setEquipmentInput('');
      setClearanceLevel('basic');
      setShiftHours('');
      setHomeProperty('');
      setErrors({});
    }
  }, [isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!roleTitle.trim()) newErrors.roleTitle = 'Role title is required';
    if (!phone.trim()) newErrors.phone = 'Phone is required';
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    // Parse skill tags (comma-separated)
    const skillTags = skillTagsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    // Parse certifications (line-separated)
    const certifications = certificationsInput
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    // Parse equipment (line-separated)
    const equipment = equipmentInput
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    if (isEditMode && technician) {
      // Update existing technician
      const updates: Partial<Technician> = {
        fullName,
        roleTitle,
        phone,
        email,
        skillTags,
        certifications,
        equipmentAuthorizedFor: equipment,
        clearanceLevel,
        shiftHours: shiftHours || '8am-4pm M-F',
        homeProperty: homeProperty || 'Regional',
      };
      updateTechnician(technician.id, updates);
    } else {
      // Create new technician
      const existingTechs = getTechniciansByVendor(vendorId);
      const vendorTechCount = existingTechs.length + 1;
      const newId = `tech-${vendorId}-${vendorTechCount}`;

      const newTechnician: Technician = {
        id: newId,
        vendorId,
        fullName,
        roleTitle,
        phone,
        email,
        isActive: true,
        skillTags,
        certifications,
        equipmentAuthorizedFor: equipment,
        clearanceLevel,
        currentStatus: 'available',
        shiftHours: shiftHours || '8am-4pm M-F',
        assignedWorkOrdersCount: 0,
        homeProperty: homeProperty || 'Regional',
        estimatedResponseTime: 2.0,
        avgResponseTime: 2.5,
        avgResolutionTime: 5.0,
        firstTimeFixRate: 85,
        slaBreaches90d: 0,
        internalRating: 4.0,
        totalJobsCompleted: 0,
        lastJobDate: new Date().toISOString(),
      };

      addTechnician(newTechnician);
    }

    onClose();
  };

  const clearanceLevels: ClearanceLevel[] = ['none', 'basic', 'high-security', 'broadcast-ops'];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <Card className="p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-white">
                {isEditMode ? 'Edit Technician' : 'Add Technician'}
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {isEditMode ? 'Update technician information' : 'Enter technician details'}
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
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
                  />
                  {errors.fullName && <p className="text-xs text-red-400 mt-1">{errors.fullName}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">
                    Role Title *
                  </label>
                  <input
                    type="text"
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    placeholder="e.g., Senior HVAC Technician"
                    className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
                  />
                  {errors.roleTitle && <p className="text-xs text-red-400 mt-1">{errors.roleTitle}</p>}
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
                <div>
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

            {/* Skills & Certifications */}
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                Skills & Certifications
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">
                    Skill Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={skillTagsInput}
                    onChange={(e) => setSkillTagsInput(e.target.value)}
                    placeholder="HVAC, Electrical, Plumbing"
                    className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">
                    Certifications (one per line)
                  </label>
                  <textarea
                    value={certificationsInput}
                    onChange={(e) => setCertificationsInput(e.target.value)}
                    placeholder="EPA 608 Universal&#10;NATE Certified&#10;OSHA 30"
                    rows={3}
                    className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">
                    Equipment Authorized For (one per line)
                  </label>
                  <textarea
                    value={equipmentInput}
                    onChange={(e) => setEquipmentInput(e.target.value)}
                    placeholder="Carrier 50TC&#10;Trane XR16&#10;Liebert DS"
                    rows={3}
                    className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Clearance & Availability */}
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                Clearance & Availability
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">
                    Clearance Level
                  </label>
                  <select
                    value={clearanceLevel}
                    onChange={(e) => setClearanceLevel(e.target.value as ClearanceLevel)}
                    className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
                  >
                    {clearanceLevels.map((level) => (
                      <option key={level} value={level}>
                        {level.replace('-', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">
                    Shift Hours
                  </label>
                  <input
                    type="text"
                    value={shiftHours}
                    onChange={(e) => setShiftHours(e.target.value)}
                    placeholder="8am-4pm M-F"
                    className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">
                    Home Property
                  </label>
                  <select
                    value={homeProperty}
                    onChange={(e) => setHomeProperty(e.target.value)}
                    className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
                  >
                    <option value="">Regional</option>
                    {properties.map((prop) => (
                      <option key={prop.id} value={prop.id}>
                        {prop.name}
                      </option>
                    ))}
                  </select>
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
              {isEditMode ? 'Save Changes' : 'Add Technician'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
