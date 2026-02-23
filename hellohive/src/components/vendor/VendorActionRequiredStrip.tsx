'use client';

import { AlertTriangle, XCircle, Clock, UserX, ShieldCheck } from 'lucide-react';
import { computeSlaRisk, isWorkOrderOverdue } from '@/lib/workorder-compute';
import type { WorkOrder } from '@/data/seed-data';

interface Props {
  workOrders: WorkOrder[];
  activePill: string | null;
  onPillClick: (pill: string | null) => void;
  compact?: boolean;
}

export function VendorActionRequiredStrip({ workOrders, activePill, onPillClick, compact }: Props) {
  const approaching = workOrders.filter((wo) => computeSlaRisk(wo) === 'approaching').length;
  const breached    = workOrders.filter((wo) => computeSlaRisk(wo) === 'breached').length;
  const overdue     = workOrders.filter((wo) => isWorkOrderOverdue(wo)).length;
  const pendingApproval = workOrders.filter((wo) => wo.status === 'pending-approval').length;
  const notStarted  = workOrders.filter((wo) => wo.status === 'dispatched' && !wo.startedAt).length;
  const unassigned  = workOrders.filter((wo) =>
    ['dispatched', 'in-progress'].includes(wo.status) && !wo.assignedTechnicianId
  ).length;

  const hasAny = approaching > 0 || breached > 0 || overdue > 0 || notStarted > 0 || unassigned > 0 || pendingApproval > 0;

  if (!hasAny && !activePill) return null;

  const pill = (
    id: string,
    count: number,
    label: string,
    Icon: React.ComponentType<{ className?: string }>,
    colorCls: string,
    activeCls: string,
  ) => {
    if (count === 0 && activePill !== id) return null;
    const isActive = activePill === id;
    return (
      <button
        key={id}
        onClick={() => onPillClick(isActive ? null : id)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
          isActive ? activeCls : `${colorCls} hover:opacity-80`
        }`}
      >
        <Icon className="w-3 h-3" />
        {count > 0 ? `${count} ` : ''}{label}
        {isActive && <span className="ml-0.5 opacity-60">×</span>}
      </button>
    );
  };

  const pills = (
    <div className="flex items-center gap-1.5 flex-wrap">
      {pill('approaching', approaching, 'Approaching SLA', AlertTriangle,
        'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
        'bg-yellow-500/20 text-yellow-300 border-yellow-500/40')}
      {pill('breached', breached, 'SLA Breached', AlertTriangle,
        'bg-red-500/10 text-red-400 border-red-500/20',
        'bg-red-500/20 text-red-300 border-red-500/40')}
      {pill('overdue', overdue, 'Overdue', XCircle,
        'bg-red-500/10 text-red-400 border-red-500/20',
        'bg-red-500/20 text-red-300 border-red-500/40')}
      {pill('dispatched', notStarted, 'Not Started', Clock,
        'bg-orange-500/10 text-orange-400 border-orange-500/20',
        'bg-orange-500/20 text-orange-300 border-orange-500/40')}
      {pill('unassigned', unassigned, 'Unassigned', UserX,
        'bg-gray-500/10 text-gray-400 border-gray-500/20',
        'bg-gray-500/20 text-gray-300 border-gray-500/40')}
      {pill('pending-approval', pendingApproval, 'Pending Approval', ShieldCheck,
        'bg-purple-500/10 text-purple-400 border-purple-500/20',
        'bg-purple-500/20 text-purple-300 border-purple-500/40')}
      {activePill && (
        <button
          onClick={() => onPillClick(null)}
          className="text-xs text-gray-500 hover:text-white transition-colors underline underline-offset-2"
        >
          Clear
        </button>
      )}
    </div>
  );

  if (compact) return pills;

  return (
    <div className="mb-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Action Required</p>
      {pills}
    </div>
  );
}
