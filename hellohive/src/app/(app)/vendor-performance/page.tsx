'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { useUser } from '@/context/UserContext';
import { cn } from '@/lib/utils';
import type { WorkOrder } from '@/data/seed-data';

// ── Types ─────────────────────────────────────────────────────────────────────

type SortCol = 'name' | 'slaCompliance' | 'avgResponseTime' | 'avgResolutionTime' | 'totalWOs';
type SortDir = 'asc' | 'desc';

// ── Helpers ───────────────────────────────────────────────────────────────────

const isOnTime = (wo: WorkOrder) =>
  !wo.dueDate || new Date(wo.completedAt!) <= new Date(wo.dueDate);

// Green ≥95%, yellow 90–94.9%, red <90%
const slaDotColor = (pct: number) =>
  pct >= 95 ? '#2ECC71' : pct >= 90 ? '#F5C518' : '#E74C3C';

// ── SVG Sparkline ─────────────────────────────────────────────────────────────

function Sparkline({ data }: { data: (number | null)[] }) {
  const W = 80;
  const H = 28;
  const pad = 3;

  const valid = data.filter((v): v is number => v !== null);

  if (valid.length === 0) {
    return <span className="text-xs text-gray-700 italic">no data</span>;
  }

  const min = Math.min(...valid);
  const max = Math.max(...valid);
  const yRange = max - min || 1;

  // Build separate path segments so gaps between null days don't draw a line
  const segments: string[] = [];
  let seg = '';

  data.forEach((v, i) => {
    const x = pad + (i / (data.length - 1)) * (W - pad * 2);
    if (v !== null) {
      const y = H - pad - ((v - min) / yRange) * (H - pad * 2);
      seg += seg ? ` L ${x.toFixed(1)} ${y.toFixed(1)}` : `M ${x.toFixed(1)} ${y.toFixed(1)}`;
    } else {
      if (seg) { segments.push(seg); seg = ''; }
    }
  });
  if (seg) segments.push(seg);

  // Dot for last non-null value
  let dotX = 0, dotY = H / 2;
  for (let i = data.length - 1; i >= 0; i--) {
    if (data[i] !== null) {
      dotX = pad + (i / (data.length - 1)) * (W - pad * 2);
      dotY = H - pad - ((data[i]! - min) / yRange) * (H - pad * 2);
      break;
    }
  }

  return (
    <svg width={W} height={H} className="overflow-visible">
      {segments.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke="#F5C518"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      <circle cx={dotX} cy={dotY} r={2.5} fill="#F5C518" />
    </svg>
  );
}

// ── Inline Bar ────────────────────────────────────────────────────────────────

function InlineBar({
  value,
  max,
  color,
}: {
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-sm font-mono tabular-nums text-white w-12 text-right shrink-0">
        {value.toFixed(1)}h
      </span>
      <div className="w-24 h-1.5 bg-neutral-800 rounded-full overflow-hidden shrink-0">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function VendorPerformancePage() {
  const router = useRouter();
  const { getAllWorkOrders, getAllVendors } = useUser();

  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [selectedVendorId, setSelectedVendorId] = useState<string>('all');
  const [sortCol, setSortCol] = useState<SortCol>('slaCompliance');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const allWOs = getAllWorkOrders();
  const vendors = getAllVendors();

  // ── Row data ────────────────────────────────────────────────────────────────
  const rows = useMemo(() => {
    const rangeMs = { '7d': 7, '30d': 30, '90d': 90 }[dateRange] * 86_400_000;
    const rangeStart = new Date(Date.now() - rangeMs);
    const filteredWOs = allWOs.filter((wo) => new Date(wo.createdAt) >= rangeStart);

    return vendors
      .filter((v) => selectedVendorId === 'all' || v.id === selectedVendorId)
      .map((vendor) => {
        const vWOs = filteredWOs.filter((wo) => wo.assignedVendorId === vendor.id);
        const completed = vWOs.filter((wo) => wo.status === 'closed' && wo.completedAt);

        // SLA compliance
        const onTime = completed.filter(isOnTime);
        const slaCompliance =
          completed.length > 0
            ? (onTime.length / completed.length) * 100
            : vendor.slaCompliance;

        // Avg response time (dispatch lag in hours)
        const responseTimes = vWOs
          .filter((wo) => wo.dispatchedAt)
          .map(
            (wo) =>
              (new Date(wo.dispatchedAt!).getTime() - new Date(wo.createdAt).getTime()) /
              3_600_000
          );
        const avgResponseTime =
          responseTimes.length > 0
            ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
            : vendor.avgResponseTime;

        // Avg resolution time (completion span in hours)
        const resTimes = completed.map(
          (wo) =>
            (new Date(wo.completedAt!).getTime() - new Date(wo.createdAt).getTime()) /
            3_600_000
        );
        const avgResolutionTime =
          resTimes.length > 0
            ? resTimes.reduce((a, b) => a + b, 0) / resTimes.length
            : vendor.performance.avgResolutionTime;

        // 7-day SLA sparkline — always the trailing 7 days, per-vendor, from all WOs
        const allVendorCompleted = allWOs.filter(
          (wo) => wo.assignedVendorId === vendor.id && wo.completedAt
        );
        const spark7d = Array.from({ length: 7 }, (_, i) => {
          const dayStart = startOfDay(subDays(new Date(), 6 - i));
          const dayEnd = endOfDay(dayStart);
          const dayWOs = allVendorCompleted.filter((wo) => {
            const d = new Date(wo.completedAt!);
            return d >= dayStart && d <= dayEnd;
          });
          return dayWOs.length > 0
            ? (dayWOs.filter(isOnTime).length / dayWOs.length) * 100
            : null;
        });

        return {
          id: vendor.id,
          name: vendor.name,
          slaCompliance: Math.round(slaCompliance * 10) / 10,
          avgResponseTime: Math.round(avgResponseTime * 10) / 10,
          avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
          totalWOs: vWOs.length,
          spark7d,
        };
      })
      .filter((v) => v.totalWOs > 0);
  }, [allWOs, vendors, selectedVendorId, dateRange]);

  // Normalization ceilings for inline bars
  const maxResponseTime = Math.max(...rows.map((r) => r.avgResponseTime), 1);
  const maxResolutionTime = Math.max(...rows.map((r) => r.avgResolutionTime), 1);

  // ── Sorting ─────────────────────────────────────────────────────────────────
  const handleSort = (col: SortCol) => {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir(col === 'name' ? 'asc' : 'desc');
    }
  };

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const cmp =
        sortCol === 'name'
          ? a.name.localeCompare(b.name)
          : (a[sortCol] as number) - (b[sortCol] as number);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [rows, sortCol, sortDir]);

  // ── Column header helper ─────────────────────────────────────────────────────
  const ColHeader = ({
    col,
    label,
    className,
    iconLeft = false,
  }: {
    col: SortCol;
    label: string;
    className?: string;
    iconLeft?: boolean;
  }) => {
    const active = sortCol === col;
    const icon = (
      <span
        className={cn(
          'transition-opacity',
          active ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'
        )}
      >
        {active ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
      </span>
    );
    return (
      <th
        onClick={() => handleSort(col)}
        className={cn(
          'text-left text-xs font-medium uppercase tracking-wider cursor-pointer select-none transition-colors group whitespace-nowrap pb-3 pt-4',
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

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      {/* Header + Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Vendor Performance
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            SLA compliance, response times, and work order volume by vendor
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Date range */}
          <div className="flex items-center gap-1 bg-neutral-800 rounded-lg p-1">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                  dateRange === range
                    ? 'bg-[#F5C518]/10 text-[#F5C518]'
                    : 'text-gray-400 hover:text-white'
                )}
              >
                {range}
              </button>
            ))}
          </div>

          {/* Vendor filter */}
          <select
            value={selectedVendorId}
            onChange={(e) => setSelectedVendorId(e.target.value)}
            className="bg-neutral-800 text-white text-xs px-3 py-1.5 rounded-md border border-slate-700 focus:outline-none"
          >
            <option value="all">All Vendors</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {sortedRows.length === 0 ? (
        <div className="bg-neutral-900 border border-slate-800/50 rounded-xl p-12 text-center">
          <p className="text-gray-400 text-sm">
            No work orders found for the selected vendor and time range.
          </p>
        </div>
      ) : (
        <div className="bg-neutral-900 border border-slate-800/50 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800/60">
                  <ColHeader col="name" label="Vendor" className="pl-6 pr-4 w-56" />
                  <ColHeader col="slaCompliance" label="SLA Compliance" className="px-4" />
                  <th className="text-left pb-3 pt-4 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Trend (7d)
                  </th>
                  <ColHeader col="avgResponseTime" label="Avg Response" className="px-4" />
                  <ColHeader col="avgResolutionTime" label="Avg Resolution" className="px-4" />
                  <ColHeader col="totalWOs" label="WOs" className="pl-4 pr-6 text-right w-px" iconLeft />
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => router.push(`/vendors/${row.id}`)}
                    className="border-b border-slate-800/30 last:border-0 hover:bg-white/[0.025] transition-colors cursor-pointer"
                  >
                    {/* Vendor name */}
                    <td className="pl-6 pr-4 py-4">
                      <span className="text-sm font-medium text-white group-hover:text-[#F5C518]">
                        {row.name}
                      </span>
                    </td>

                    {/* SLA Compliance */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: slaDotColor(row.slaCompliance) }}
                        />
                        <span className="text-sm font-mono tabular-nums text-white">
                          {row.slaCompliance.toFixed(1)}%
                        </span>
                      </div>
                    </td>

                    {/* 7-day sparkline */}
                    <td className="px-4 py-4">
                      <Sparkline data={row.spark7d} />
                    </td>

                    {/* Avg Response Time */}
                    <td className="px-4 py-4">
                      <InlineBar
                        value={row.avgResponseTime}
                        max={maxResponseTime}
                        color="#6366f1"
                      />
                    </td>

                    {/* Avg Resolution Time */}
                    <td className="px-4 py-4">
                      <InlineBar
                        value={row.avgResolutionTime}
                        max={maxResolutionTime}
                        color="#F5C518"
                      />
                    </td>

                    {/* WO Count */}
                    <td className="pl-4 pr-6 py-4 text-right w-px">
                      <span className="text-sm tabular-nums text-gray-400">
                        {row.totalWOs}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend footer */}
          <div className="px-6 py-3 border-t border-slate-800/50 flex items-center gap-5 flex-wrap">
            <span className="text-xs text-gray-600 uppercase tracking-wider font-medium">SLA dot:</span>
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
              Bars normalized to dataset max · Click row to view vendor detail
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
