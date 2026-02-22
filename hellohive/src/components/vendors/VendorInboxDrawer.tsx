'use client';

import { useState } from 'react';
import { X, ArrowLeft, MessageSquare } from 'lucide-react';
import { MessageThread } from '@/components/vendors/MessageThread';
import type { Conversation } from '@/data/seed-data';

interface VendorInboxDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  currentUserId: string;
  onSendMessage: (conversationId: string, body: string) => void;
  onMarkRead: (conversationId: string) => void;
  initialConversationId?: string;
}

function formatTimeAgo(isoString?: string): string {
  if (!isoString) return '';
  const ms = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getConversationTitle(conv: Conversation): string {
  if (conv.type === 'work-order' && conv.workOrderId) {
    return conv.workOrderId;
  }
  return conv.participantNames.join(', ');
}

function getConversationSubtitle(conv: Conversation): string {
  if (conv.type === 'work-order') {
    return conv.participantNames.join(' · ');
  }
  return 'Direct message';
}

export function VendorInboxDrawer({
  isOpen,
  onClose,
  conversations,
  currentUserId,
  onSendMessage,
  onMarkRead,
  initialConversationId,
}: VendorInboxDrawerProps) {
  const [selectedConvId, setSelectedConvId] = useState<string | null>(
    initialConversationId ?? null
  );

  // Sync initial conversation when prop changes (e.g. opened from tech grid)
  const selectedConv = conversations.find((c) => c.id === selectedConvId) ?? null;

  const handleSelectConv = (conv: Conversation) => {
    setSelectedConvId(conv.id);
    onMarkRead(conv.id);
  };

  const handleBack = () => {
    setSelectedConvId(null);
  };

  const getUnreadCount = (conv: Conversation): number => {
    return conv.messages.filter((m) => !m.readBy.includes(currentUserId)).length;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-sm bg-neutral-900 border-l border-neutral-800 z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            {selectedConv && (
              <button
                onClick={handleBack}
                className="text-gray-400 hover:text-white transition-colors mr-1"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <MessageSquare className="w-4 h-4 text-[#F5C518]" />
            <h2 className="text-sm font-semibold text-white">
              {selectedConv
                ? getConversationTitle(selectedConv)
                : 'Inbox'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        {selectedConv ? (
          /* Thread view */
          <div className="flex-1 overflow-y-auto p-4 flex flex-col min-h-0">
            <div className="mb-3">
              <p className="text-xs text-gray-500">{getConversationSubtitle(selectedConv)}</p>
            </div>
            <div className="flex-1 min-h-0">
              <MessageThread
                messages={selectedConv.messages}
                currentUserId={currentUserId}
                onSend={(body) => onSendMessage(selectedConv.id, body)}
                placeholder="Type a message…"
              />
            </div>
          </div>
        ) : (
          /* Conversation list */
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-6 text-center">
                <MessageSquare className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No conversations yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-800">
                {conversations.map((conv) => {
                  const unread = getUnreadCount(conv);
                  const lastMsg = conv.messages[conv.messages.length - 1];
                  return (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConv(conv)}
                      className="w-full text-left px-4 py-3 hover:bg-neutral-800/50 transition-colors flex gap-3 items-start"
                    >
                      {/* Avatar */}
                      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-neutral-700 flex items-center justify-center text-xs font-bold text-gray-300 mt-0.5">
                        {conv.type === 'work-order'
                          ? 'WO'
                          : getInitials(conv.participantNames.find((n) => !n.includes('Johnson Controls') && !n.includes('Sarah Chen') ? n : '') ?? conv.participantNames[0])}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-sm font-medium truncate ${unread > 0 ? 'text-white' : 'text-gray-300'}`}>
                            {getConversationTitle(conv)}
                          </span>
                          <span className="text-[10px] text-gray-500 flex-shrink-0">
                            {formatTimeAgo(conv.lastMessageAt)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <p className={`text-xs truncate ${unread > 0 ? 'text-gray-300' : 'text-gray-500'}`}>
                            {conv.lastMessagePreview ?? (lastMsg?.body ?? 'No messages yet')}
                          </p>
                          {unread > 0 && (
                            <span className="flex-shrink-0 w-4 h-4 bg-[#F5C518] rounded-full text-[10px] text-neutral-950 font-bold flex items-center justify-center">
                              {unread}
                            </span>
                          )}
                        </div>
                        {conv.type === 'work-order' && (
                          <p className="text-[10px] text-gray-600 mt-0.5 truncate">
                            {conv.participantNames.join(' · ')}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
