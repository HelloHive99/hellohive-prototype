'use client';

import { useState } from 'react';
import { format } from 'date-fns';

interface DateFilterDropdownProps {
  label: string;
  value: 'all' | 'last24h' | 'last7d' | 'overdue' | 'next3d' | 'custom';
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  onCustomClick: () => void;
  customDateRange?: { from?: string; to?: string };
}

export function DateFilterDropdown({
  label,
  value,
  onChange,
  options,
  onCustomClick,
  customDateRange,
}: DateFilterDropdownProps) {
  const getDisplayText = () => {
    if (value === 'all') return 'All';
    if (value === 'custom' && customDateRange?.from && customDateRange?.to) {
      const from = format(new Date(customDateRange.from), 'MMM d');
      const to = format(new Date(customDateRange.to), 'MMM d');
      return `${from} - ${to}`;
    }
    const option = options.find(opt => opt.value === value);
    return option?.label || 'All';
  };

  return (
    <select
      value={value}
      onChange={(e) => {
        if (e.target.value === 'custom') {
          onCustomClick();
        } else {
          onChange(e.target.value);
        }
      }}
      className={`w-full bg-neutral-800 border rounded-lg px-3 py-2 text-sm text-white ${
        value !== 'all'
          ? 'border-[#F5C518] ring-1 ring-[#F5C518]/20'
          : 'border-gray-700'
      } focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent`}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>
          {opt.value === 'custom' && customDateRange?.from ? getDisplayText() : opt.label}
        </option>
      ))}
    </select>
  );
}
