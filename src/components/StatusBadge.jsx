'use client';

import React from 'react';

export default function StatusBadge({ status, type }) {
  const getBadgeStyle = () => {
    const val = (status || type || '').toLowerCase();
    
    if (val === 'active' || val === 'approved' || val === 'completed') {
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    }
    if (val === 'inactive' || val === 'rejected') {
      return 'bg-rose-100 text-rose-800 border-rose-300';
    }
    if (val === 'pending') {
      return 'bg-amber-100 text-amber-800 border-amber-300';
    }
    if (val === 'withdrawal') {
      return 'bg-[#7A1F2B]/10 text-[#7A1F2B] border-[#7A1F2B]/20';
    }
    if (val === 'deposit') {
      return 'bg-[#28553F]/10 text-[#28553F] border-[#28553F]/20';
    }
    if (val === 'bonus') {
      return 'bg-[#B8953D]/15 text-[#B8953D] border-[#B8953D]/30';
    }

    return 'bg-gray-100 text-gray-700 border-gray-300';
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getBadgeStyle()}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-70" />
      {status || type}
    </span>
  );
}
