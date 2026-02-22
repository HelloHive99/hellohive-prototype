'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Wrench, Zap, Sparkles, Shield, Monitor, Star } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useUser } from '@/context/UserContext';
import { VendorModal } from '@/components/vendors/VendorModal';
import { cn } from '@/lib/utils';
import type { VendorCategory, VendorStatus, VendorPriorityTier } from '@/data/seed-data';

// ── Types ─────────────────────────────────────────────────────────────────────

type FilterCategory = 'all' | VendorCategory;
type FilterStatus = 'all' | VendorStatus;
type FilterPriorityTier = 'all' | VendorPriorityTier;
type SortColumn =
  | 'name'
  | 'category'
  | 'status'
  | 'sla'
  | 'response'
  | 'resolution'
  | 'activeJobs'
  | 'rating';
type SortDirection = 'asc' | 'desc';

// ── Static maps ───────────────────────────────────────────────────────────────

const CATEGORY_ICON: Record<VendorCategory, React.ComponentType<{ className?: string }>> = {
  MEP: Wrench,
  Electrical: Zap,
  Janitorial: Sparkles,
  Security: Shield,
  'AV/Broadcast': Monitor,
};

const CATEGORY_COLOR: Record<VendorCategory, string> = {
  MEP: '#6366f1',
  Electrical: '#F5C518',
  Janitorial: '#2ECC71',
  Security: '#ef4444',
  'AV/Broadcast': '#8b5cf6',
};

const STATUS_DOT: Record<VendorStatus, string> = {
  available: '#2ECC71',
  limited: '#F5C518',
  unavailable: '#E74C3C',
};

const STATUS_LABEL: Record<VendorStatus, string> = {
  available: 'Available',
  limited: 'Limited',
  unavailable: 'Unavailable',
};

// SLA dot: green ≥95%, yellow 90–94.9%, red <90%
const slaDotColor = (pct: number) =>
  pct >= 95 ? '#2ECC71' : pct >= 90 ? '#F5C518' : '#E74C3C';

// ── Sub-components ────────────────────────────────────────────────────────────

function CategoryPill({ category }: { category: VendorCategory }) {
  const Icon = CATEGORY_ICON[category];
  const color = CATEGORY_COLOR[category];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap"
      style={{
        backgroundColor: `${color}18`,
        color,
        border: `1px solid ${color}30`,
      }}
    >
      <Icon className="w-3 h-3 shrink-0" />
      {category}
    </span>
  );
}

function StatusPill({ status }: { status: VendorStatus }) {
  const dot = STATUS_DOT[status];
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-white whitespace-nowrap">
      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: dot }} />
      {STATUS_LABEL[status]}
    </span>
  );
}

function InlineBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-sm font-mono tabular-nums text-white w-14 text-right shrink-0">
        {value.toFixed(1)} hrs
      </span>
      <div className="w-20 h-1.5 bg-neutral-800 rounded-full overflow-hidden shrink-0">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function VendorsPage() {
  const { getAllVendors, hasPermission } = useUser();
  const vendors = getAllVendors();

  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>('all');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<FilterPriorityTier>('all');
  const [sortColumn, setSortColumn] = useState<SortColumn>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);

  const canManage = hasPermission('manageVendors');
  const categories: VendorCategory[] = ['MEP', 'Electrical', 'Janitorial', 'Security', 'AV/Broadcast'];

  // ── Filter + sort ──────────────────────────────────────────────────────────
  const filteredVendors = useMemo(() => {
    let result = vendors.filter((v) => {
      if (categoryFilter !== 'all' && v.category !== categoryFilter) return false;
      if (statusFilter !== 'all' && v.operationalStatus.currentStatus !== statusFilter) return false;
      if (priorityFilter !== 'all' && v.operationalStatus.priorityTier !== priorityFilter) return false;
      return true;
    });

    const STATUS_RANK: Record<VendorStatus, number> = { available: 0, limited: 1, unavailable: 2 };

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortColumn) {
        case 'name':     cmp = a.name.localeCompare(b.name); break;
        case 'category': cmp = a.category.localeCompare(b.category); break;
        case 'status':   cmp = STATUS_RANK[a.operationalStatus.currentStatus] - STATUS_RANK[b.operationalStatus.currentStatus]; break;
        case 'sla':      cmp = a.slaCompliance - b.slaCompliance; break;
        case 'response': cmp = a.avgResponseTime - b.avgResponseTime; break;
        case 'resolution': cmp = a.performance.avgResolutionTime - b.performance.avgResolutionTime; break;
        case 'activeJobs': cmp = a.operationalStatus.activeWorkOrdersCount - b.operationalStatus.activeWorkOrdersCount; break;
        case 'rating':   cmp = a.performance.internalRating - b.performance.internalRating; break;
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [vendors, categoryFilter, statusFilter, priorityFilter, sortColumn, sortDirection]);

  // Bar normalization ceilings
  const maxResponse   = Math.max(...filteredVendors.map((v) => v.avgResponseTime), 1);
  const maxResolution = Math.max(...filteredVendors.map((v) => v.performance.avgResolutionTime), 1);

  // ── Sort handler + header helper ───────────────────────────────────────────
  const handleSort = (col: SortColumn) => {
    if (sortColumn === col) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(col);
      setSortDirection(col === 'name' || col === 'category' ? 'asc' : 'desc');
    }
  };

  const ColHeader = ({
    col,
    label,
    className,
    iconLeft = false,
  }: {
    col: SortColumn;
    label: string;
    className?: string;
    iconLeft?: boolean;
  }) => {
    const active = sortColumn === col;
    const icon = (
      <span
        className={cn(
          'transition-opacity text-xs',
          active ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'
        )}
      >
        {active ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
      </span>
    );
    return (
      <th
        onClick={() => handleSort(col)}
        className={cn(
          'pb-3 text-xs font-medium uppercase tracking-wider cursor-pointer select-none whitespace-nowrap transition-colors group',
          'text-left',
          active ? 'text-white' : 'text-gray-500 hover:text-gray-300',
          className
        )}
      >
        <span className="flex items-center gap-1">
          {iconLeft && icon}
          {label}
          {!iconLeft && icon}
        </span>
      </th>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Vendors</h1>
          <p className="text-sm text-gray-400 mt-1">
            {filteredVendors.length} vendor{filteredVendors.length !== 1 ? 's' : ''}
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setShowAddVendorModal(true)}>+ Add Vendor</Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as FilterCategory)}
              className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
            >
              <option value="all">All</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
              className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
            >
              <option value="all">All</option>
              <option value="available">Available</option>
              <option value="limited">Limited</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
              Priority Tier
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as FilterPriorityTier)}
              className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
            >
              <option value="all">All</option>
              <option value="platinum">Platinum</option>
              <option value="gold">Gold</option>
              <option value="standard">Standard</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Table */}
      <div className="bg-neutral-900 border border-slate-800/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800/60">
                <ColHeader col="name"       label="Name"            className="pl-6 pr-4 pt-4 w-48" />
                <ColHeader col="category"   label="Category"        className="px-4 pt-4" />
                <ColHeader col="status"     label="Status"          className="px-4 pt-4" />
                <ColHeader col="sla"        label="SLA Compliance"  className="px-4 pt-4" />
                <th className="pb-3 pt-4 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Trend (7d)
                </th>
                <ColHeader col="response"   label="Response Time"   className="px-4 pt-4" />
                <ColHeader col="resolution" label="Resolution Time"  className="px-4 pt-4" />
                <ColHeader col="activeJobs" label="Active Jobs"      className="pl-4 pr-6 pt-4 text-right w-px" iconLeft />
                <ColHeader col="rating"     label="Rating"           className="pl-4 pr-6 pt-4" />
              </tr>
            </thead>
            <tbody>
              {filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-sm text-gray-500 text-center">
                    No vendors match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredVendors.map((vendor) => (
                  <tr
                    key={vendor.id}
                    className="border-b border-slate-800/30 last:border-0 hover:bg-white/[0.025] transition-colors"
                  >
                    {/* Name */}
                    <td className="pl-6 pr-4 py-5">
                      <Link
                        href={`/vendors/${vendor.id}`}
                        className="text-sm font-medium text-[#F5C518] hover:text-[#F5C518]/80 transition-colors truncate block max-w-[180px]"
                      >
                        {vendor.name}
                      </Link>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-5">
                      <CategoryPill category={vendor.category} />
                    </td>

                    {/* Status */}
                    <td className="px-4 py-5">
                      <StatusPill status={vendor.operationalStatus.currentStatus} />
                    </td>

                    {/* SLA Compliance */}
                    <td className="px-4 py-5">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: slaDotColor(vendor.slaCompliance) }}
                        />
                        <span className="text-sm font-mono tabular-nums text-white">
                          {vendor.slaCompliance.toFixed(1)}%
                        </span>
                      </div>
                    </td>

                    {/* Trend (7d) — placeholder */}
                    <td className="px-4 py-5">
                      <span className="text-gray-700 text-sm select-none">—</span>
                    </td>

                    {/* Response Time */}
                    <td className="px-4 py-5">
                      <InlineBar
                        value={vendor.avgResponseTime}
                        max={maxResponse}
                        color="#6366f1"
                      />
                    </td>

                    {/* Resolution Time */}
                    <td className="px-4 py-5">
                      <InlineBar
                        value={vendor.performance.avgResolutionTime}
                        max={maxResolution}
                        color="#F5C518"
                      />
                    </td>

                    {/* Active Jobs */}
                    <td className="pl-4 pr-6 py-5 text-right w-px">
                      <Link
                        href={`/work-orders?vendorId=${vendor.id}`}
                        className="text-sm tabular-nums text-gray-400 hover:text-[#F5C518] transition-colors"
                      >
                        {vendor.operationalStatus.activeWorkOrdersCount}
                      </Link>
                    </td>

                    {/* Rating */}
                    <td className="pl-4 pr-6 py-5">
                      <div className="flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-[#F5C518] fill-[#F5C518] shrink-0" />
                        <span className="text-sm font-mono tabular-nums text-white">
                          {vendor.performance.internalRating.toFixed(1)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer legend */}
        <div className="px-6 py-3 border-t border-slate-800/50 flex items-center gap-5 flex-wrap">
          <span className="text-xs text-gray-600 uppercase tracking-wider font-medium">SLA:</span>
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-2 h-2 rounded-full bg-[#2ECC71] shrink-0" /> ≥ 95%
          </span>
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-2 h-2 rounded-full bg-[#F5C518] shrink-0" /> 90–94%
          </span>
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-2 h-2 rounded-full bg-[#E74C3C] shrink-0" /> &lt; 90%
          </span>
          <span className="ml-auto text-xs text-gray-600">
            Bars normalized to dataset max
          </span>
        </div>
      </div>

      {/* Add Vendor Modal */}
      {showAddVendorModal && (
        <VendorModal
          isOpen={showAddVendorModal}
          onClose={() => setShowAddVendorModal(false)}
        />
      )}
    </div>
  );
}
