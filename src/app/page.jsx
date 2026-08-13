'use client';

import React from 'react';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { statsData, recentActivity } from '../data/mockData';
import { 
  ArrowUpRight, 
  ShieldCheck, 
  Activity, 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Download,
  PlusCircle,
  Crown
} from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '../context/LanguageContext';

export default function DashboardPage() {
  const { t, locale } = useLanguage();

  const localizedStats = statsData.map(stat => {
    if (stat.id === 'total-members') return { ...stat, label: t('dashboard.totalMembers') };
    if (stat.id === 'pending-withdrawals') return { ...stat, label: t('dashboard.pendingWithdrawals') };
    if (stat.id === 'total-payouts') return { ...stat, label: t('dashboard.totalPayouts') };
    if (stat.id === 'support-tickets') return { ...stat, label: t('dashboard.openTickets') };
    return stat;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#7A1F2B] via-[#621822] to-[#4D121B] text-white p-8 shadow-2xl ring-1 ring-white/10">
        {/* Background Decorative Accents */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 rounded-full bg-gradient-to-br from-[#B8953D]/20 to-transparent blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-48 h-48 rounded-full bg-[#7A1F2B]/40 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B8953D]/20 border border-[#B8953D]/30 text-[#FBF9F4] text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
              <Crown className="w-3.5 h-3.5 text-[#B8953D]" />
              <span>SUPER ADMIN WORKSPACE</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-[#FBF9F4]">
              {t('dashboard.welcome')}
            </h1>
            <p className="text-sm text-[#FBF9F4]/80 leading-relaxed font-medium">
              {t('dashboard.subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href="/payouts"
              className="inline-flex items-center gap-2 px-5 py-3 bg-[#B8953D] hover:bg-[#a38233] text-white text-xs font-extrabold rounded-full shadow-lg shadow-[#B8953D]/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>{t('dashboard.processPayouts')}</span>
            </Link>

            <Link
              href="/members"
              className="inline-flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-extrabold rounded-full backdrop-blur-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t('dashboard.manageMembers')}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-[#211E1A] tracking-tight">
            {locale === 'hi' ? 'वित्तीय और सदस्य मेट्रिक्स' : 'Financial & Member Metrics'}
          </h2>
          <span className="text-xs text-[#756F66] font-semibold">Updated live</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {localizedStats.map((stat) => (
            <StatCard key={stat.id} stat={stat} />
          ))}
        </div>
      </div>

      {/* Main Content 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent Activity */}
        <div className="lg:col-span-2">
          <DataTable
            title={t('dashboard.recentActivity')}
            subtitle={t('dashboard.recentActivitySub')}
            headers={['User', 'Action', 'Details', 'Type', 'Time', 'Status']}
            actionButton={
              <Link
                href="/members"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#7A1F2B] hover:underline"
              >
                {t('dashboard.viewAll')}
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            {recentActivity.map((item) => (
              <tr key={item.id} className="hover:bg-[#F4F0E6]/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.avatar}
                      alt={item.user}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-[#D8D0C1]"
                    />
                    <div>
                      <span className="font-extrabold text-[#211E1A] block">{item.user}</span>
                      <span className="text-[10px] text-[#756F66] font-medium">{item.id}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 font-bold text-[#211E1A] text-xs">{item.action}</td>
                <td className="px-6 py-4 text-[#756F66] text-xs font-medium">{item.details}</td>
                <td className="px-6 py-4">
                  <span className="inline-block text-[10px] font-bold bg-[#EAE3D5] text-[#211E1A] px-2.5 py-0.5 rounded-full border border-[#D8D0C1]">
                    {item.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-[#756F66] text-xs">{item.time}</td>
                <td className="px-6 py-4">
                  <StatusBadge status={item.status} />
                </td>
              </tr>
            ))}
          </DataTable>
        </div>

        {/* Right Column: System Health & Summary */}
        <div className="space-y-6">
          <div className="bg-white border border-[#D8D0C1] rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-[#D8D0C1]/60 pb-3">
              <h3 className="font-extrabold text-base text-[#211E1A] flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#7A1F2B]" />
                <span>{t('dashboard.systemOperations')}</span>
              </h3>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F4F0E6]/70 border border-[#D8D0C1]/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#B8953D]/15 text-[#B8953D]">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-[#211E1A]">
                      {locale === 'hi' ? 'लंबित स्वीकृतियां' : 'Pending Approvals'}
                    </p>
                    <p className="text-[#756F66] text-[11px]">18 Withdrawal requests</p>
                  </div>
                </div>
                <Link href="/payouts" className="text-[11px] font-bold text-[#7A1F2B] hover:underline">
                  Review
                </Link>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F4F0E6]/70 border border-[#D8D0C1]/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#28553F]/15 text-[#28553F]">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-[#211E1A]">
                      {locale === 'hi' ? 'केवाईसी स्थिति' : 'KYC Compliance'}
                    </p>
                    <p className="text-[#756F66] text-[11px]">94.2% members verified</p>
                  </div>
                </div>
                <span className="font-bold text-[#28553F]">Healthy</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
