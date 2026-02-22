'use client';

import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import type { Message } from '@/data/seed-data';

interface MessageThreadProps {
  messages: Message[];
  currentUserId: string;
  onSend: (body: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

function formatMessageTime(isoString: string): string {
  return new Date(isoString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const senderTypeColor: Record<Message['senderType'], string> = {
  team: 'bg-blue-500/20 text-blue-300',
  'vendor-admin': 'bg-yellow-500/20 text-yellow-300',
  technician: 'bg-emerald-500/20 text-emerald-300',
};

export function MessageThread({
  messages,
  currentUserId,
  onSend,
  placeholder = 'Type a message…',
  disabled = false,
}: MessageThreadProps) {
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setDraft('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.length === 0 ? (
          <p className="text-sm text-gray-500 italic text-center py-8">
            No messages yet. Be the first to send one.
          </p>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.senderId === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div
                  className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${senderTypeColor[msg.senderType]}`}
                >
                  {getInitials(msg.senderName)}
                </div>

                {/* Bubble */}
                <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                  {!isOwn && (
                    <span className="text-[10px] text-gray-500 ml-1">
                      {msg.senderName}
                    </span>
                  )}
                  <div
                    className={`px-3 py-2 rounded-xl text-sm leading-relaxed ${
                      isOwn
                        ? 'bg-[#F5C518]/10 text-gray-100 border border-[#F5C518]/20'
                        : 'bg-neutral-800 text-gray-200'
                    }`}
                  >
                    {msg.body}
                  </div>
                  <span className="text-[10px] text-gray-600 mx-1">
                    {formatMessageTime(msg.timestamp)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="mt-3 flex gap-2 items-end border-t border-neutral-800 pt-3">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#F5C518] disabled:opacity-50"
          style={{ minHeight: '38px', maxHeight: '96px' }}
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = 'auto';
            el.style.height = Math.min(el.scrollHeight, 96) + 'px';
          }}
        />
        <button
          onClick={handleSend}
          disabled={!draft.trim() || disabled}
          className="flex-shrink-0 p-2 rounded-lg bg-[#F5C518] text-neutral-950 hover:bg-[#F5C518]/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
