'use client';

import { useState, useMemo } from 'react';
import { signOut } from 'next-auth/react';
import { ChevronRight, MessageSquare } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { Badge } from '@/components/ui/Badge';
import { VendorWorkOrderPanel } from '@/components/vendors/VendorWorkOrderPanel';
import { VendorTechnicianSection } from '@/components/vendors/VendorTechnicianSection';
import { VendorInboxDrawer } from '@/components/vendors/VendorInboxDrawer';
import { VendorActionRequiredStrip } from '@/components/vendor/VendorActionRequiredStrip';
import { VendorSummaryPanel } from '@/components/vendor/VendorSummaryPanel';
import { formatRelativeAgo, formatDuration, getSlaRisk } from '@/lib/date-utils';
import type { WorkOrder, WorkOrderStatus, WorkOrderPriority, Technician } from '@/data/seed-data';

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseAddress(address: string): { city: string; state: string } {
  const parts = address.split(',').map((s) => s.trim());
  const city = parts[1] ?? '';
  const state = (parts[2] ?? '').split(/\s+/)[0] ?? '';
  return { city, state };
}

const statusVariant: Record<WorkOrderStatus, 'completed' | 'in-progress' | 'open' | 'overdue' | 'pending' | 'dispatched'> = {
  open: 'open',
  'in-progress': 'in-progress',
  completed: 'completed',
  overdue: 'overdue',
  dispatched: 'dispatched',
};

const priorityColors: Record<string, string> = {
  urgent: 'text-red-400',
  high:   'text-orange-400',
  medium: 'text-yellow-400',
  low:    'text-gray-400',
};

function WorkOrderTimestamp({ wo }: { wo: WorkOrder }) {
  const now = Date.now();
  const dueLine =
    wo.dueDate && wo.status !== 'completed'
      ? (() => {
          const isLate = new Date(wo.dueDate).getTime() < now;
          return isLate ? (
            <span className="text-xs text-red-400">Overdue by {formatDuration(wo.dueDate)}</span>
          ) : (
            <span className="text-xs text-gray-500">Due {formatRelativeAgo(wo.dueDate)}</span>
          );
        })()
      : null;

  let primary: React.ReactNode;
  if (wo.status === 'dispatched')
    primary = <span className="text-xs text-gray-500">Dispatched {formatRelativeAgo(wo.dispatchedAt ?? wo.updatedAt)}</span>;
  else if (wo.status === 'in-progress')
    primary = <span className="text-xs text-gray-500">In progress {formatDuration(wo.startedAt ?? wo.updatedAt)}</span>;
  else if (wo.status === 'completed')
    primary = <span className="text-xs text-gray-500">Completed {formatRelativeAgo(wo.completedAt)}</span>;
  else
    primary = <span className="text-xs text-gray-500">Opened {formatRelativeAgo(wo.createdAt)}</span>;

  return (
    <>
      {primary}
      {dueLine && <><span className="text-gray-600"> · </span>{dueLine}</>}
    </>
  );
}

function SlaRiskChip({ wo }: { wo: WorkOrder }) {
  const risk = getSlaRisk(wo);
  if (!risk || risk === 'on-track') return null;
  if (risk === 'approaching')
    return <span className="text-[10px] font-medium text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded">Approaching SLA</span>;
  return <span className="text-[10px] font-medium text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">SLA Breached</span>;
}

function getNextStep(wo: WorkOrder): string | null {
  if (['open', 'dispatched'].includes(wo.status) && !wo.assignedTechnicianId)
    return 'Next: assign technician';
  if (wo.status === 'dispatched' && wo.assignedTechnicianId && !wo.startedAt)
    return 'Next: technician to start job';
  return null;
}

function getStallWarning(wo: WorkOrder): string | null {
  if (wo.status === 'dispatched' && !wo.startedAt && wo.dispatchedAt) {
    const h = (Date.now() - new Date(wo.dispatchedAt).getTime()) / 3_600_000;
    if (h >= 2) return `Dispatched ${formatDuration(wo.dispatchedAt)} ago — not yet started`;
  }
  if (wo.status === 'in-progress') {
    const h = (Date.now() - new Date(wo.updatedAt).getTime()) / 3_600_000;
    if (h >= 24) return `In progress — no update in ${Math.floor(h / 24)}d`;
  }
  if (wo.status === 'overdue') {
    return wo.dueDate ? `Overdue by ${formatDuration(wo.dueDate)}` : 'Overdue';
  }
  return null;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function VendorDashboard() {
  const {
    currentUser,
    getAccessibleWorkOrders,
    updateWorkOrder,
    getTechniciansByVendor,
    addVendorTechnician,
    updateVendorTechnician,
    removeVendorTechnician,
    getAllProperties,
    conversations,
    getConversationByWorkOrder,
    getTotalUnreadCount,
    sendMessage,
    markConversationRead,
    createWorkOrderConversation,
  } = useUser();

  const workOrders = getAccessibleWorkOrders();
  const properties = getAllProperties();
  const isVendorAdmin = currentUser.role === 'Vendor-Admin';

  const vendorId = currentUser.associatedVendorIds?.[0] ?? currentUser.companyId ?? '';
  const vendorTechnicians = getTechniciansByVendor(vendorId);

  const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [inboxInitialConvId, setInboxInitialConvId] = useState<string | undefined>(undefined);

  // Filters
  const [facilityFilter, setFacilityFilter]   = useState('all');
  const [cityFilter, setCityFilter]             = useState('all');
  const [stateFilter, setStateFilter]           = useState('all');
  const [priorityFilter, setPriorityFilter]     = useState('all');
  const [pillFilter, setPillFilter]             = useState<string | null>(null);

  const clearAllFilters = () => {
    setFacilityFilter('all');
    setCityFilter('all');
    setStateFilter('all');
    setPriorityFilter('all');
    setPillFilter(null);
  };

  const totalUnread = getTotalUnreadCount();

  // Derived filter option sets
  const facilities = useMemo(() => {
    const seen = new Map<string, string>();
    workOrders.forEach((wo) => {
      const p = properties.find((pp) => pp.id === wo.propertyId);
      if (p && !seen.has(p.id)) seen.set(p.id, p.name);
    });
    return Array.from(seen.entries());
  }, [workOrders, properties]);

  const cities = useMemo(
    () =>
      Array.from(new Set(
        workOrders
          .map((wo) => {
            const p = properties.find((pp) => pp.id === wo.propertyId);
            return p ? parseAddress(p.address).city : null;
          })
          .filter((c): c is string => Boolean(c))
      )),
    [workOrders, properties]
  );

  const states = useMemo(
    () =>
      Array.from(new Set(
        workOrders
          .map((wo) => {
            const p = properties.find((pp) => pp.id === wo.propertyId);
            return p ? parseAddress(p.address).state : null;
          })
          .filter((s): s is string => Boolean(s))
      )),
    [workOrders, properties]
  );

  // Dropdown-filtered only (counts for ActionRequiredStrip + SummaryPanel)
  const preFilteredWorkOrders = useMemo(
    () =>
      workOrders.filter((wo) => {
        const prop = properties.find((p) => p.id === wo.propertyId);
        const { city, state } = prop ? parseAddress(prop.address) : { city: '', state: '' };
        if (facilityFilter !== 'all' && wo.propertyId !== facilityFilter) return false;
        if (cityFilter !== 'all' && city !== cityFilter) return false;
        if (stateFilter !== 'all' && state !== stateFilter) return false;
        if (priorityFilter !== 'all' && wo.priority !== priorityFilter) return false;
        return true;
      }),
    [workOrders, properties, facilityFilter, cityFilter, stateFilter, priorityFilter]
  );

  // Dropdown + pill filtered (for WO list)
  const filteredWorkOrders = useMemo(() => {
    return preFilteredWorkOrders.filter((wo) => {
      if (pillFilter === 'approaching') return getSlaRisk(wo) === 'approaching';
      if (pillFilter === 'breached')    return getSlaRisk(wo) === 'breached';
      if (pillFilter === 'overdue')     return wo.status === 'overdue';
      if (pillFilter === 'dispatched')  return wo.status === 'dispatched' && !wo.startedAt;
      if (pillFilter === 'unassigned')
        return ['dispatched', 'in-progress'].includes(wo.status) && !wo.assignedTechnicianId;
      return true;
    });
  }, [preFilteredWorkOrders, pillFilter]);

  const hasActiveFilters =
    facilityFilter !== 'all' || cityFilter !== 'all' || stateFilter !== 'all' ||
    priorityFilter !== 'all' || pillFilter !== null;

  const handleStatusUpdate = (workOrderId: string, newStatus: WorkOrderStatus) => {
    updateWorkOrder(workOrderId, { status: newStatus });
    if (newStatus === 'in-progress') updateWorkOrder(workOrderId, { startedAt: new Date().toISOString() });
  };

  const handleAssignTechnician = (workOrderId: string, technicianId: string | undefined) => {
    updateWorkOrder(workOrderId, { assignedTechnicianId: technicianId });
  };

  const handleAddTechnician = (tech: Technician) => { addVendorTechnician(tech); };
  const handleUpdateTechnician = (techId: string, updates: Partial<Technician>) => { updateVendorTechnician(techId, updates); };
  const handleRemoveTechnician = (techId: string) => { removeVendorTechnician(techId); };

  const getSelectedConversation = () => {
    if (!selectedWO) return undefined;
    return getConversationByWorkOrder(selectedWO.id);
  };

  const handlePanelSendMessage = (body: string) => {
    if (!selectedWO) return;
    let conv = getConversationByWorkOrder(selectedWO.id);
    if (!conv) conv = createWorkOrderConversation(selectedWO.id, [currentUser.id], [currentUser.name]);
    sendMessage(conv.id, body);
  };

  const handlePanelMarkRead = () => {
    if (!selectedWO) return;
    const conv = getConversationByWorkOrder(selectedWO.id);
    if (conv) markConversationRead(conv.id);
  };

  const handleMessageTechnician = (tech: Technician) => {
    const techConv = conversations.filter((c) => c.type === 'direct').find((c) => c.participantIds.includes(tech.id));
    setInboxInitialConvId(techConv?.id);
    setInboxOpen(true);
  };

  const selectCls =
    'bg-neutral-800 text-white text-xs px-2.5 py-1.5 rounded border border-neutral-700 focus:outline-none focus:ring-1 focus:ring-[#F5C518]/40 min-w-0';

  // ── Non-admin: simple scrollable single-column view ────────────────────────
  if (!isVendorAdmin) {
    return (
      <div className="min-h-screen bg-neutral-950">
        <nav className="bg-neutral-900 border-b border-slate-800/50 px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-white">Hello<span className="text-[#F5C518]">Hive</span></h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-white font-medium">{currentUser.name}</p>
              <p className="text-xs text-gray-400">{currentUser.organization}</p>
            </div>
            <button onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5 rounded-md hover:bg-neutral-800">
              Sign out
            </button>
          </div>
        </nav>
        <div className="max-w-2xl mx-auto px-4 py-6">
          <h2 className="text-xl font-semibold text-white mb-1">My Work Orders</h2>
          <p className="text-sm text-gray-400 mb-5">{workOrders.length} job{workOrders.length !== 1 ? 's' : ''} assigned to {currentUser.name}</p>
          {workOrders.length === 0 ? (
            <div className="bg-neutral-900 rounded-xl border border-slate-800/50 p-8 text-center">
              <p className="text-gray-400">No work orders currently assigned.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {workOrders.map((wo) => (
                <div key={wo.id} className="bg-neutral-900 rounded-xl border border-slate-800/50 p-4 cursor-pointer hover:border-slate-700 transition-colors group" onClick={() => setSelectedWO(wo)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white group-hover:text-[#F5C518] transition-colors">{wo.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{wo.id} · <WorkOrderTimestamp wo={wo} /></p>
                    </div>
                    <Badge variant={statusVariant[wo.status]}>{wo.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {selectedWO && (
          <VendorWorkOrderPanel workOrder={selectedWO} onClose={() => setSelectedWO(null)} onStatusUpdate={handleStatusUpdate}
            isVendorAdmin={false} vendorTechnicians={vendorTechnicians} properties={properties}
            onAssignTechnician={handleAssignTechnician} currentUserId={currentUser.id}
            conversation={getSelectedConversation()} onSendMessage={handlePanelSendMessage} onMarkRead={handlePanelMarkRead} />
        )}
      </div>
    );
  }

  // ── Vendor-Admin: 2-column Command Center ─────────────────────────────────
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-neutral-950">

      {/* Nav */}
      <nav className="bg-neutral-900 border-b border-slate-800/50 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <h1 className="text-lg font-semibold text-white">Hello<span className="text-[#F5C518]">Hive</span></h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => { setInboxInitialConvId(undefined); setInboxOpen(true); }}
            className="relative text-gray-400 hover:text-white transition-colors" title="Inbox"
          >
            <MessageSquare className="w-5 h-5" />
            {totalUnread > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#F5C518] rounded-full text-[10px] text-neutral-950 font-bold flex items-center justify-center">
                {totalUnread > 9 ? '9+' : totalUnread}
              </span>
            )}
          </button>
          <div className="text-right">
            <p className="text-sm text-white font-medium">{currentUser.name}</p>
            <p className="text-xs text-gray-400">{currentUser.organization}</p>
          </div>
          <button onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5 rounded-md hover:bg-neutral-800">
            Sign out
          </button>
        </div>
      </nav>

      {/* Top Filter Bar */}
      <div className="flex items-center justify-between gap-3 px-4 py-2 bg-neutral-900 border-b border-slate-800/50 flex-shrink-0">
        {/* Left: dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          <select value={facilityFilter} onChange={(e) => setFacilityFilter(e.target.value)} className={selectCls}>
            <option value="all">All Facilities</option>
            {facilities.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
          <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className={selectCls}>
            <option value="all">All Cities</option>
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} className={selectCls}>
            <option value="all">All States</option>
            {states.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className={selectCls}>
            <option value="all">All Priorities</option>
            {(['urgent', 'high', 'medium', 'low'] as WorkOrderPriority[]).map((p) => (
              <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>
          {hasActiveFilters && (
            <button onClick={clearAllFilters}
              className="text-xs text-gray-400 hover:text-white transition-colors underline underline-offset-2 whitespace-nowrap">
              Clear
            </button>
          )}
        </div>

        {/* Right: action pills */}
        <VendorActionRequiredStrip
          workOrders={preFilteredWorkOrders}
          activePill={pillFilter}
          onPillClick={setPillFilter}
          compact
        />
      </div>

      {/* Main 2-column area */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left Column: WO feed (70%) */}
        <div className="flex-[7] overflow-y-auto min-w-0 p-5">
          {/* Column header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-white">All Work Orders</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {filteredWorkOrders.length}
                {hasActiveFilters && filteredWorkOrders.length !== workOrders.length
                  ? ` of ${workOrders.length}` : ''}{' '}
                job{filteredWorkOrders.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* WO cards */}
          {filteredWorkOrders.length === 0 ? (
            <div className="bg-neutral-900 rounded-xl border border-slate-800/50 p-8 text-center">
              <p className="text-gray-400 text-sm">
                {hasActiveFilters ? 'No work orders match the current filters.' : 'No work orders assigned.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredWorkOrders.map((wo) => {
                const assignedTech = vendorTechnicians.find((t) => t.id === wo.assignedTechnicianId);
                const stallWarning = getStallWarning(wo);
                const nextStep = getNextStep(wo);

                return (
                  <div
                    key={wo.id}
                    className="bg-neutral-900 rounded-xl border border-slate-800/50 cursor-pointer hover:border-slate-700 transition-colors group overflow-hidden"
                    onClick={() => setSelectedWO(wo)}
                  >
                    <div className="flex items-center gap-3 px-4 py-3">
                      {/* Left: main content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-white group-hover:text-[#F5C518] transition-colors">{wo.title}</span>
                          <SlaRiskChip wo={wo} />
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap text-xs">
                          <span className="text-gray-500">{wo.id}</span>
                          <span className="text-gray-700">·</span>
                          <span className={`font-medium ${priorityColors[wo.priority] ?? 'text-gray-400'}`}>{wo.priority}</span>
                          {assignedTech && (
                            <>
                              <span className="text-gray-700">·</span>
                              <span className="text-gray-500">{assignedTech.fullName}</span>
                            </>
                          )}
                          <span className="text-gray-700">·</span>
                          <WorkOrderTimestamp wo={wo} />
                        </div>
                        {nextStep && (
                          <span className="text-[11px] text-gray-600 mt-0.5 block">{nextStep}</span>
                        )}
                      </div>

                      {/* Right: status + action buttons */}
                      <div
                        className="flex items-center gap-2 flex-shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Badge variant={statusVariant[wo.status]}>{wo.status}</Badge>
                        {wo.status === 'dispatched' && (
                          <button
                            onClick={() => handleStatusUpdate(wo.id, 'in-progress')}
                            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-[#F5C518]/10 text-[#F5C518] border border-[#F5C518]/20 hover:bg-[#F5C518]/20 transition-colors whitespace-nowrap"
                          >
                            Start
                          </button>
                        )}
                        {wo.status === 'in-progress' && (
                          <button
                            onClick={() => handleStatusUpdate(wo.id, 'completed')}
                            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors whitespace-nowrap"
                          >
                            Complete
                          </button>
                        )}
                        <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
                      </div>
                    </div>

                    {/* Stall banner — full-width footer strip */}
                    {stallWarning && (
                      <div
                        className="px-4 py-2 bg-yellow-500/10 border-t border-yellow-500/20 flex items-center justify-between gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="text-xs text-yellow-400">⚠ {stallWarning}</span>
                        <button
                          onClick={() => setSelectedWO(wo)}
                          className="text-xs text-yellow-400/70 hover:text-yellow-400 transition-colors whitespace-nowrap"
                        >
                          View →
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Ops Console (30%) */}
        <div className="flex-[3] overflow-y-auto min-w-0 border-l border-slate-800/50 p-4 bg-neutral-900/30">
          {/* KPI Summary */}
          <VendorSummaryPanel workOrders={preFilteredWorkOrders} />

          {/* Technician Cards */}
          <VendorTechnicianSection
            technicians={vendorTechnicians}
            vendorId={vendorId}
            workOrders={workOrders}
            onAdd={handleAddTechnician}
            onUpdate={handleUpdateTechnician}
            onRemove={handleRemoveTechnician}
            onWorkOrderClick={(wo) => setSelectedWO(wo)}
            onMessageTechnician={handleMessageTechnician}
          />
        </div>

      </div>{/* end 2-col area */}

      {/* Work Order Detail Panel */}
      {selectedWO && (
        <VendorWorkOrderPanel
          workOrder={selectedWO}
          onClose={() => setSelectedWO(null)}
          onStatusUpdate={handleStatusUpdate}
          isVendorAdmin={isVendorAdmin}
          vendorTechnicians={vendorTechnicians}
          properties={properties}
          onAssignTechnician={handleAssignTechnician}
          currentUserId={currentUser.id}
          conversation={getSelectedConversation()}
          onSendMessage={handlePanelSendMessage}
          onMarkRead={handlePanelMarkRead}
        />
      )}

      {/* Inbox Drawer */}
      <VendorInboxDrawer
        isOpen={inboxOpen}
        onClose={() => setInboxOpen(false)}
        conversations={conversations}
        currentUserId={currentUser.id}
        onSendMessage={(convId, body) => sendMessage(convId, body)}
        onMarkRead={(convId) => markConversationRead(convId)}
        initialConversationId={inboxInitialConvId}
      />
    </div>
  );
}
