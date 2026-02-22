'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Check, X as XIcon, MessageSquare } from 'lucide-react';
import { startOfDay } from 'date-fns';
import type { Technician, TechnicianStatus, WorkOrder } from '@/data/seed-data';
import { formatDuration, getSlaRisk } from '@/lib/date-utils';

interface VendorTechnicianSectionProps {
  technicians: Technician[];
  vendorId: string;
  workOrders: WorkOrder[];
  onAdd: (tech: Technician) => void;
  onUpdate: (techId: string, updates: Partial<Technician>) => void;
  onRemove: (techId: string) => void;
  onWorkOrderClick: (wo: WorkOrder) => void;
  onMessageTechnician: (tech: Technician) => void;
}

const STATUS_OPTIONS: TechnicianStatus[] = ['available', 'on-job', 'off-shift', 'unavailable'];

const statusLabel: Record<TechnicianStatus, string> = {
  available:   'Available',
  'on-job':    'On Job',
  'off-shift': 'Off Shift',
  unavailable: 'Unavailable',
};

const avatarBg: Record<TechnicianStatus, string> = {
  available:   'bg-green-500/20 text-green-400',
  'on-job':    'bg-yellow-500/20 text-yellow-400',
  'off-shift': 'bg-neutral-700 text-gray-400',
  unavailable: 'bg-red-500/20 text-red-400',
};

const statusPillCls: Record<TechnicianStatus, string> = {
  available:   'bg-green-500/10 text-green-400',
  'on-job':    'bg-yellow-500/10 text-yellow-400',
  'off-shift': 'bg-neutral-700/50 text-gray-500',
  unavailable: 'bg-red-500/10 text-red-400',
};

const statusDotCls: Record<TechnicianStatus, string> = {
  available:   'bg-green-400',
  'on-job':    'bg-yellow-400',
  'off-shift': 'bg-gray-500',
  unavailable: 'bg-red-400',
};

const slaRiskJobColor: Record<string, string> = {
  'on-track':  'text-[#F5C518]',
  'approaching': 'text-yellow-300',
  'breached':  'text-red-400',
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] ?? '') + (parts[parts.length - 1][0] ?? '')
    : (parts[0]?.[0] ?? '?');
}

const emptyAddForm = {
  fullName: '', roleTitle: '', phone: '', email: '',
  city: '', state: '', dispatchZone: '', shiftHours: '',
};
type AddForm = typeof emptyAddForm;
type EditForm = {
  fullName: string; roleTitle: string; phone: string; email: string;
  city: string; state: string; dispatchZone: string; shiftHours: string;
  currentStatus: TechnicianStatus;
};

export function VendorTechnicianSection({
  technicians,
  vendorId,
  workOrders,
  onAdd,
  onUpdate,
  onRemove,
  onWorkOrderClick,
  onMessageTechnician,
}: VendorTechnicianSectionProps) {
  // Live timer — tick every minute to keep durations fresh
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<AddForm>(emptyAddForm);
  const [addErrors, setAddErrors] = useState<Partial<AddForm>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const todayStart = startOfDay(new Date());

  // Validate add form
  const validateAdd = () => {
    const e: Partial<AddForm> = {};
    if (!addForm.fullName.trim()) e.fullName = 'Required';
    if (!addForm.roleTitle.trim()) e.roleTitle = 'Required';
    if (!addForm.phone.trim()) e.phone = 'Required';
    if (!addForm.email.trim()) e.email = 'Required';
    setAddErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAdd = () => {
    if (!validateAdd()) return;
    const newTech: Technician = {
      id: `tech-${vendorId}-${Date.now()}`,
      vendorId,
      fullName: addForm.fullName.trim(),
      roleTitle: addForm.roleTitle.trim(),
      phone: addForm.phone.trim(),
      email: addForm.email.trim(),
      city: addForm.city.trim() || undefined,
      state: addForm.state.trim() || undefined,
      dispatchZone: addForm.dispatchZone.trim() || undefined,
      shiftHours: addForm.shiftHours.trim() || '8am-5pm',
      isActive: true,
      skillTags: [],
      certifications: [],
      equipmentAuthorizedFor: [],
      clearanceLevel: 'basic',
      currentStatus: 'available',
      assignedWorkOrdersCount: 0,
      homeProperty: '',
      estimatedResponseTime: 60,
      avgResponseTime: 60,
      avgResolutionTime: 120,
      firstTimeFixRate: 85,
      slaBreaches90d: 0,
      internalRating: 4.0,
      totalJobsCompleted: 0,
      lastJobDate: new Date().toISOString().split('T')[0],
    };
    onAdd(newTech);
    setAddForm(emptyAddForm);
    setAddErrors({});
    setShowAddForm(false);
  };

  const startEdit = (tech: Technician) => {
    setEditingId(tech.id);
    setEditForm({
      fullName: tech.fullName,
      roleTitle: tech.roleTitle,
      phone: tech.phone,
      email: tech.email,
      city: tech.city ?? '',
      state: tech.state ?? '',
      dispatchZone: tech.dispatchZone ?? '',
      shiftHours: tech.shiftHours,
      currentStatus: tech.currentStatus,
    });
    setRemovingId(null);
  };

  const saveEdit = (techId: string) => {
    if (!editForm) return;
    onUpdate(techId, {
      fullName: editForm.fullName.trim(),
      roleTitle: editForm.roleTitle.trim(),
      phone: editForm.phone.trim(),
      email: editForm.email.trim(),
      city: editForm.city.trim() || undefined,
      state: editForm.state.trim() || undefined,
      dispatchZone: editForm.dispatchZone.trim() || undefined,
      shiftHours: editForm.shiftHours.trim(),
      currentStatus: editForm.currentStatus,
    });
    setEditingId(null);
    setEditForm(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const handleRemove = (techId: string) => {
    if (removingId === techId) {
      onRemove(techId);
      setRemovingId(null);
    } else {
      setRemovingId(techId);
      setEditingId(null);
    }
  };

  const inputCls = (err?: string) =>
    `w-full bg-neutral-900 border rounded px-2 py-1 text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-[#F5C518] ${
      err ? 'border-red-500' : 'border-neutral-700'
    }`;

  // First unassigned WO for quick-assign
  const unassignedWO = workOrders.find(
    (wo) => ['open', 'dispatched'].includes(wo.status) && !wo.assignedTechnicianId
  );

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-white">Your Technicians</h3>
          <p className="text-xs text-gray-500">{technicians.length} on roster</p>
        </div>
        <button
          onClick={() => { setShowAddForm(!showAddForm); setAddErrors({}); setAddForm(emptyAddForm); }}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-[#F5C518]/10 text-[#F5C518] border border-[#F5C518]/20 hover:bg-[#F5C518]/20 transition-colors"
        >
          <Plus className="w-3 h-3" />
          Add
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-neutral-800/50 rounded-lg border border-[#F5C518]/20 p-3 mb-3">
          <p className="text-xs font-medium text-white mb-2">New Technician</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <input type="text" placeholder="Full Name *" value={addForm.fullName}
                onChange={(e) => setAddForm({ ...addForm, fullName: e.target.value })}
                className={inputCls(addErrors.fullName)} />
              {addErrors.fullName && <p className="text-[10px] text-red-400 mt-0.5">{addErrors.fullName}</p>}
            </div>
            <div>
              <input type="text" placeholder="Role / Title *" value={addForm.roleTitle}
                onChange={(e) => setAddForm({ ...addForm, roleTitle: e.target.value })}
                className={inputCls(addErrors.roleTitle)} />
              {addErrors.roleTitle && <p className="text-[10px] text-red-400 mt-0.5">{addErrors.roleTitle}</p>}
            </div>
            <div>
              <input type="tel" placeholder="Phone *" value={addForm.phone}
                onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                className={inputCls(addErrors.phone)} />
              {addErrors.phone && <p className="text-[10px] text-red-400 mt-0.5">{addErrors.phone}</p>}
            </div>
            <div>
              <input type="email" placeholder="Email *" value={addForm.email}
                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                className={inputCls(addErrors.email)} />
              {addErrors.email && <p className="text-[10px] text-red-400 mt-0.5">{addErrors.email}</p>}
            </div>
            <input type="text" placeholder="City" value={addForm.city}
              onChange={(e) => setAddForm({ ...addForm, city: e.target.value })}
              className={inputCls()} />
            <input type="text" placeholder="State" value={addForm.state}
              onChange={(e) => setAddForm({ ...addForm, state: e.target.value })}
              className={inputCls()} />
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={() => { setShowAddForm(false); setAddErrors({}); }}
              className="px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors">
              Cancel
            </button>
            <button onClick={handleAdd}
              className="px-3 py-1 text-xs font-medium rounded-md bg-[#F5C518] text-neutral-950 hover:bg-[#F5C518]/90 transition-colors">
              Add
            </button>
          </div>
        </div>
      )}

      {/* Tech card list */}
      {technicians.length === 0 ? (
        <p className="text-xs text-gray-600 text-center py-4">No technicians on roster.</p>
      ) : (
        <div className="space-y-1">
          {technicians.map((tech) => {
            const isEditing = editingId === tech.id;
            const isRemoving = removingId === tech.id;
            const activeWO = workOrders.find(
              (wo) => wo.assignedTechnicianId === tech.id &&
                (wo.status === 'dispatched' || wo.status === 'in-progress')
            );
            const todayJobs = workOrders.filter(
              (wo) => wo.assignedTechnicianId === tech.id && wo.completedAt && new Date(wo.completedAt) >= todayStart
            ).length;
            const risk = activeWO ? getSlaRisk(activeWO) : null;
            const jobColor = risk ? (slaRiskJobColor[risk] ?? 'text-[#F5C518]') : 'text-[#F5C518]';

            if (isEditing && editForm) {
              return (
                <div key={tech.id} className="p-3 rounded-lg border border-[#F5C518]/20 bg-neutral-800/50">
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <input value={editForm.fullName}
                      onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                      placeholder="Full Name" className={inputCls()} />
                    <input value={editForm.roleTitle}
                      onChange={(e) => setEditForm({ ...editForm, roleTitle: e.target.value })}
                      placeholder="Role" className={inputCls()} />
                    <select value={editForm.currentStatus}
                      onChange={(e) => setEditForm({ ...editForm, currentStatus: e.target.value as TechnicianStatus })}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#F5C518]">
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{statusLabel[s]}</option>)}
                    </select>
                    <input value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="Phone" className={inputCls()} />
                    <input value={editForm.city}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      placeholder="City" className={inputCls()} />
                    <input value={editForm.state}
                      onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                      placeholder="State" className={inputCls()} />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={cancelEdit}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors">
                      <XIcon className="w-3 h-3" /> Cancel
                    </button>
                    <button onClick={() => saveEdit(tech.id)}
                      className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded text-green-400 hover:bg-green-500/10 transition-colors">
                      <Check className="w-3 h-3" /> Save
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={tech.id}
                data-tech-id={tech.id}
                className={`group flex items-center gap-2.5 p-2.5 rounded-lg border transition-colors ${
                  isRemoving
                    ? 'border-red-500/30 bg-red-900/10'
                    : 'border-transparent hover:border-slate-700/60 hover:bg-neutral-800/40'
                }`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 uppercase ${avatarBg[tech.currentStatus]}`}>
                  {initials(tech.fullName)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-medium text-white leading-tight">{tech.fullName}</span>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${statusPillCls[tech.currentStatus]}`}>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusDotCls[tech.currentStatus]}`} />
                      {statusLabel[tech.currentStatus]}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 truncate leading-tight">{tech.roleTitle}</p>
                  <p className="text-[11px] text-gray-600 truncate leading-tight">
                    {tech.city && tech.state ? `${tech.city}, ${tech.state}` : tech.phone}
                  </p>
                  {activeWO && (
                    <button
                      onClick={() => onWorkOrderClick(activeWO)}
                      className={`text-[10px] font-mono mt-0.5 hover:underline leading-tight block truncate max-w-full ${jobColor}`}
                      title={activeWO.title}
                    >
                      {activeWO.id} · {formatDuration(activeWO.startedAt ?? activeWO.dispatchedAt ?? activeWO.createdAt)}
                    </button>
                  )}
                </div>

                {/* Right: today count + assign + hover actions */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  {todayJobs > 0 && (
                    <span className="text-[10px] text-gray-500 tabular-nums">{todayJobs} today</span>
                  )}
                  {tech.currentStatus === 'available' && !activeWO && unassignedWO && (
                    <button
                      onClick={() => onWorkOrderClick(unassignedWO)}
                      className="text-[10px] font-medium text-[#F5C518]/60 hover:text-[#F5C518] transition-colors whitespace-nowrap"
                    >
                      Assign →
                    </button>
                  )}
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onMessageTechnician(tech)}
                      className="p-1 rounded text-gray-500 hover:text-[#F5C518] hover:bg-[#F5C518]/10 transition-colors"
                      title="Message"
                    >
                      <MessageSquare className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => startEdit(tech)}
                      className="p-1 rounded text-gray-500 hover:text-[#F5C518] hover:bg-[#F5C518]/10 transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleRemove(tech.id)}
                      className={`p-1 rounded transition-colors ${
                        isRemoving ? 'text-red-400 bg-red-500/10' : 'text-gray-500 hover:text-red-400 hover:bg-red-500/10'
                      }`}
                      title={isRemoving ? 'Click to confirm' : 'Remove'}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  {isRemoving && <span className="text-[10px] text-red-400">Confirm?</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
