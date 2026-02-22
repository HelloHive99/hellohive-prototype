'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { Property, Space } from '@/data/seed-data';

interface PropertyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (property: Property) => void;
  property?: Property; // If provided, edit mode; if not, add mode
}

export function PropertyDrawer({
  isOpen,
  onClose,
  onSave,
  property,
}: PropertyDrawerProps) {
  // Form state
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [errors, setErrors] = useState<{ name?: string; address?: string }>({});

  // Populate form in edit mode
  useEffect(() => {
    if (property) {
      setName(property.name);
      setAddress(property.address);
      setSpaces(property.spaces || []);
    } else {
      // Reset for add mode
      setName('');
      setAddress('');
      setSpaces([]);
      setErrors({});
    }
  }, [property, isOpen]);

  // Validation
  const validate = () => {
    const newErrors: { name?: string; address?: string } = {};
    if (!name.trim()) newErrors.name = 'Property name is required';
    if (!address.trim()) newErrors.address = 'Address is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = () => {
    if (!validate()) return;

    const propertyData: Property = {
      id: property?.id || `prop-${Date.now()}`,
      name: name.trim(),
      address: address.trim(),
      spaces: spaces,
    };

    onSave(propertyData);
    onClose();
  };

  // Handle add space
  const handleAddSpace = () => {
    const newSpace: Space = {
      id: `space-${Date.now()}`,
      propertyId: property?.id || '',
      name: 'New Space',
      type: 'Other',
      assets: [],
    };
    setSpaces([...spaces, newSpace]);
  };

  // Handle remove space
  const handleRemoveSpace = (spaceId: string) => {
    setSpaces(spaces.filter((s) => s.id !== spaceId));
  };

  // Handle space name change
  const handleSpaceNameChange = (spaceId: string, newName: string) => {
    setSpaces(
      spaces.map((s) => (s.id === spaceId ? { ...s, name: newName } : s))
    );
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
        className={`fixed top-0 right-0 h-full w-full max-w-2xl bg-neutral-900 border-l border-neutral-800 z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-800">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-white">
              {property ? 'Edit Property' : 'Add Property'}
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {property
                ? 'Update property details and spaces'
                : 'Create a new property in your portfolio'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Property Name */}
          <div>
            <label className="block text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">
              Property Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Citizens Bank Park"
              className={`w-full bg-gray-800 border rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent ${
                errors.name ? 'border-red-500' : 'border-gray-700/40'
              }`}
            />
            {errors.name && (
              <p className="text-xs text-red-400 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">
              Address *
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g., 1 Citizens Bank Way, Philadelphia, PA 19148"
              rows={3}
              className={`w-full bg-gray-800 border rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent resize-none ${
                errors.address ? 'border-red-500' : 'border-gray-700/40'
              }`}
            />
            {errors.address && (
              <p className="text-xs text-red-400 mt-1">{errors.address}</p>
            )}
          </div>

          {/* Spaces Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-400 uppercase tracking-wider">
                Spaces
              </label>
              <button
                onClick={handleAddSpace}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Space
              </button>
            </div>

            {spaces.length === 0 ? (
              <div className="p-4 bg-gray-800 border border-gray-700/40 rounded-lg text-center">
                <p className="text-sm text-gray-400">
                  No spaces added yet. Click "+ Add Space" to create one.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {spaces.map((space) => (
                  <div
                    key={space.id}
                    className="flex items-center gap-3 p-3 bg-gray-800 border border-gray-700/40 rounded-lg"
                  >
                    <input
                      type="text"
                      value={space.name}
                      onChange={(e) =>
                        handleSpaceNameChange(space.id, e.target.value)
                      }
                      className="flex-1 bg-neutral-900 border border-gray-700/40 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#F5C518] focus:border-transparent"
                    />
                    <button
                      onClick={() => handleRemoveSpace(space.id)}
                      className="text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-neutral-800 bg-neutral-900">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {property ? 'Save Changes' : 'Create Property'}
          </Button>
        </div>
      </div>
    </>
  );
}
