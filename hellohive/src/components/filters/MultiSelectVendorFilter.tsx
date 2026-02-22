'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';
import type { Vendor } from '@/data/seed-data';

interface MultiSelectVendorFilterProps {
  selectedVendorIds: string[];
  onChange: (vendorIds: string[]) => void;
  vendors: Vendor[];
  showMyVendorsToggle?: boolean;
  myVendorsOnly?: boolean;
  onMyVendorsToggle?: (enabled: boolean) => void;
  associatedVendorIds?: string[];
}

export function MultiSelectVendorFilter({
  selectedVendorIds,
  onChange,
  vendors,
  showMyVendorsToggle = false,
  myVendorsOnly = false,
  onMyVendorsToggle,
  associatedVendorIds = [],
}: MultiSelectVendorFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // ESC key to close
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Filter vendors based on search and myVendorsOnly
  const filteredVendors = useMemo(() => {
    let vendorList = vendors;

    // Filter by myVendorsOnly if active
    if (myVendorsOnly && associatedVendorIds.length > 0) {
      vendorList = vendorList.filter((v) => associatedVendorIds.includes(v.id));
    }

    // Filter by search term
    if (searchTerm) {
      vendorList = vendorList.filter((v) =>
        v.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return vendorList;
  }, [vendors, searchTerm, myVendorsOnly, associatedVendorIds]);

  // Display text for trigger button
  const displayText = useMemo(() => {
    if (selectedVendorIds.length === 0) return 'All Vendors';

    const vendorNames = selectedVendorIds
      .filter((id) => id !== 'UNASSIGNED')
      .map((id) => vendors.find((v) => v.id === id)?.name)
      .filter(Boolean);

    const parts = [];
    if (selectedVendorIds.includes('UNASSIGNED')) parts.push('Unassigned');

    if (vendorNames.length === 1) {
      parts.push(vendorNames[0]);
    } else if (vendorNames.length > 1) {
      parts.push(`${vendorNames[0]}, +${vendorNames.length - 1} more`);
    }

    return parts.join(', ') || 'All Vendors';
  }, [selectedVendorIds, vendors]);

  const toggleVendor = (vendorId: string) => {
    const newSelection = selectedVendorIds.includes(vendorId)
      ? selectedVendorIds.filter((id) => id !== vendorId)
      : [...selectedVendorIds, vendorId];
    onChange(newSelection);
  };

  const toggleUnassigned = () => {
    const newSelection = selectedVendorIds.includes('UNASSIGNED')
      ? selectedVendorIds.filter((id) => id !== 'UNASSIGNED')
      : [...selectedVendorIds, 'UNASSIGNED'];
    onChange(newSelection);
  };

  const clearAll = () => {
    onChange([]);
    setSearchTerm('');
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent flex items-center justify-between"
      >
        <span className="truncate">{displayText}</span>
        <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-800 border border-gray-700/40 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden flex flex-col">
          {/* My Vendors Only Toggle */}
          {showMyVendorsToggle && onMyVendorsToggle && (
            <div className="p-3 border-b border-gray-700/20">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-medium text-white">
                  My Vendors Only
                </span>
                <button
                  type="button"
                  onClick={() => onMyVendorsToggle(!myVendorsOnly)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    myVendorsOnly ? 'bg-[#F5C518]' : 'bg-gray-700'
                  }`}
                  aria-label="Toggle My Vendors Only"
                >
                  <div
                    className={`absolute top-1 left-1 w-4 h-4 bg-neutral-950 rounded-full transition-transform ${
                      myVendorsOnly ? 'translate-x-6' : ''
                    }`}
                  />
                </button>
              </label>
            </div>
          )}

          {/* Search Input */}
          <div className="p-3 border-b border-gray-700/20">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search vendors..."
                className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-3 py-2 pr-8 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Checkbox List */}
          <div className="overflow-y-auto flex-1 p-2">
            {/* Unassigned Option */}
            <label className="flex items-center gap-2 p-2 hover:bg-neutral-900 rounded cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={selectedVendorIds.includes('UNASSIGNED')}
                onChange={toggleUnassigned}
                className="w-4 h-4 bg-neutral-900 border-gray-700/40 rounded focus:ring-2 focus:ring-[#F5C518]"
              />
              <span className="text-sm text-[#F5C518] font-medium">
                Unassigned
              </span>
            </label>

            {/* Vendor Checkboxes */}
            {filteredVendors.length === 0 ? (
              <p className="text-sm text-gray-400 p-2 text-center">
                No vendors found
              </p>
            ) : (
              filteredVendors.map((vendor) => (
                <label
                  key={vendor.id}
                  className="flex items-center gap-2 p-2 hover:bg-neutral-900 rounded cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedVendorIds.includes(vendor.id)}
                    onChange={() => toggleVendor(vendor.id)}
                    className="w-4 h-4 bg-neutral-900 border-gray-700/40 rounded focus:ring-2 focus:ring-[#F5C518]"
                  />
                  <span className="text-sm text-white">
                    {vendor.name}
                  </span>
                </label>
              ))
            )}
          </div>

          {/* Clear All Button */}
          {selectedVendorIds.length > 0 && (
            <div className="p-3 border-t border-gray-700/20">
              <button
                type="button"
                onClick={clearAll}
                className="text-sm text-[#F5C518] hover:text-[#F5C518]/80 transition-colors"
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
