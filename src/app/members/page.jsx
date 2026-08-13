'use client';

import React, { useState } from 'react';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { initialMembers } from '../../data/mockData';
import { 
  Search, 
  Filter, 
  Eye, 
  UserCheck, 
  UserX, 
  X, 
  Mail, 
  Phone, 
  Calendar, 
  Award,
  Crown,
  Wallet,
  Building2,
  CheckCircle2
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function MembersPage() {
  const { t } = useLanguage();
  const [members, setMembers] = useState(initialMembers);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedMember, setSelectedMember] = useState(null);

  // Filtered members list
  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.rank.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.sponsor.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All' || member.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getRankBadgeStyle = (rank) => {
    if (rank.includes('Diamond')) {
      return 'bg-sky-50 text-sky-800 border-sky-300 shadow-xs';
    }
    if (rank.includes('Platinum')) {
      return 'bg-slate-100 text-slate-800 border-slate-300 shadow-xs';
    }
    if (rank.includes('Gold')) {
      return 'bg-[#B8953D]/15 text-[#B8953D] border-[#B8953D]/30 shadow-xs';
    }
    if (rank.includes('Silver')) {
      return 'bg-gray-100 text-gray-700 border-gray-300';
    }
    return 'bg-amber-100 text-amber-800 border-amber-300';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Breadcrumb & Page Header */}
      <div>
        <nav className="flex items-center gap-2 text-xs text-[#756F66] font-medium mb-1">
          <span>Home</span>
          <span>/</span>
          <span className="text-[#7A1F2B] font-semibold">{t('nav.members')}</span>
        </nav>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-[#211E1A] tracking-tight">{t('members.title')}</h1>
            <p className="text-sm text-[#756F66] font-medium mt-0.5">
              {t('members.subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-4 py-2 bg-white border border-[#D8D0C1] rounded-full text-[#756F66] shadow-xs">
              Showing <span className="text-[#7A1F2B] font-black">{filteredMembers.length}</span> of {members.length} Members
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#D8D0C1] rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        {/* Search Input */}
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#756F66]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('members.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2.5 text-xs font-medium bg-[#F4F0E6]/50 border border-[#D8D0C1] rounded-full focus:outline-none focus:ring-2 focus:ring-[#7A1F2B] focus:bg-white text-[#211E1A] transition shadow-inner"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 text-xs font-bold text-[#756F66]">
            <Filter className="w-4 h-4 text-[#7A1F2B]" />
            <span>{t('members.filterStatus')}</span>
          </div>
          <div className="flex items-center bg-[#F4F0E6] p-1 rounded-full border border-[#D8D0C1]">
            {[
              { key: 'All', label: t('members.all') },
              { key: 'Active', label: t('members.active') },
              { key: 'Inactive', label: t('members.inactive') }
            ].map((status) => (
              <button
                key={status.key}
                onClick={() => setStatusFilter(status.key)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === status.key
                    ? 'bg-[#7A1F2B] text-white shadow-xs'
                    : 'text-[#756F66] hover:text-[#211E1A]'
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Members Data Table */}
      <DataTable
        headers={['Member', 'Email', 'Rank Badge', 'Sponsor', 'Status', 'Joined Date', 'Actions']}
      >
        {filteredMembers.length === 0 ? (
          <tr>
            <td colSpan={7} className="px-6 py-12 text-center text-[#756F66]">
              No members found matching your search parameters.
            </td>
          </tr>
        ) : (
          filteredMembers.map((member) => (
            <tr key={member.id} className="hover:bg-[#F4F0E6]/50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#7A1F2B] to-[#621822] text-white flex items-center justify-center font-bold text-xs shadow-xs ring-2 ring-[#B8953D]/30">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <span className="font-extrabold text-[#211E1A] text-xs block">{member.name}</span>
                    <span className="text-[10px] font-mono text-[#756F66]">{member.id}</span>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-[#756F66] text-xs font-medium">{member.email}</td>
              <td className="px-6 py-4">
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-extrabold px-3 py-1 rounded-full border ${getRankBadgeStyle(member.rank)}`}>
                  <Award className="w-3.5 h-3.5" />
                  {member.rank}
                </span>
              </td>
              <td className="px-6 py-4 text-xs font-bold text-[#211E1A]">{member.sponsor}</td>
              <td className="px-6 py-4">
                <StatusBadge status={member.status} />
              </td>
              <td className="px-6 py-4 text-xs text-[#756F66] font-medium">{member.joinedDate}</td>
              <td className="px-6 py-4">
                <button
                  onClick={() => setSelectedMember(member)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-full border border-[#7A1F2B] text-[#7A1F2B] hover:bg-[#7A1F2B] hover:text-white transition-all cursor-pointer shadow-2xs active:scale-95"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{t('members.viewDetails')}</span>
                </button>
              </td>
            </tr>
          ))
        )}
      </DataTable>

      {/* Member Details Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-[#D8D0C1] rounded-3xl max-w-lg w-full p-7 shadow-2xl space-y-6 relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setSelectedMember(null)}
              className="absolute top-5 right-5 p-1.5 rounded-full text-[#756F66] hover:bg-[#F4F0E6] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 border-b border-[#D8D0C1]/60 pb-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#7A1F2B] to-[#621822] text-white flex items-center justify-center font-black text-xl shadow-lg ring-4 ring-[#B8953D]/30">
                {selectedMember.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-xl text-[#211E1A]">{selectedMember.name}</h3>
                  <StatusBadge status={selectedMember.status} />
                </div>
                <p className="text-xs text-[#756F66] font-mono mt-0.5">{selectedMember.id}</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#F4F0E6]/70 rounded-xl border border-[#D8D0C1]/60 space-y-1">
                  <span className="text-[#756F66] text-[10px] uppercase font-bold tracking-wider">Rank Status</span>
                  <p className="font-black text-[#B8953D] flex items-center gap-1.5 text-xs">
                    <Award className="w-4 h-4" />
                    {selectedMember.rank}
                  </p>
                </div>
                <div className="p-3 bg-[#F4F0E6]/70 rounded-xl border border-[#D8D0C1]/60 space-y-1">
                  <span className="text-[#756F66] text-[10px] uppercase font-bold tracking-wider">Wallet Balance</span>
                  <p className="font-black text-[#28553F] text-xs">{selectedMember.walletBalance}</p>
                </div>
              </div>

              <div className="p-4 bg-white rounded-xl border border-[#D8D0C1] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[#756F66] font-medium flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#7A1F2B]" /> Email Address:
                  </span>
                  <span className="font-bold text-[#211E1A]">{selectedMember.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#756F66] font-medium flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#7A1F2B]" /> Phone Number:
                  </span>
                  <span className="font-bold text-[#211E1A]">{selectedMember.phone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#756F66] font-medium flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#7A1F2B]" /> Direct Sponsor:
                  </span>
                  <span className="font-bold text-[#211E1A]">{selectedMember.sponsor}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#756F66] font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#756F66]" /> Registration Date:
                  </span>
                  <span className="font-bold text-[#211E1A]">{selectedMember.joinedDate}</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedMember(null)}
                className="w-full py-3 bg-[#7A1F2B] hover:bg-[#621822] text-white font-bold text-xs rounded-full shadow-lg shadow-[#7A1F2B]/20 transition cursor-pointer"
              >
                Close Member Card
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
