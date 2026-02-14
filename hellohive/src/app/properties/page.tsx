'use client';

import { Card } from '@/components/ui/Card';
import { properties } from '@/data/seed-data';

export default function PropertiesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#F5F0EB]">
          Properties
        </h1>
        <p className="text-sm text-[#4A4953] mt-1">
          {properties.length} propert{properties.length !== 1 ? 'ies' : 'y'}
        </p>
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {properties.map((property) => {
          const totalAssets = property.spaces.reduce((acc, space) => acc + space.assets.length, 0);

          return (
            <Card key={property.id} className="animate-fadeIn">
              <div className="space-y-4">
                {/* Property Header */}
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-[#F5F0EB]">
                    {property.name}
                  </h2>
                  <p className="text-sm text-[#4A4953] mt-1">
                    {property.address}
                  </p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <span className="text-[#4A4953]">Spaces:</span>{' '}
                    <span className="text-[#F5F0EB] font-medium">{property.spaces.length}</span>
                  </div>
                  <div>
                    <span className="text-[#4A4953]">Assets:</span>{' '}
                    <span className="text-[#F5F0EB] font-medium">{totalAssets}</span>
                  </div>
                </div>

                {/* Spaces List */}
                <div className="border-t border-[#4A4953]/20 pt-4">
                  <p className="text-xs font-medium text-[#4A4953] uppercase tracking-wider mb-2">
                    Spaces
                  </p>
                  <div className="space-y-2">
                    {property.spaces.map((space) => (
                      <div
                        key={space.id}
                        className="flex items-center justify-between p-2 bg-[#1E1520] rounded-lg"
                      >
                        <div>
                          <p className="text-sm font-medium text-[#F5F0EB]">
                            {space.name}
                          </p>
                          <p className="text-xs text-[#4A4953]">
                            {space.type}
                          </p>
                        </div>
                        <p className="text-xs text-[#4A4953]">
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
    </div>
  );
}
