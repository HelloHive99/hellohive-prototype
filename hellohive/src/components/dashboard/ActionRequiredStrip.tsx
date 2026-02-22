'use client';

import { useRouter } from 'next/navigation';
import { AlertTriangle, XCircle, Clock, UserX } from 'lucide-react';
import { getSlaRisk } from '@/lib/date-utils';
import type { WorkOrder } from '@/data/seed-data';

export function ActionRequiredStrip({ workOrders }: { workOrders: WorkOrder[] }) {
  const router = useRouter();

  const approaching = workOrders.filter(wo => getSlaRisk(wo) === 'approaching').length;
  const breached    = workOrders.filter(wo => getSlaRisk(wo) === 'breached').length;
  const overdue     = workOrders.filter(wo => wo.status === 'overdue').length;
  const pendingAck  = workOrders.filter(wo => wo.status === 'dispatched' && !wo.startedAt).length;
  const unassigned  = workOrders.filter(wo =>
    ['dispatched', 'in-progress'].includes(wo.status) && !wo.assignedTechnicianId
  ).length;

  if (approaching + breached + overdue + pendingAck + unassigned === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap bg-neutral-900 border border-slate-800/50 rounded-lg px-4 py-3">
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wider mr-1">
        Action Required
      </span>

      {(approaching > 0 || breached > 0) && (
        <button
          onClick={() => router.push('/work-orders?status=in-progress')}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/20 transition-colors"
        >
          <AlertTriangle className="w-3 h-3" />
          {approaching + breached} approaching / breached SLA
        </button>
      )}

      {overdue > 0 && (
        <button
          onClick={() => router.push('/work-orders?status=overdue')}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
        >
          <XCircle className="w-3 h-3" />
          {overdue} overdue
        </button>
      )}

      {pendingAck > 0 && (
        <button
          onClick={() => router.push('/work-orders?status=dispatched')}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-700/50 text-gray-300 border border-slate-600/50 hover:bg-slate-700 transition-colors"
        >
          <Clock className="w-3 h-3" />
          {pendingAck} dispatched, not yet started
        </button>
      )}

      {unassigned > 0 && (
        <button
          onClick={() => router.push('/work-orders?status=dispatched')}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 transition-colors"
        >
          <UserX className="w-3 h-3" />
          {unassigned} unassigned technician{unassigned !== 1 ? 's' : ''}
        </button>
      )}
    </div>
  );
}
