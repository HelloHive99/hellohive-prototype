'use client';

import { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useUser } from '@/context/UserContext';
import { properties, vendors } from '@/data/seed-data';
import type { WorkOrderStatus, WorkOrderPriority } from '@/data/seed-data';
import { MultiSelectVendorFilter } from '@/components/filters/MultiSelectVendorFilter';
import { DateFilterDropdown } from '@/components/filters/DateFilterDropdown';
import { DateRangeModal } from '@/components/filters/DateRangeModal';
import { isLast24Hours, isLast7Days, isOverdue, isNext3Days, isInDateRange, formatRelativeAgo } from '@/lib/date-utils';
import { CircleDot, Clock, AlertTriangle, CheckCircle2, UserX } from 'lucide-react';

type FilterStatus = 'all' | WorkOrderStatus;
type FilterPriority = 'all' | WorkOrderPriority;
type SortColumn = 'id' | 'created' | 'priority' | 'status' | 'vendor' | 'space';
type SortDirection = 'asc' | 'desc';

const VALID_STATUSES: FilterStatus[] = ['all', 'open', 'in-progress', 'dispatched', 'completed', 'overdue'];

function WorkOrdersContent() {
  const { getAccessibleWorkOrders, currentUser } = useUser();
  const workOrders = getAccessibleWorkOrders();
  const searchParams = useSearchParams();

  const initialStatus = searchParams.get('status') ?? 'all';
  const [statusFilter, setStatusFilter] = useState<FilterStatus>(
    VALID_STATUSES.includes(initialStatus as FilterStatus)
      ? (initialStatus as FilterStatus)
      : 'all'
  );
  const [propertyFilter, setPropertyFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<FilterPriority>('all');
  const initialVendorId = searchParams.get('vendorId');
  const [vendorFilter, setVendorFilter] = useState<string[]>(
    initialVendorId ? [initialVendorId] : []
  );
  const [myVendorsOnly, setMyVendorsOnly] = useState<boolean>(false);
  const [sortColumn, setSortColumn] = useState<SortColumn>('created');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [quickFilter, setQuickFilter] = useState<WorkOrderStatus | 'unassigned' | null>(null);

  // Created Date Filter
  const [createdDateFilter, setCreatedDateFilter] = useState<'all' | 'last24h' | 'last7d' | 'custom'>('all');
  const [createdDateFrom, setCreatedDateFrom] = useState<string>('');
  const [createdDateTo, setCreatedDateTo] = useState<string>('');

  // Due Date Filter
  const [dueDateFilter, setDueDateFilter] = useState<'all' | 'overdue' | 'next3d' | 'custom'>('all');
  const [dueDateFrom, setDueDateFrom] = useState<string>('');
  const [dueDateTo, setDueDateTo] = useState<string>('');

  // UI State: Track which date range modal is open
  const [dateRangeModalOpen, setDateRangeModalOpen] = useState<'created' | 'due' | null>(null);

  // Sorting handlers
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIndicator = (column: SortColumn) => {
    if (sortColumn !== column) return '';
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  // Handle metric card clicks (quick filtering)
  const handleMetricClick = (filter: WorkOrderStatus | 'unassigned') => {
    if (quickFilter === filter) {
      setQuickFilter(null); // Clear filter if clicking same metric
    } else {
      setQuickFilter(filter); // Apply quick filter
    }
  };

  // Helper functions to parse city and state from address
  const getCityFromAddress = (address: string): string => {
    // Address format: "Street, City, State Zip"
    const parts = address.split(',');
    if (parts.length >= 2) {
      return parts[1].trim();
    }
    return '';
  };

  const getStateFromAddress = (address: string): string => {
    // Address format: "Street, City, State Zip"
    const parts = address.split(',');
    if (parts.length >= 3) {
      const stateZip = parts[2].trim();
      // Extract state (first 2 characters before zip)
      const statePart = stateZip.split(' ')[0];
      return statePart;
    }
    return '';
  };

  // Get unique cities and states from properties
  const uniqueCities = useMemo(() => {
    const cities = new Set<string>();
    properties.forEach(prop => {
      const city = getCityFromAddress(prop.address);
      if (city) cities.add(city);
    });
    return Array.from(cities).sort();
  }, []);

  const uniqueStates = useMemo(() => {
    const states = new Set<string>();
    properties.forEach(prop => {
      const state = getStateFromAddress(prop.address);
      if (state) states.add(state);
    });
    return Array.from(states).sort();
  }, []);

  // Priority ranking: urgent (highest) → low (lowest)
  const getPriorityRank = (priority: WorkOrderPriority): number => {
    const ranks = { urgent: 4, high: 3, medium: 2, low: 1 };
    return ranks[priority];
  };

  // Status ranking: overdue (MOST urgent) → completed (done)
  const getStatusRank = (status: WorkOrderStatus): number => {
    const ranks = {
      overdue: 0,      // Highest priority - overdue work
      open: 1,         // Needs assignment/action
      'in-progress': 2, // Work started
      dispatched: 3,   // Vendor assigned, waiting
      completed: 4     // Lowest priority - finished
    };
    return ranks[status];
  };

  // Apply filters and sorting
  const filteredAndSortedWorkOrders = useMemo(() => {
    // Step 1: Apply all filters
    let result = workOrders.filter((wo) => {
      if (statusFilter !== 'all' && wo.status !== statusFilter) return false;
      if (propertyFilter !== 'all' && wo.propertyId !== propertyFilter) return false;
      if (priorityFilter !== 'all' && wo.priority !== priorityFilter) return false;

      // City filter
      if (cityFilter !== 'all') {
        const property = properties.find(p => p.id === wo.propertyId);
        if (property) {
          const city = getCityFromAddress(property.address);
          if (city !== cityFilter) return false;
        }
      }

      // State filter
      if (stateFilter !== 'all') {
        const property = properties.find(p => p.id === wo.propertyId);
        if (property) {
          const state = getStateFromAddress(property.address);
          if (state !== stateFilter) return false;
        }
      }

      // Vendor filter
      if (vendorFilter.length > 0) {
        const includesUnassigned = vendorFilter.includes('UNASSIGNED');
        const vendorIds = vendorFilter.filter(id => id !== 'UNASSIGNED');

        const matchesUnassigned = includesUnassigned && !wo.assignedVendorId;
        const matchesVendor = vendorIds.length > 0 && wo.assignedVendorId && vendorIds.includes(wo.assignedVendorId);

        if (!matchesUnassigned && !matchesVendor) return false;
      }

      // Quick filter (from metrics bar)
      if (quickFilter) {
        if (quickFilter === 'unassigned') {
          if (wo.assignedVendorId) return false; // Show only unassigned
        } else {
          if (wo.status !== quickFilter) return false; // Show only matching status
        }
      }

      // Created Date Filter
      if (createdDateFilter !== 'all') {
        switch (createdDateFilter) {
          case 'last24h':
            if (!isLast24Hours(wo.createdAt)) return false;
            break;
          case 'last7d':
            if (!isLast7Days(wo.createdAt)) return false;
            break;
          case 'custom':
            if (!isInDateRange(wo.createdAt, createdDateFrom, createdDateTo)) return false;
            break;
        }
      }

      // Due Date Filter
      if (dueDateFilter !== 'all') {
        switch (dueDateFilter) {
          case 'overdue':
            if (!isOverdue(wo.dueDate, wo.status)) return false;
            break;
          case 'next3d':
            if (!wo.dueDate || !isNext3Days(wo.dueDate)) return false;
            break;
          case 'custom':
            if (!isInDateRange(wo.dueDate, dueDateFrom, dueDateTo)) return false;
            break;
        }
      }

      return true;
    });

    // Step 2: Apply sorting
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortColumn) {
        case 'id':
          comparison = a.id.localeCompare(b.id);
          break;

        case 'created':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;

        case 'priority':
          comparison = getPriorityRank(a.priority) - getPriorityRank(b.priority);
          break;

        case 'status':
          comparison = getStatusRank(a.status) - getStatusRank(b.status);
          break;

        case 'vendor': {
          // Look up vendor names (same pattern as rendering)
          const vendorA = a.assignedVendorId
            ? vendors.find(v => v.id === a.assignedVendorId)?.name || ''
            : '';
          const vendorB = b.assignedVendorId
            ? vendors.find(v => v.id === b.assignedVendorId)?.name || ''
            : '';

          // Unassigned (empty string) should always be last
          if (!vendorA && vendorB) return 1;
          if (vendorA && !vendorB) return -1;
          if (!vendorA && !vendorB) comparison = 0;
          else comparison = vendorA.localeCompare(vendorB);
          break;
        }

        case 'space': {
          // Look up space names from properties
          const propertyA = properties.find(p => p.id === a.propertyId);
          const spaceA = propertyA?.spaces.find(s => s.id === a.spaceId)?.name || '';

          const propertyB = properties.find(p => p.id === b.propertyId);
          const spaceB = propertyB?.spaces.find(s => s.id === b.spaceId)?.name || '';

          comparison = spaceA.localeCompare(spaceB);
          break;
        }
      }

      // Apply sort direction
      if (comparison !== 0) {
        return sortDirection === 'asc' ? comparison : -comparison;
      }

      // Tie-breaker 1: createdAt descending (newest first)
      const dateComparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (dateComparison !== 0) return dateComparison;

      // Tie-breaker 2: ID ascending (deterministic)
      return a.id.localeCompare(b.id);
    });

    return result;
  }, [
    workOrders,
    statusFilter,
    propertyFilter,
    cityFilter,
    stateFilter,
    priorityFilter,
    vendorFilter,
    quickFilter,
    sortColumn,
    sortDirection,
    // Date filters
    createdDateFilter,
    createdDateFrom,
    createdDateTo,
    dueDateFilter,
    dueDateFrom,
    dueDateTo
  ]);

  // Calculate metrics from filtered work orders
  const metrics = useMemo(() => {
    return {
      open: filteredAndSortedWorkOrders.filter((wo) => wo.status === 'open').length,
      inProgress: filteredAndSortedWorkOrders.filter((wo) => wo.status === 'in-progress').length,
      overdue: filteredAndSortedWorkOrders.filter((wo) => wo.status === 'overdue').length,
      completedToday: filteredAndSortedWorkOrders.filter((wo) => {
        if (wo.status !== 'completed' || !wo.completedAt) return false;
        const completed = new Date(wo.completedAt);
        const today = new Date();
        return (
          completed.getDate() === today.getDate() &&
          completed.getMonth() === today.getMonth() &&
          completed.getFullYear() === today.getFullYear()
        );
      }).length,
      unassigned: filteredAndSortedWorkOrders.filter((wo) => !wo.assignedVendorId).length,
    };
  }, [filteredAndSortedWorkOrders]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Work Orders
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          {filteredAndSortedWorkOrders.length} work order{filteredAndSortedWorkOrders.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Filters Toolbar - Single Horizontal Row */}
      <Card>
        <div className="flex flex-wrap gap-4 items-end">
          {/* Status */}
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
              className="w-full bg-neutral-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
            >
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="dispatched">Dispatched</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          {/* Property */}
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">
              Property
            </label>
            <select
              value={propertyFilter}
              onChange={(e) => setPropertyFilter(e.target.value)}
              className="w-full bg-neutral-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
            >
              <option value="all">All</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
          </div>

          {/* City */}
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">
              City
            </label>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full bg-neutral-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
            >
              <option value="all">All</option>
              {uniqueCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          {/* State */}
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">
              State
            </label>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="w-full bg-neutral-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
            >
              <option value="all">All</option>
              {uniqueStates.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">
              Priority
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as FilterPriority)}
              className="w-full bg-neutral-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
            >
              <option value="all">All</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          {/* Vendor */}
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">
              Vendor
            </label>
            <MultiSelectVendorFilter
              selectedVendorIds={vendorFilter}
              onChange={setVendorFilter}
              vendors={vendors}
              showMyVendorsToggle={currentUser.role === 'Vendor-Admin'}
              myVendorsOnly={myVendorsOnly}
              onMyVendorsToggle={setMyVendorsOnly}
              associatedVendorIds={currentUser.associatedVendorIds}
            />
          </div>

          {/* Created Date */}
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">
              Created Date
            </label>
            <DateFilterDropdown
              label="Created"
              value={createdDateFilter}
              onChange={(value) => {
                if (value === 'custom') {
                  setDateRangeModalOpen('created');
                } else {
                  setCreatedDateFilter(value as any);
                  setCreatedDateFrom('');
                  setCreatedDateTo('');
                }
              }}
              options={[
                { value: 'all', label: 'All' },
                { value: 'last24h', label: 'Last 24 hours' },
                { value: 'last7d', label: 'Last 7 days' },
                { value: 'custom', label: 'Custom range...' }
              ]}
              onCustomClick={() => setDateRangeModalOpen('created')}
              customDateRange={{ from: createdDateFrom, to: createdDateTo }}
            />
          </div>

          {/* Due Date */}
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">
              Due Date
            </label>
            <DateFilterDropdown
              label="Due"
              value={dueDateFilter}
              onChange={(value) => {
                if (value === 'custom') {
                  setDateRangeModalOpen('due');
                } else {
                  setDueDateFilter(value as any);
                  setDueDateFrom('');
                  setDueDateTo('');
                }
              }}
              options={[
                { value: 'all', label: 'All' },
                { value: 'overdue', label: 'Overdue' },
                { value: 'next3d', label: 'Next 3 days' },
                { value: 'custom', label: 'Custom range...' }
              ]}
              onCustomClick={() => setDateRangeModalOpen('due')}
              customDateRange={{ from: dueDateFrom, to: dueDateTo }}
            />
          </div>

          {/* Clear All Button */}
          {(statusFilter !== 'all' ||
            propertyFilter !== 'all' ||
            cityFilter !== 'all' ||
            stateFilter !== 'all' ||
            priorityFilter !== 'all' ||
            vendorFilter.length > 0 ||
            createdDateFilter !== 'all' ||
            dueDateFilter !== 'all') && (
            <button
              onClick={() => {
                setStatusFilter('all');
                setPropertyFilter('all');
                setCityFilter('all');
                setStateFilter('all');
                setPriorityFilter('all');
                setVendorFilter([]);
                setCreatedDateFilter('all');
                setCreatedDateFrom('');
                setCreatedDateTo('');
                setDueDateFilter('all');
                setDueDateFrom('');
                setDueDateTo('');
              }}
              className="text-sm text-[#F5C518] hover:text-[#F5C518]/80 transition-colors self-start mt-8"
            >
              Clear All ✕
            </button>
          )}
        </div>
      </Card>

      {/* Date Range Modals */}
      {dateRangeModalOpen === 'created' && (
        <DateRangeModal
          isOpen={true}
          onClose={() => setDateRangeModalOpen(null)}
          title="Select Created Date Range"
          fromDate={createdDateFrom}
          toDate={createdDateTo}
          onFromChange={setCreatedDateFrom}
          onToChange={setCreatedDateTo}
          onApply={() => {
            setCreatedDateFilter('custom');
            setDateRangeModalOpen(null);
          }}
          onClear={() => {
            setCreatedDateFilter('all');
            setCreatedDateFrom('');
            setCreatedDateTo('');
            setDateRangeModalOpen(null);
          }}
        />
      )}

      {dateRangeModalOpen === 'due' && (
        <DateRangeModal
          isOpen={true}
          onClose={() => setDateRangeModalOpen(null)}
          title="Select Due Date Range"
          fromDate={dueDateFrom}
          toDate={dueDateTo}
          onFromChange={setDueDateFrom}
          onToChange={setDueDateTo}
          onApply={() => {
            setDueDateFilter('custom');
            setDateRangeModalOpen(null);
          }}
          onClear={() => {
            setDueDateFilter('all');
            setDueDateFrom('');
            setDueDateTo('');
            setDateRangeModalOpen(null);
          }}
        />
      )}

      {/* Summary Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Open */}
        <button
          onClick={() => handleMetricClick('open')}
          className={`text-left p-4 rounded-lg border transition-all ${
            quickFilter === 'open'
              ? 'bg-gray-800 border-[#F5C518] shadow-lg shadow-[#F5C518]/20'
              : 'bg-gray-800 border-gray-700 hover:border-gray-600 hover:bg-gray-800'
          }`}
        >
          <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">
            Open
          </p>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-4xl font-semibold tracking-tighter tabular-nums text-white">
              {metrics.open}
            </p>
            <CircleDot className="w-5 h-5 text-gray-400" />
          </div>
        </button>

        {/* In Progress */}
        <button
          onClick={() => handleMetricClick('in-progress')}
          className={`text-left p-4 rounded-lg border transition-all ${
            quickFilter === 'in-progress'
              ? 'bg-gray-800 border-[#F5C518] shadow-lg shadow-[#F5C518]/20'
              : 'bg-gray-800 border-gray-700 hover:border-gray-600 hover:bg-gray-800'
          }`}
        >
          <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">
            In Progress
          </p>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-4xl font-semibold tracking-tighter tabular-nums text-white">
              {metrics.inProgress}
            </p>
            <Clock className="w-5 h-5 text-[#F5C518]" />
          </div>
        </button>

        {/* Overdue */}
        <button
          onClick={() => handleMetricClick('overdue')}
          className={`text-left p-4 rounded-lg border transition-all ${
            quickFilter === 'overdue'
              ? 'bg-gray-800 border-[#E74C3C] shadow-lg shadow-[#E74C3C]/20'
              : 'bg-gray-800 border-gray-700 hover:border-[#E74C3C]/60 hover:bg-gray-800'
          }`}
        >
          <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">
            Overdue
          </p>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-4xl font-semibold tracking-tighter tabular-nums text-[#EF4444]">
              {metrics.overdue}
            </p>
            <AlertTriangle className="w-5 h-5 text-[#EF4444]" />
          </div>
        </button>

        {/* Completed Today */}
        <button
          onClick={() => handleMetricClick('completed')}
          className={`text-left p-4 rounded-lg border transition-all ${
            quickFilter === 'completed'
              ? 'bg-gray-800 border-[#F5C518] shadow-lg shadow-[#F5C518]/20'
              : 'bg-gray-800 border-gray-700 hover:border-gray-600 hover:bg-gray-800'
          }`}
        >
          <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">
            Completed Today
          </p>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-4xl font-semibold tracking-tighter tabular-nums text-white">
              {metrics.completedToday}
            </p>
            <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
          </div>
        </button>

        {/* Unassigned */}
        <button
          onClick={() => handleMetricClick('unassigned')}
          className={`text-left p-4 rounded-lg border transition-all ${
            quickFilter === 'unassigned'
              ? 'bg-gray-800 border-[#F5C518] shadow-lg shadow-[#F5C518]/20'
              : 'bg-gray-800 border-gray-700 hover:border-gray-600 hover:bg-gray-800'
          }`}
        >
          <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">
            Unassigned
          </p>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-4xl font-semibold tracking-tighter tabular-nums text-white">
              {metrics.unassigned}
            </p>
            <UserX className="w-5 h-5 text-gray-400" />
          </div>
        </button>
      </div>

      {/* Work Orders Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700/50">
                <th
                  onClick={() => handleSort('id')}
                  className="text-left pb-3 text-sm font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                >
                  ID{getSortIndicator('id')}
                </th>
                <th className="text-left pb-3 text-sm font-medium text-gray-400 uppercase tracking-wider">
                  Description
                </th>
                <th
                  onClick={() => handleSort('space')}
                  className="text-left pb-3 text-sm font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                >
                  Space{getSortIndicator('space')}
                </th>
                <th
                  onClick={() => handleSort('priority')}
                  className="text-left pb-3 text-sm font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                >
                  Priority{getSortIndicator('priority')}
                </th>
                <th
                  onClick={() => handleSort('status')}
                  className="text-left pb-3 text-sm font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                >
                  Status{getSortIndicator('status')}
                </th>
                <th
                  onClick={() => handleSort('vendor')}
                  className="text-left pb-3 text-sm font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                >
                  Vendor{getSortIndicator('vendor')}
                </th>
                <th
                  onClick={() => handleSort('created')}
                  className="text-left pb-3 text-sm font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                >
                  Created{getSortIndicator('created')}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedWorkOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="pt-4 text-base text-gray-400 text-center">
                    No work orders found.
                  </td>
                </tr>
              ) : (
                filteredAndSortedWorkOrders.map((wo) => {
                  const property = properties.find((p) => p.id === wo.propertyId);
                  const space = property?.spaces.find((s) => s.id === wo.spaceId);
                  const vendor = wo.assignedVendorId
                    ? vendors.find((v) => v.id === wo.assignedVendorId)
                    : undefined;

                  return (
                    <tr
                      key={wo.id}
                      className="border-b border-gray-700/50 last:border-0 hover:bg-gray-800 transition-colors"
                    >
                      <td className="py-6">
                        <Link
                          href={`/work-orders/${wo.id}`}
                          className="text-base font-medium text-[#F5C518] hover:text-[#F5C518]/80 transition-colors"
                        >
                          {wo.id}
                        </Link>
                      </td>
                      <td className="py-6">
                        <p className="text-base text-white truncate max-w-xs">
                          {wo.title || wo.description.slice(0, 60)}
                          {wo.description.length > 60 && '...'}
                        </p>
                      </td>
                      <td className="py-6">
                        <p className="text-base text-white">
                          {space?.name}
                        </p>
                      </td>
                      <td className="py-6">
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
                      <td className="py-6">
                        <Badge variant={wo.status}>{wo.status}</Badge>
                      </td>
                      <td className="py-6">
                        <p className="text-base text-white">
                          {vendor ? vendor.name : '—'}
                        </p>
                      </td>
                      <td className="py-6">
                        <p className="text-base text-gray-400">
                          {formatRelativeAgo(wo.createdAt)}
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

export default function WorkOrdersPage() {
  return (
    <Suspense fallback={null}>
      <WorkOrdersContent />
    </Suspense>
  );
}
