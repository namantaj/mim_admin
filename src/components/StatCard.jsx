'use client';

import React from 'react';
import { Users, Clock, CheckCircle2, HelpCircle, TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';

const iconMap = {
  Users: Users,
  Clock: Clock,
  CheckCircle2: CheckCircle2,
  HelpCircle: HelpCircle,
};

export default function StatCard({ stat }) {
  const IconComponent = iconMap[stat.icon] || Users;
  const isUp = stat.trend === 'up';

  return (
    <div className="bg-gradient-to-br from-white via-[#FBF9F4] to-[#F5F1E8]/40 border border-[#D8D0C1]/90 rounded-2xl p-5 shadow-xs hover:shadow-xl hover:-translate-y-1 hover:border-[#7A1F2B]/30 transition-all duration-300 relative overflow-hidden group">
      {/* Background Decorative Accent */}
      <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-[#7A1F2B]/3 group-hover:scale-150 transition-transform duration-500 pointer-events-none" />

      <div className="flex items-center justify-between relative z-10">
        <span className="text-xs font-bold uppercase tracking-wider text-[#756F66]">{stat.label}</span>
        {/* Soft rounded-xl colored icon badge with ring */}
        <div className={`p-3 rounded-xl ${stat.badgeBg} ${stat.iconColor} ring-4 ring-white shadow-xs group-hover:scale-110 transition-transform duration-300`}>
          <IconComponent className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between relative z-10">
        <h3 className="text-2.5xl font-black text-[#211E1A] tracking-tight group-hover:text-[#7A1F2B] transition-colors">
          {stat.value}
        </h3>
      </div>

      {/* Progress / Trend bar */}
      <div className="mt-3.5 space-y-1.5 relative z-10">
        <div className="w-full bg-[#EAE3D5] h-1.5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isUp ? 'bg-gradient-to-r from-[#28553F] to-emerald-500' : 'bg-gradient-to-r from-[#7A1F2B] to-[#B8953D]'
              }`}
            style={{ width: isUp ? '78%' : '45%' }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] font-semibold text-[#756F66]">
          <span className="flex items-center gap-1">
            {isUp ? (
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-amber-600" />
            )}
            <span className={isUp ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
              {stat.change}
            </span>
          </span>
          <span className="text-[10px] text-[#756F66]/70 uppercase tracking-wider">Live</span>
        </div>
      </div>
    </div>
  );
}
