'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { vendors } from '@/data/seed-data';
import type { WorkOrderCategory } from '@/data/seed-data';

type FilterCategory = 'all' | WorkOrderCategory;

export default function VendorsPage() {
  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>('all');

  // Apply filters
  const filteredVendors = useMemo(() => {
    return vendors.filter((vendor) => {
      if (categoryFilter !== 'all' && vendor.category !== categoryFilter) return false;
      return true;
    });
  }, [categoryFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#F5F0EB]">
          Vendors
        </h1>
        <p className="text-sm text-[#4A4953] mt-1">
          {filteredVendors.length} vendor{filteredVendors.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Category Filter */}
          <div>
            <label className="block text-xs font-medium text-[#4A4953] uppercase tracking-wider mb-2">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as FilterCategory)}
              className="w-full bg-[#1E1520] border border-[#4A4953]/40 rounded-lg px-3 py-2 text-sm text-[#F5F0EB] focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
            >
              <option value="all">All</option>
              <option value="HVAC">HVAC</option>
              <option value="Electrical">Electrical</option>
              <option value="Plumbing">Plumbing</option>
              <option value="Access Control">Access Control</option>
              <option value="AV/IT">AV/IT</option>
              <option value="General Maintenance">General Maintenance</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Vendors Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#4A4953]/20">
                <th className="text-left pb-3 text-xs font-medium text-[#4A4953] uppercase tracking-wider">
                  Name
                </th>
                <th className="text-left pb-3 text-xs font-medium text-[#4A4953] uppercase tracking-wider">
                  Category
                </th>
                <th className="text-left pb-3 text-xs font-medium text-[#4A4953] uppercase tracking-wider">
                  SLA Compliance
                </th>
                <th className="text-left pb-3 text-xs font-medium text-[#4A4953] uppercase tracking-wider">
                  Avg Response Time
                </th>
                <th className="text-left pb-3 text-xs font-medium text-[#4A4953] uppercase tracking-wider">
                  Availability
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="pt-4 text-sm text-[#4A4953] text-center">
                    No vendors found.
                  </td>
                </tr>
              ) : (
                filteredVendors.map((vendor) => {
                  return (
                    <tr
                      key={vendor.id}
                      className="border-b border-[#4A4953]/20 last:border-0 hover:bg-[#1E1520] transition-colors"
                    >
                      <td className="py-4">
                        <p className="text-sm font-medium text-[#F5F0EB]">
                          {vendor.name}
                        </p>
                      </td>
                      <td className="py-4">
                        <Badge variant="pending">
                          {vendor.category}
                        </Badge>
                      </td>
                      <td className="py-4">
                        <p className="text-sm text-[#F5F0EB]">
                          {vendor.slaCompliance.toFixed(1)}%
                        </p>
                      </td>
                      <td className="py-4">
                        <p className="text-sm text-[#F5F0EB]">
                          {vendor.avgResponseTime.toFixed(1)} hrs
                        </p>
                      </td>
                      <td className="py-4">
                        <Badge variant={vendor.currentlyAvailable ? 'completed' : 'overdue'}>
                          {vendor.currentlyAvailable ? 'Available' : 'Unavailable'}
                        </Badge>
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
