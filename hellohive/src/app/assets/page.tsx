'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { properties } from '@/data/seed-data';

type FilterType = 'all' | string;

export default function AssetsPage() {
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [propertyFilter, setPropertyFilter] = useState<string>('all');

  // Flatten all assets from all properties
  const allAssets = useMemo(() => {
    const assets: Array<{
      id: string;
      name: string;
      type: string;
      model?: string;
      spaceName: string;
      propertyName: string;
      propertyId: string;
    }> = [];

    properties.forEach((property) => {
      property.spaces.forEach((space) => {
        space.assets.forEach((asset) => {
          assets.push({
            ...asset,
            spaceName: space.name,
            propertyName: property.name,
            propertyId: property.id,
          });
        });
      });
    });

    return assets;
  }, []);

  // Get unique asset types
  const assetTypes = useMemo(() => {
    const types = new Set(allAssets.map((a) => a.type));
    return Array.from(types).sort();
  }, [allAssets]);

  // Apply filters
  const filteredAssets = useMemo(() => {
    return allAssets.filter((asset) => {
      if (typeFilter !== 'all' && asset.type !== typeFilter) return false;
      if (propertyFilter !== 'all' && asset.propertyId !== propertyFilter) return false;
      return true;
    });
  }, [allAssets, typeFilter, propertyFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#F5F0EB]">
          Assets
        </h1>
        <p className="text-sm text-[#4A4953] mt-1">
          {filteredAssets.length} asset{filteredAssets.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Type Filter */}
          <div>
            <label className="block text-xs font-medium text-[#4A4953] uppercase tracking-wider mb-2">
              Asset Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-[#1E1520] border border-[#4A4953]/40 rounded-lg px-3 py-2 text-sm text-[#F5F0EB] focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
            >
              <option value="all">All</option>
              {assetTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Property Filter */}
          <div>
            <label className="block text-xs font-medium text-[#4A4953] uppercase tracking-wider mb-2">
              Property
            </label>
            <select
              value={propertyFilter}
              onChange={(e) => setPropertyFilter(e.target.value)}
              className="w-full bg-[#1E1520] border border-[#4A4953]/40 rounded-lg px-3 py-2 text-sm text-[#F5F0EB] focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
            >
              <option value="all">All</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Assets Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#4A4953]/20">
                <th className="text-left pb-3 text-xs font-medium text-[#4A4953] uppercase tracking-wider">
                  Asset Name
                </th>
                <th className="text-left pb-3 text-xs font-medium text-[#4A4953] uppercase tracking-wider">
                  Type
                </th>
                <th className="text-left pb-3 text-xs font-medium text-[#4A4953] uppercase tracking-wider">
                  Model
                </th>
                <th className="text-left pb-3 text-xs font-medium text-[#4A4953] uppercase tracking-wider">
                  Location
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={4} className="pt-4 text-sm text-[#4A4953] text-center">
                    No assets found.
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => {
                  return (
                    <tr
                      key={asset.id}
                      className="border-b border-[#4A4953]/20 last:border-0 hover:bg-[#1E1520] transition-colors"
                    >
                      <td className="py-4">
                        <p className="text-sm font-medium text-[#F5F0EB]">
                          {asset.name}
                        </p>
                      </td>
                      <td className="py-4">
                        <Badge variant="pending">
                          {asset.type}
                        </Badge>
                      </td>
                      <td className="py-4">
                        <p className="text-sm text-[#F5F0EB]">
                          {asset.model || '—'}
                        </p>
                      </td>
                      <td className="py-4">
                        <div className="text-sm">
                          <p className="text-[#F5F0EB] font-medium">
                            {asset.propertyName}
                          </p>
                          <p className="text-[#4A4953] text-xs">
                            {asset.spaceName}
                          </p>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
