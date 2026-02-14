'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useUser } from '@/context/UserContext';
import { properties, vendors } from '@/data/seed-data';
import { formatDistanceToNow } from 'date-fns';
import type { WorkOrderStatus, WorkOrderPriority } from '@/data/seed-data';

type FilterStatus = 'all' | WorkOrderStatus;
type FilterPriority = 'all' | WorkOrderPriority;

export default function WorkOrdersPage() {
  const { getAccessibleWorkOrders } = useUser();
  const workOrders = getAccessibleWorkOrders();

  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [propertyFilter, setPropertyFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<FilterPriority>('all');

  // Apply filters
  const filteredWorkOrders = useMemo(() => {
    return workOrders.filter((wo) => {
      if (statusFilter !== 'all' && wo.status !== statusFilter) return false;
      if (propertyFilter !== 'all' && wo.propertyId !== propertyFilter) return false;
      if (priorityFilter !== 'all' && wo.priority !== priorityFilter) return false;
      return true;
    });
  }, [workOrders, statusFilter, propertyFilter, priorityFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#F5F0EB]">
          Work Orders
        </h1>
        <p className="text-sm text-[#4A4953] mt-1">
          {filteredWorkOrders.length} work order{filteredWorkOrders.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-xs font-medium text-[#4A4953] uppercase tracking-wider mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
              className="w-full bg-[#1E1520] border border-[#4A4953]/40 rounded-lg px-3 py-2 text-sm text-[#F5F0EB] focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
            >
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="dispatched">Dispatched</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
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

          {/* Priority Filter */}
          <div>
            <label className="block text-xs font-medium text-[#4A4953] uppercase tracking-wider mb-2">
              Priority
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as FilterPriority)}
              className="w-full bg-[#1E1520] border border-[#4A4953]/40 rounded-lg px-3 py-2 text-sm text-[#F5F0EB] focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
            >
              <option value="all">All</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Work Orders Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#4A4953]/20">
                <th className="text-left pb-3 text-xs font-medium text-[#4A4953] uppercase tracking-wider">
                  ID
                </th>
                <th className="text-left pb-3 text-xs font-medium text-[#4A4953] uppercase tracking-wider">
                  Description
                </th>
                <th className="text-left pb-3 text-xs font-medium text-[#4A4953] uppercase tracking-wider">
                  Space
                </th>
                <th className="text-left pb-3 text-xs font-medium text-[#4A4953] uppercase tracking-wider">
                  Priority
                </th>
                <th className="text-left pb-3 text-xs font-medium text-[#4A4953] uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left pb-3 text-xs font-medium text-[#4A4953] uppercase tracking-wider">
                  Vendor
                </th>
                <th className="text-left pb-3 text-xs font-medium text-[#4A4953] uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredWorkOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="pt-4 text-sm text-[#4A4953] text-center">
                    No work orders found.
                  </td>
                </tr>
              ) : (
                filteredWorkOrders.map((wo) => {
                  const property = properties.find((p) => p.id === wo.propertyId);
                  const space = property?.spaces.find((s) => s.id === wo.spaceId);
                  const vendor = wo.assignedVendorId
                    ? vendors.find((v) => v.id === wo.assignedVendorId)
                    : undefined;

                  return (
                    <tr
                      key={wo.id}
                      className="border-b border-[#4A4953]/20 last:border-0 hover:bg-[#1E1520] transition-colors"
                    >
                      <td className="py-4">
                        <Link
                          href={`/work-orders/${wo.id}`}
                          className="text-sm font-medium text-[#F5C518] hover:text-[#F5C518]/80 transition-colors"
                        >
                          {wo.id}
                        </Link>
                      </td>
                      <td className="py-4">
                        <p className="text-sm text-[#F5F0EB] truncate max-w-xs">
                          {wo.title || wo.description.slice(0, 60)}
                          {wo.description.length > 60 && '...'}
                        </p>
                      </td>
                      <td className="py-4">
                        <p className="text-sm text-[#F5F0EB]">
                          {space?.name}
                        </p>
                      </td>
                      <td className="py-4">
                        <Badge
                          variant={
                            wo.priority === 'low'
                              ? 'completed'
                              : wo.priority === 'medium'
                              ? 'pending'
                              : wo.priority === 'high'
                              ? 'in-progress'
                              : 'overdue'
                          }
                        >
                          {wo.priority}
                        </Badge>
                      </td>
                      <td className="py-4">
                        <Badge variant={wo.status}>{wo.status}</Badge>
                      </td>
                      <td className="py-4">
                        <p className="text-sm text-[#F5F0EB]">
                          {vendor ? vendor.name : '—'}
                        </p>
                      </td>
                      <td className="py-4">
                        <p className="text-sm text-[#4A4953]">
                          {formatDistanceToNow(new Date(wo.createdAt), { addSuffix: true })}
                        </p>
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
