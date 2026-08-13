'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function DataTable({ headers, children, title, subtitle, actionButton }) {
  return (
    <div className="bg-white border border-[#D8D0C1] rounded-2xl shadow-sm overflow-hidden">
      {(title || actionButton) && (
        <div className="p-6 border-b border-[#D8D0C1]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#FBF9F4] via-white to-[#F4F0E6]/30">
          <div>
            {title && <h2 className="text-lg font-extrabold text-[#211E1A] tracking-tight">{title}</h2>}
            {subtitle && <p className="text-xs text-[#756F66] font-medium mt-0.5">{subtitle}</p>}
          </div>
          {actionButton && <div>{actionButton}</div>}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-[#211E1A]">
          <thead className="bg-[#F4F0E6]/80 text-[#756F66] uppercase text-[10px] tracking-wider font-extrabold border-b border-[#D8D0C1]">
            <tr>
              {headers.map((header, idx) => (
                <th key={idx} className="px-6 py-4">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D8D0C1]/40 bg-white">
            {children}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-6 py-3.5 bg-[#FBF9F4] border-t border-[#D8D0C1]/60 flex items-center justify-between text-xs text-[#756F66]">
        <span>Showing 1-10 of records</span>
        <div className="flex items-center gap-1.5">
          <button className="p-1.5 rounded-lg border border-[#D8D0C1] hover:bg-[#EAE3D5] text-[#211E1A] disabled:opacity-40 cursor-pointer">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2.5 py-1 rounded-md bg-[#7A1F2B] text-white font-bold text-xs">1</span>
          <button className="p-1.5 rounded-lg border border-[#D8D0C1] hover:bg-[#EAE3D5] text-[#211E1A] cursor-pointer">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
