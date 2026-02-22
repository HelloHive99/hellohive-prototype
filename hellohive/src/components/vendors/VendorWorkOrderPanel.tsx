'use client';

import { useState } from 'react';
import { X, Calendar, MapPin, Package, User } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { MessageThread } from '@/components/vendors/MessageThread';
import type { WorkOrder, WorkOrderStatus, Technician, Property, Conversation } from '@/data/seed-data';

interface VendorWorkOrderPanelProps {
  workOrder: WorkOrder;
  onClose: () => void;
  onStatusUpdate: (id: string, status: WorkOrderStatus) => void;
  isVendorAdmin: boolean;
  vendorTechnicians: Technician[];
  properties: Property[];
  onAssignTechnician: (workOrderId: string, technicianId: string | undefined) => void;
  currentUserId: string;
  conversation?: Conversation;
  onSendMessage?: (body: string) => void;
  onMarkRead?: () => void;
}

const statusVariant: Record<WorkOrderStatus, 'completed' | 'in-progress' | 'open' | 'overdue' | 'pending' | 'dispatched'> = {
  open: 'open',
  'in-progress': 'in-progress',
  completed: 'completed',
  overdue: 'overdue',
  dispatched: 'dispatched',
};

const priorityColors: Record<string, string> = {
  critical: 'text-red-400',
  high: 'text-orange-400',
  medium: 'text-yellow-400',
  low: 'text-gray-400',
};

const priorityBg: Record<string, string> = {
  critical: 'bg-red-500/10 border-red-500/20 text-red-400',
  high: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
  medium: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
  low: 'bg-gray-500/10 border-gray-500/20 text-gray-400',
};

export function VendorWorkOrderPanel({
  workOrder,
  onClose,
  onStatusUpdate,
  isVendorAdmin,
  vendorTechnicians,
  properties,
  onAssignTechnician,
  currentUserId,
  conversation,
  onSendMessage,
  onMarkRead,
}: VendorWorkOrderPanelProps) {
  const [selectedTechId, setSelectedTechId] = useState<string>(
    workOrder.assignedTechnicianId ?? ''
  );
  const [activeTab, setActiveTab] = useState<'details' | 'messages'>('details');

  // Resolve property and space names
  const property = properties.find((p) => p.id === workOrder.propertyId);
  const space = property?.spaces.find((s) => s.id === workOrder.spaceId);
  const asset = space?.assets.find((a) => a.id === workOrder.assetId);

  const currentTech = vendorTechnicians.find(
    (t) => t.id === workOrder.assignedTechnicianId
  );

  const handleAssign = () => {
    onAssignTechnician(workOrder.id, selectedTechId || undefined);
  };

  const formatDate = (iso?: string) => {
    if (!iso) return null;
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isEditable = workOrder.status === 'dispatched' || workOrder.status === 'in-progress';

  // Unread count for badge on Messages tab
  const unreadCount = conversation
    ? conversation.messages.filter((m) => !m.readBy.includes(currentUserId)).length
    : 0;

  const handleTabSwitch = (tab: 'details' | 'messages') => {
    setActiveTab(tab);
    if (tab === 'messages' && onMarkRead) {
      onMarkRead();
    }
  };

  const handleSend = (body: string) => {
    if (onSendMessage) {
      onSendMessage(body);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-lg bg-neutral-900 border-l border-neutral-800 z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-neutral-800">
          <div className="flex-1 min-w-0 pr-4">
            <p className="text-xs text-gray-500 font-mono mb-1">{workOrder.id}</p>
            <h2 className="text-lg font-semibold text-white leading-snug">{workOrder.title}</h2>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant={statusVariant[workOrder.status]}>{workOrder.status}</Badge>
              <span className={`text-xs font-medium px-2 py-0.5 rounded border ${priorityBg[workOrder.priority]}`}>
                {workOrder.priority.charAt(0).toUpperCase() + workOrder.priority.slice(1)} priority
              </span>
              <span className="text-xs text-gray-500 bg-neutral-800 px-2 py-0.5 rounded border border-neutral-700">
                {workOrder.category}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors mt-1 flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab strip */}
        <div className="flex border-b border-neutral-800 px-5">
          <button
            onClick={() => handleTabSwitch('details')}
            className={`py-2.5 px-1 mr-5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'details'
                ? 'border-[#F5C518] text-[#F5C518]'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            Details
          </button>
          <button
            onClick={() => handleTabSwitch('messages')}
            className={`py-2.5 px-1 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'messages'
                ? 'border-[#F5C518] text-[#F5C518]'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            Messages
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center w-4 h-4 bg-[#F5C518] text-neutral-950 text-[10px] font-bold rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Scrollable body */}
        {activeTab === 'details' ? (
          <div className="flex-1 overflow-y-auto p-5 space-y-5">

            {/* Description */}
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Description</p>
              <p className="text-sm text-gray-300 leading-relaxed">{workOrder.description}</p>
            </div>

            {/* Location */}
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Location</p>
              <div className="bg-neutral-800 rounded-lg p-3 space-y-2">
                {property && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                    <span className="text-sm text-gray-300">{property.name}</span>
                  </div>
                )}
                {space && (
                  <div className="flex items-center gap-2 pl-5">
                    <span className="text-xs text-gray-500">Space:</span>
                    <span className="text-sm text-gray-400">{space.name}</span>
                  </div>
                )}
                {asset && (
                  <div className="flex items-center gap-2">
                    <Package className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                    <span className="text-xs text-gray-500">Asset:</span>
                    <span className="text-sm text-gray-400">{asset.name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Dates */}
            {(workOrder.dueDate || workOrder.createdAt) && (
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Timeline</p>
                <div className="bg-neutral-800 rounded-lg p-3 space-y-2">
                  {workOrder.createdAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" /> Created
                      </span>
                      <span className="text-sm text-gray-300">{formatDate(workOrder.createdAt)}</span>
                    </div>
                  )}
                  {workOrder.dueDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" /> Due
                      </span>
                      <span className={`text-sm font-medium ${
                        new Date(workOrder.dueDate) < new Date() && workOrder.status !== 'completed'
                          ? 'text-red-400'
                          : 'text-gray-300'
                      }`}>
                        {formatDate(workOrder.dueDate)}
                      </span>
                    </div>
                  )}
                  {workOrder.completedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" /> Completed
                      </span>
                      <span className="text-sm text-green-400">{formatDate(workOrder.completedAt)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Technician Assignment (Vendor-Admin only) */}
            {isVendorAdmin && (
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Technician Assignment</p>
                <div className="bg-neutral-800 rounded-lg p-3 space-y-3">
                  {currentTech && (
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-gray-500" />
                      <span className="text-sm text-gray-300">{currentTech.fullName}</span>
                      <span className="text-xs text-gray-500">— {currentTech.roleTitle}</span>
                    </div>
                  )}
                  {!currentTech && (
                    <p className="text-sm text-gray-500 italic">No technician assigned</p>
                  )}
                  {isEditable && vendorTechnicians.length > 0 && (
                    <div className="flex gap-2">
                      <select
                        value={selectedTechId}
                        onChange={(e) => setSelectedTechId(e.target.value)}
                        className="flex-1 bg-neutral-900 border border-neutral-700 rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#F5C518]"
                      >
                        <option value="">— Unassigned —</option>
                        {vendorTechnicians.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.fullName} ({t.currentStatus})
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleAssign}
                        disabled={selectedTechId === (workOrder.assignedTechnicianId ?? '')}
                        className="px-3 py-1.5 text-sm font-medium rounded-md bg-[#F5C518] text-neutral-950 hover:bg-[#F5C518]/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Assign
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Current assignee (Vendor-Tech view) */}
            {!isVendorAdmin && currentTech && (
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Assigned To</p>
                <div className="bg-neutral-800 rounded-lg p-3 flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-sm text-gray-300">{currentTech.fullName}</span>
                  <span className="text-xs text-gray-500">— {currentTech.roleTitle}</span>
                </div>
              </div>
            )}

          </div>
        ) : (
          /* Messages tab */
          <div className="flex-1 overflow-y-auto p-5 flex flex-col min-h-0">
            <MessageThread
              messages={conversation?.messages ?? []}
              currentUserId={currentUserId}
              onSend={handleSend}
              placeholder="Message the team about this work order…"
            />
          </div>
        )}

        {/* Footer: status update actions (details tab only) */}
        {activeTab === 'details' && isEditable && (
          <div className="p-5 border-t border-neutral-800 space-y-2">
            <p className="text-xs text-gray-500 mb-3">Update status</p>
            {workOrder.status === 'dispatched' && (
              <button
                onClick={() => { onStatusUpdate(workOrder.id, 'in-progress'); onClose(); }}
                className="w-full py-2.5 text-sm font-medium rounded-lg bg-[#F5C518]/10 text-[#F5C518] border border-[#F5C518]/20 hover:bg-[#F5C518]/20 transition-colors"
              >
                Mark In Progress
              </button>
            )}
            {workOrder.status === 'in-progress' && (
              <button
                onClick={() => { onStatusUpdate(workOrder.id, 'completed'); onClose(); }}
                className="w-full py-2.5 text-sm font-medium rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors"
              >
                Mark Completed
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
