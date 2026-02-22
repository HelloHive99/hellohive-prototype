'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MoreVertical, Edit, Eye, Archive, Trash2 } from 'lucide-react';
import type { Asset } from '@/data/seed-data';

interface AssetActionsDropdownProps {
  asset: Asset;
  onEdit: () => void;
  onRetire: () => void;
  onDelete: () => void;
  canEdit: boolean;
  canRetire: boolean;
  canDelete: boolean;
}

export function AssetActionsDropdown({
  asset,
  onEdit,
  onRetire,
  onDelete,
  canEdit,
  canRetire,
  canDelete,
}: AssetActionsDropdownProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleEdit = () => {
    setIsOpen(false);
    onEdit();
  };

  const handleViewDetails = () => {
    setIsOpen(false);
    router.push(`/assets/${asset.id}`);
  };

  const handleRetire = () => {
    setIsOpen(false);
    onRetire();
  };

  const handleDelete = () => {
    setIsOpen(false);
    onDelete();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1 rounded hover:bg-gray-700/50 transition-colors"
        aria-label="Actions"
      >
        <MoreVertical className="w-4 h-4 text-gray-400" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-neutral-900 border border-gray-700/40 rounded-lg shadow-lg z-50">
          <div className="py-1">
            {/* View Details */}
            <button
              onClick={handleViewDetails}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-white hover:bg-gray-700/50 transition-colors text-left"
            >
              <Eye className="w-4 h-4 text-gray-400" />
              View Details
            </button>

            {/* Edit - only if has permission and not retired */}
            {canEdit && !asset.isRetired && (
              <button
                onClick={handleEdit}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-white hover:bg-gray-700/50 transition-colors text-left"
              >
                <Edit className="w-4 h-4 text-gray-400" />
                Edit Asset
              </button>
            )}

            {/* Retire - only if has permission and not already retired */}
            {canRetire && !asset.isRetired && (
              <>
                <div className="border-t border-gray-700/40 my-1" />
                <button
                  onClick={handleRetire}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-amber-400 hover:bg-gray-700/50 transition-colors text-left"
                >
                  <Archive className="w-4 h-4" />
                  Retire Asset
                </button>
              </>
            )}

            {/* Delete - admin only */}
            {canDelete && (
              <>
                <div className="border-t border-gray-700/40 my-1" />
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-gray-700/50 transition-colors text-left"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Asset
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
