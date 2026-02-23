'use client';

import { useMemo, useState } from 'react';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUser } from '@/context/UserContext';
import { isWorkOrderOverdue } from '@/lib/workorder-compute';
import type { WorkOrder } from '@/data/seed-data';

// ── Helpers ───────────────────────────────────────────────────────────────────

const isOnTime = (wo: WorkOrder) =>
  !wo.dueDate || new Date(wo.completedAt!) <= new Date(wo.dueDate);

const TOOLTIP_STYLE = {
  backgroundColor: '#171717',
  border: '1px solid #374151',
  borderRadius: 8,
  fontSize: 12,
  color: '#e5e7eb',
};

const VENDOR_CATEGORIES = ['MEP', 'Electrical', 'Janitorial', 'Security', 'AV/Broadcast'] as const;

// ── Bucket builder ────────────────────────────────────────────────────────────

type Bucket = { label: string; start: Date; end: Date };

function buildBuckets(dateRange: '7d' | '30d' | '90d'): Bucket[] {
  if (dateRange === '7d') {
    return Array.from({ length: 7 }, (_, i) => {
      const day = subDays(new Date(), 6 - i);
      return { label: format(day, 'EEE'), start: startOfDay(day), end: endOfDay(day) };
    });
  }
  const total = dateRange === '30d' ? 8 : 12;
  return Array.from({ length: total }, (_, i) => {
    const wkStart = startOfDay(subDays(new Date(), (total - 1 - i) * 7));
    const wkEnd = endOfDay(subDays(new Date(), Math.max((total - 2 - i) * 7, 0)));
    return { label: format(wkStart, 'MM/dd'), start: wkStart, end: wkEnd };
  });
}

// ── KPI sub-components ────────────────────────────────────────────────────────

function DeltaChip({
  delta,
  higherIsBetter,
  unit = '',
}: {
  delta: number | null | undefined;
  higherIsBetter: boolean | null;
  unit?: string;
}) {
  if (delta == null) return null;
  const abs = Math.abs(delta);
  const isPositive = delta > 0;
  const isGood =
    higherIsBetter === null ? null : isPositive ? higherIsBetter : !higherIsBetter;
  const color =
    isGood === null ? 'text-gray-500' : isGood ? 'text-green-400' : 'text-red-400';
  const Icon = isPositive ? ArrowUp : ArrowDown;
  return (
    <span className={`flex items-center gap-0.5 text-[11px] font-medium ${color}`}>
      <Icon className="w-3 h-3" />
      {abs.toFixed(1)}{unit}
    </span>
  );
}

function KpiCard({
  label,
  value,
  delta,
  higherIsBetter,
  unit = '',
}: {
  label: string;
  value: string;
  delta?: number | null;
  higherIsBetter?: boolean | null;
  unit?: string;
}) {
  return (
    <div className="bg-neutral-900 border border-slate-800/50 rounded-xl p-4 flex flex-col gap-1 min-w-0">
      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest truncate">
        {label}
      </p>
      <p className="text-2xl font-bold text-white tabular-nums leading-none">{value}</p>
      {delta != null ? (
        <DeltaChip delta={delta} higherIsBetter={higherIsBetter ?? null} unit={unit} />
      ) : (
        <span className="h-4" />
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { getAllWorkOrders, getAllTechnicians, getAllProperties } = useUser();
  const router = useRouter();

  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [facilityFilter, setFacilityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const allWOs = getAllWorkOrders();
  const allTechs = getAllTechnicians();
  const allProperties = getAllProperties();

  // ── Filtered base ──────────────────────────────────────────────────────────
  const filteredWOs = useMemo(() => {
    return allWOs.filter((wo) => {
      if (facilityFilter !== 'all' && wo.propertyId !== facilityFilter) return false;
      if (categoryFilter !== 'all' && wo.category !== categoryFilter) return false;
      return true;
    });
  }, [allWOs, facilityFilter, categoryFilter]);

  const buckets = useMemo(() => buildBuckets(dateRange), [dateRange]);

  // ── KPI Snapshot ───────────────────────────────────────────────────────────
  const kpiData = useMemo(() => {
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    const now = new Date();
    const curStart = startOfDay(subDays(now, days));
    const prevStart = startOfDay(subDays(now, days * 2));
    const prevEnd = endOfDay(subDays(now, days + 1));

    const curWOs = filteredWOs.filter((wo) => new Date(wo.createdAt) >= curStart);
    const prevWOs = filteredWOs.filter(
      (wo) =>
        new Date(wo.createdAt) >= prevStart && new Date(wo.createdAt) <= prevEnd
    );

    const computeSla = (wos: WorkOrder[]) => {
      const c = wos.filter((wo) => wo.completedAt && wo.dueDate);
      return c.length > 0 ? (c.filter(isOnTime).length / c.length) * 100 : null;
    };
    const computeAvgResponse = (wos: WorkOrder[]) => {
      const d = wos.filter((wo) => wo.dispatchedAt);
      return d.length > 0
        ? d.reduce(
            (s, wo) =>
              s +
              (new Date(wo.dispatchedAt!).getTime() - new Date(wo.createdAt).getTime()) /
                3_600_000,
            0
          ) / d.length
        : null;
    };
    const computeAvgResolution = (wos: WorkOrder[]) => {
      const c = wos.filter((wo) => wo.completedAt);
      return c.length > 0
        ? c.reduce(
            (s, wo) =>
              s +
              (new Date(wo.completedAt!).getTime() - new Date(wo.createdAt).getTime()) /
                3_600_000,
            0
          ) / c.length
        : null;
    };

    const curSla = computeSla(curWOs);
    const prevSla = computeSla(prevWOs);
    const curResponse = computeAvgResponse(curWOs);
    const prevResponse = computeAvgResponse(prevWOs);
    const curResolution = computeAvgResolution(curWOs);
    const prevResolution = computeAvgResolution(prevWOs);

    return {
      sla: {
        value: curSla,
        delta: curSla != null && prevSla != null ? curSla - prevSla : null,
        higherIsBetter: true as const,
      },
      response: {
        value: curResponse,
        delta:
          curResponse != null && prevResponse != null ? curResponse - prevResponse : null,
        higherIsBetter: false as const,
      },
      resolution: {
        value: curResolution,
        delta:
          curResolution != null && prevResolution != null
            ? curResolution - prevResolution
            : null,
        higherIsBetter: false as const,
      },
      overdue: { value: filteredWOs.filter((wo) => isWorkOrderOverdue(wo)).length },
      volume: {
        value: curWOs.length,
        delta: prevWOs.length > 0 ? curWOs.length - prevWOs.length : null,
        higherIsBetter: null as null,
      },
    };
  }, [filteredWOs, dateRange]);

  // ── Chart 1: SLA Compliance Trend ─────────────────────────────────────────
  const slaData = useMemo(
    () =>
      buckets.map((b) => {
        const completed = filteredWOs.filter(
          (wo) =>
            wo.completedAt &&
            new Date(wo.completedAt) >= b.start &&
            new Date(wo.completedAt) <= b.end
        );
        return {
          label: b.label,
          compliance:
            completed.length > 0
              ? Math.round((completed.filter(isOnTime).length / completed.length) * 100 * 10) / 10
              : null,
        };
      }),
    [filteredWOs, buckets]
  );

  // ── Chart 2: WO Volume by status ──────────────────────────────────────────
  const volumeData = useMemo(
    () =>
      buckets.map((b) => {
        const inBucket = filteredWOs.filter(
          (wo) =>
            new Date(wo.createdAt) >= b.start && new Date(wo.createdAt) <= b.end
        );
        return {
          label: b.label,
          completed: inBucket.filter((wo) => wo.status === 'closed').length,
          'in-progress': inBucket.filter((wo) =>
            ['in-progress', 'dispatched'].includes(wo.status)
          ).length,
          'pending-approval': inBucket.filter((wo) => wo.status === 'pending-approval').length,
          open: inBucket.filter((wo) => wo.status === 'open').length,
          overdue: inBucket.filter((wo) => isWorkOrderOverdue(wo)).length,
        };
      }),
    [filteredWOs, buckets]
  );

  // ── Chart 3: Response & Resolution Time ───────────────────────────────────
  const timingData = useMemo(
    () =>
      buckets.map((b) => {
        const inBucket = filteredWOs.filter(
          (wo) =>
            new Date(wo.createdAt) >= b.start && new Date(wo.createdAt) <= b.end
        );
        const withDispatch = inBucket.filter((wo) => wo.dispatchedAt);
        const withComplete = inBucket.filter((wo) => wo.completedAt);

        const avgResponse =
          withDispatch.length > 0
            ? withDispatch.reduce(
                (s, wo) =>
                  s +
                  (new Date(wo.dispatchedAt!).getTime() -
                    new Date(wo.createdAt).getTime()) /
                    3_600_000,
                0
              ) / withDispatch.length
            : null;

        const avgResolution =
          withComplete.length > 0
            ? withComplete.reduce(
                (s, wo) =>
                  s +
                  (new Date(wo.completedAt!).getTime() -
                    new Date(wo.createdAt).getTime()) /
                    3_600_000,
                0
              ) / withComplete.length
            : null;

        return {
          label: b.label,
          response: avgResponse !== null ? Math.round(avgResponse * 10) / 10 : null,
          resolution: avgResolution !== null ? Math.round(avgResolution * 10) / 10 : null,
        };
      }),
    [filteredWOs, buckets]
  );

  // ── Chart 4: Technician Workload ──────────────────────────────────────────
  const rangeStart = useMemo(() => {
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    return startOfDay(subDays(new Date(), days));
  }, [dateRange]);

  const techData = useMemo(() => {
    return allTechs
      .map((tech) => {
        const completed = filteredWOs.filter(
          (wo) =>
            wo.assignedTechnicianId === tech.id &&
            wo.completedAt &&
            new Date(wo.completedAt) >= rangeStart
        );
        return {
          id: tech.id,
          name: tech.fullName
            .split(' ')
            .map((n, i) => (i === 0 ? n[0] + '.' : n))
            .join(' '),
          completed: completed.length,
        };
      })
      .filter((t) => t.completed > 0)
      .sort((a, b) => b.completed - a.completed)
      .slice(0, 15);
  }, [allTechs, filteredWOs, rangeStart]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* Header + Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Analytics</h1>
          <p className="text-sm text-gray-400 mt-1">
            Operational trends and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Facility filter */}
          <select
            value={facilityFilter}
            onChange={(e) => setFacilityFilter(e.target.value)}
            className="bg-neutral-800 text-white text-xs px-2.5 py-1.5 rounded border border-neutral-700 focus:outline-none focus:ring-1 focus:ring-[#F5C518]/50"
          >
            <option value="all">All Facilities</option>
            {allProperties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-neutral-800 text-white text-xs px-2.5 py-1.5 rounded border border-neutral-700 focus:outline-none focus:ring-1 focus:ring-[#F5C518]/50"
          >
            <option value="all">All Categories</option>
            {VENDOR_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {/* Date range toggle */}
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
        </div>
      </div>

      {/* KPI Snapshot Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard
          label="SLA Compliance"
          value={kpiData.sla.value != null ? `${kpiData.sla.value.toFixed(1)}%` : '—'}
          delta={kpiData.sla.delta}
          higherIsBetter={true}
          unit="pp"
        />
        <KpiCard
          label="Avg Response Time"
          value={
            kpiData.response.value != null
              ? `${kpiData.response.value.toFixed(1)}h`
              : '—'
          }
          delta={kpiData.response.delta}
          higherIsBetter={false}
          unit="h"
        />
        <KpiCard
          label="Avg Resolution Time"
          value={
            kpiData.resolution.value != null
              ? `${kpiData.resolution.value.toFixed(1)}h`
              : '—'
          }
          delta={kpiData.resolution.delta}
          higherIsBetter={false}
          unit="h"
        />
        <KpiCard label="Overdue Now" value={String(kpiData.overdue.value)} />
        <KpiCard
          label="WO Volume"
          value={String(kpiData.volume.value)}
          delta={kpiData.volume.delta}
          higherIsBetter={null}
        />
      </div>

      {/* Chart 1 — SLA Compliance Trend */}
      <div className="bg-neutral-900 border border-slate-800/50 rounded-xl p-6">
        <h2 className="text-base font-semibold text-white mb-1">SLA Compliance Trend</h2>
        <p className="text-xs text-gray-500 mb-5">% of completed work orders resolved on time</p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={slaData} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
              width={36}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(v: number | undefined) =>
                v != null ? [`${v.toFixed(1)}%`, 'SLA Compliance'] : ['No data', '']
              }
            />
            <Line
              type="monotone"
              dataKey="compliance"
              stroke="#F5C518"
              strokeWidth={2}
              dot={{ fill: '#F5C518', r: 3, strokeWidth: 0 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Chart 2 — Work Order Volume */}
      <div className="bg-neutral-900 border border-slate-800/50 rounded-xl p-6">
        <h2 className="text-base font-semibold text-white mb-1">Work Order Volume</h2>
        <p className="text-xs text-gray-500 mb-5">New work orders created per period, by status</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={volumeData} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              width={28}
            />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, color: '#9ca3af', paddingTop: 12 }}
            />
            <Bar dataKey="completed" stackId="a" fill="#2ECC71" name="Completed" />
            <Bar dataKey="in-progress" stackId="a" fill="#F5C518" name="In Progress" />
            <Bar dataKey="pending-approval" stackId="a" fill="#8B5CF6" name="Pending Approval" />
            <Bar dataKey="open" stackId="a" fill="#6b7280" name="Open" />
            <Bar
              dataKey="overdue"
              stackId="a"
              fill="#E74C3C"
              name="Overdue"
              radius={[3, 3, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Chart 3 — Response & Resolution Time */}
      <div className="bg-neutral-900 border border-slate-800/50 rounded-xl p-6">
        <h2 className="text-base font-semibold text-white mb-1">
          Response & Resolution Time
        </h2>
        <p className="text-xs text-gray-500 mb-5">Average hours per period</p>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={timingData} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}h`}
              width={36}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(v: number | undefined, name: string | undefined) =>
                v != null ? [`${v.toFixed(1)}h`, name ?? ''] : ['No data', name ?? '']
              }
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, color: '#9ca3af', paddingTop: 12 }}
            />
            <Line
              type="monotone"
              dataKey="response"
              name="Avg Response"
              stroke="#6366f1"
              strokeWidth={2}
              dot={{ fill: '#6366f1', r: 3, strokeWidth: 0 }}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="resolution"
              name="Avg Resolution"
              stroke="#F5C518"
              strokeWidth={2}
              dot={{ fill: '#F5C518', r: 3, strokeWidth: 0 }}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Chart 4 — Technician Workload */}
      {techData.length > 0 && (
        <div className="bg-neutral-900 border border-slate-800/50 rounded-xl p-6">
          <h2 className="text-base font-semibold text-white mb-1">Technician Workload</h2>
          <p className="text-xs text-gray-500 mb-5">
            Completed jobs per technician in selected period
          </p>
          <ResponsiveContainer
            width="100%"
            height={Math.max(techData.length * 36 + 32, 120)}
          >
            <BarChart
              layout="vertical"
              data={techData}
              margin={{ top: 4, right: 24, bottom: 4, left: 4 }}
            >
              <XAxis
                type="number"
                tick={{ fill: '#6b7280', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={80}
                tick={{ fill: '#e5e7eb', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(v: number | undefined) => [v ?? 0, 'Completed']}
              />
              <Bar
                dataKey="completed"
                fill="#2ECC71"
                radius={[0, 4, 4, 0]}
                name="Completed"
                style={{ cursor: 'pointer' }}
                onClick={() => router.push('/work-orders?status=closed')}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
