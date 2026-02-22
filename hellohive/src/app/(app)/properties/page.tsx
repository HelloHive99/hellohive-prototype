'use client';

import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useUser } from '@/context/UserContext';
import { PropertyDrawer } from '@/components/properties/PropertyDrawer';
import type { Property } from '@/data/seed-data';

export default function PropertiesPage() {
  const {
    getAllProperties,
    addProperty,
    updateProperty,
    hasPermission,
  } = useUser();

  const properties = getAllProperties();
  const canManage = hasPermission('manageProperties');

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | undefined>(undefined);

  // Handle add property
  const handleAddClick = () => {
    setEditingProperty(undefined);
    setDrawerOpen(true);
  };

  // Handle edit property
  const handleEditClick = (property: Property) => {
    setEditingProperty(property);
    setDrawerOpen(true);
  };

  // Handle save (add or update)
  const handleSave = (property: Property) => {
    if (editingProperty) {
      updateProperty(property.id, property);
    } else {
      addProperty(property);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Properties
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {properties.length} propert{properties.length !== 1 ? 'ies' : 'y'}
          </p>
        </div>
        {canManage && (
          <Button onClick={handleAddClick}>+ Add Property</Button>
        )}
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {properties.map((property) => {
          const totalAssets = property.spaces.reduce((acc, space) => acc + space.assets.length, 0);

          return (
            <Card key={property.id} className="animate-fadeIn">
              <div className="space-y-4">
                {/* Property Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight text-white">
                      {property.name}
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">
                      {property.address}
                    </p>
                  </div>
                  {canManage && (
                    <button
                      onClick={() => handleEditClick(property)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Spaces:</span>{' '}
                    <span className="text-white font-medium">{property.spaces.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Assets:</span>{' '}
                    <span className="text-white font-medium">{totalAssets}</span>
                  </div>
                </div>

                {/* Spaces List */}
                <div className="border-t border-gray-700/20 pt-4">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                    Spaces
                  </p>
                  <div className="space-y-2">
                    {property.spaces.map((space) => (
                      <div
                        key={space.id}
                        className="flex items-center justify-between p-2 bg-neutral-900 rounded-lg"
                      >
                        <div>
                          <p className="text-sm font-medium text-white">
                            {space.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {space.type}
                          </p>
                        </div>
                        <p className="text-xs text-gray-400">
                          {space.assets.length} asset{space.assets.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Property Drawer */}
      <PropertyDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSave={handleSave}
        property={editingProperty}
      />
    </div>
  );
}
