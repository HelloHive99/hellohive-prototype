'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { useUser } from '@/context/UserContext';
import { formatDuration } from '@/lib/date-utils';
import type { TechnicianStatus } from '@/data/seed-data';

// ── Status helpers ────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<TechnicianStatus, string> = {
  available: '#2ECC71',
  'on-job': '#F5C518',
  'off-shift': '#6b7280',
  unavailable: '#E74C3C',
};

const STATUS_LABEL: Record<TechnicianStatus, string> = {
  available: 'Available',
  'on-job': 'On Job',
  'off-shift': 'Off Shift',
  unavailable: 'Unavailable',
};

type StatusFilter = 'all' | TechnicianStatus;

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'available', label: 'Available' },
  { value: 'on-job', label: 'On Job' },
  { value: 'off-shift', label: 'Off Shift' },
  { value: 'unavailable', label: 'Unavailable' },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TechniciansPage() {
  const { getAllTechnicians, getAllWorkOrders, getAllVendors, updateTechnician } = useUser();

  const techs = getAllTechnicians();
  const allWOs = getAllWorkOrders();
  const vendors = getAllVendors();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Force re-render every minute to keep live durations fresh
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const todayStart = startOfDay(new Date());

  const rows = useMemo(() => {
    return techs.map((tech) => {
      const vendor = vendors.find((v) => v.id === tech.vendorId);
      const currentWO = allWOs.find(
        (wo) =>
          wo.assignedTechnicianId === tech.id &&
          ['in-progress', 'dispatched'].includes(wo.status)
      );
      const todayJobs = allWOs.filter(
        (wo) =>
          wo.assignedTechnicianId === tech.id &&
          wo.completedAt &&
          new Date(wo.completedAt) >= todayStart
      ).length;
      return { tech, vendor, currentWO, todayJobs };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [techs, vendors, allWOs]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesStatus =
        statusFilter === 'all' || row.tech.currentStatus === statusFilter;
      const matchesSearch =
        !search ||
        row.tech.fullName.toLowerCase().includes(search.toLowerCase()) ||
        (row.vendor?.name ?? '').toLowerCase().includes(search.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [rows, statusFilter, search]);

  const handleToggleAvailability = (techId: string, current: TechnicianStatus) => {
    const next: TechnicianStatus =
      current === 'available' ? 'unavailable' : 'available';
    updateTechnician(techId, { currentStatus: next });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Technicians</h1>
        <p className="text-sm text-gray-400 mt-1">
          {filteredRows.length} of {rows.length} technicians
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <input
          type="text"
          placeholder="Search name or vendor…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-neutral-800 text-white text-sm px-3 py-1.5 rounded-md border border-slate-700 focus:outline-none placeholder:text-gray-600 w-52"
        />

        {/* Status pills */}
        <div className="flex items-center gap-1 bg-neutral-800 rounded-lg p-1">
          {STATUS_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={cn(
                'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                statusFilter === value
                  ? 'bg-[#F5C518]/10 text-[#F5C518]'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filteredRows.length === 0 ? (
        <div className="bg-neutral-900 border border-slate-800/50 rounded-xl p-12 text-center">
          <p className="text-gray-400 text-sm">No technicians match the current filters.</p>
        </div>
      ) : (
        <div className="bg-neutral-900 border border-slate-800/50 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800/60">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pl-6 pr-4 pb-3 pt-4 whitespace-nowrap">
                    Name
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 pb-3 pt-4 whitespace-nowrap">
                    Vendor
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 pb-3 pt-4 whitespace-nowrap">
                    Status
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 pb-3 pt-4 whitespace-nowrap">
                    Current Job
                  </th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-4 pb-3 pt-4 whitespace-nowrap w-px">
                    Today
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 pb-3 pt-4 whitespace-nowrap">
                    Avg Response
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pl-4 pr-6 pb-3 pt-4 whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map(({ tech, vendor, currentWO, todayJobs }) => {
                  const canToggle =
                    tech.currentStatus === 'available' || tech.currentStatus === 'unavailable';

                  return (
                    <tr
                      key={tech.id}
                      className="border-b border-slate-800/30 last:border-0 hover:bg-white/[0.025] transition-colors"
                    >
                      {/* Name */}
                      <td className="pl-6 pr-4 py-4">
                        <p className="text-sm font-medium text-white">{tech.fullName}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{tech.roleTitle}</p>
                      </td>

                      {/* Vendor */}
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-300">{vendor?.name ?? '—'}</span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: STATUS_COLOR[tech.currentStatus] }}
                          />
                          <span className="text-sm text-gray-300">
                            {STATUS_LABEL[tech.currentStatus]}
                          </span>
                        </div>
                      </td>

                      {/* Current Job */}
                      <td className="px-4 py-4">
                        {currentWO ? (
                          <div>
                            <Link
                              href={`/work-orders/${currentWO.id}`}
                              className="text-sm font-medium text-[#F5C518] hover:text-[#F5C518]/80 transition-colors"
                            >
                              {currentWO.id}
                            </Link>
                            {currentWO.startedAt && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                for {formatDuration(currentWO.startedAt)}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-600">—</span>
                        )}
                      </td>

                      {/* Jobs Today */}
                      <td className="px-4 py-4 text-right w-px">
                        <span className="text-sm tabular-nums text-gray-400">{todayJobs}</span>
                      </td>

                      {/* Avg Response */}
                      <td className="px-4 py-4">
                        <span className="text-sm font-mono tabular-nums text-gray-300">
                          {tech.avgResponseTime.toFixed(1)}h
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="pl-4 pr-6 py-4">
                        {canToggle && (
                          <button
                            onClick={() =>
                              handleToggleAvailability(tech.id, tech.currentStatus)
                            }
                            className={cn(
                              'text-xs font-medium px-2.5 py-1 rounded-md border transition-colors',
                              tech.currentStatus === 'available'
                                ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                                : 'border-green-500/30 text-green-400 hover:bg-green-500/10'
                            )}
                          >
                            {tech.currentStatus === 'available'
                              ? 'Mark Unavailable'
                              : 'Mark Available'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
