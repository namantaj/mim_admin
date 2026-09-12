import React, { useEffect, useState } from 'react';
import DataTable from './DataTable';
import StatusBadge from './StatusBadge';
import { supabase } from '../lib/supabase';

import {
  Search,
  Filter,
  Eye,
  X,
  Mail,
  Phone,
  Calendar,
  Award,
  Building2,
  Pencil,
  Save,
  User,
  MapPin,
  Wallet,
  RefreshCw
} from 'lucide-react';

import { useLanguage } from '../context/LanguageContext';

export default function Members({ triggerToast }) {
  const { t } = useLanguage();

  // =========================================================
  // STATE
  // =========================================================

  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [selectedMember, setSelectedMember] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit state
  const [editingMember, setEditingMember] = useState(null);
  const [savingMember, setSavingMember] = useState(false);

  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: '',
    membership_status: '',
    membership_plan: '',
    sponsor: ''
  });

  // =========================================================
  // FETCH MEMBERS FROM SUPABASE
  // =========================================================

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      console.log('Members fetched from Supabase:', data);

      const formattedMembers = (data || []).map((member) => ({
        id: member.member_id || member.id,
        databaseId: member.id,

        name: member.full_name || 'Unnamed Member',

        email: member.email || '—',

        phone: member.phone || '—',

        rank: member.membership_plan || 'Member',

        sponsor: member.sponsor || '—',

        status: formatStatus(member.membership_status),

        joinedDate: formatDate(member.created_at),

        walletBalance: formatCurrency(member.wallet_balance),

        totalEarnings: formatCurrency(member.total_earnings),

        address: member.address || '—',

        city: member.city || '—',

        state: member.state || '—',

        pincode: member.pincode || '—',

        country: member.country || 'India',

        profileCompleted: member.profile_completed ?? false,

        rawData: member
      }));

      setMembers(formattedMembers);

    } catch (err) {
      console.error('Error fetching members:', err);

      setError(
        err?.message ||
        'Unable to load members from Supabase.'
      );

      if (triggerToast) {
        triggerToast(
          'Unable to load members from database.',
          'danger'
        );
      }

    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // INITIAL FETCH
  // =========================================================

  useEffect(() => {
    fetchMembers();
  }, []);

  // =========================================================
  // HELPERS
  // =========================================================

  const formatStatus = (status) => {
    if (!status) {
      return 'Inactive';
    }

    return (
      status.charAt(0).toUpperCase() +
      status.slice(1).toLowerCase()
    );
  };

  const formatDate = (date) => {
    if (!date) {
      return '—';
    }

    try {
      return new Date(date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return '—';
    }
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) {
      return '₹0.00';
    }

    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(Number(amount) || 0);
  };

  // =========================================================
  // FILTER MEMBERS
  // =========================================================

  const filteredMembers = members.filter((member) => {
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      member.name.toLowerCase().includes(search) ||
      member.email.toLowerCase().includes(search) ||
      member.rank.toLowerCase().includes(search) ||
      member.sponsor.toLowerCase().includes(search) ||
      member.id.toLowerCase().includes(search);

    const matchesStatus =
      statusFilter === 'All' ||
      member.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // =========================================================
  // RANK BADGE STYLE
  // =========================================================

  const getRankBadgeStyle = (rank) => {
    if (!rank) {
      return `
        bg-gray-100 dark:bg-gray-800
        text-gray-700 dark:text-gray-300
        border-gray-300 dark:border-gray-700
      `;
    }

    if (rank.includes('Diamond')) {
      return `
        bg-sky-50 dark:bg-sky-950/40
        text-sky-800 dark:text-sky-300
        border-sky-300 dark:border-sky-800
      `;
    }

    if (rank.includes('Platinum')) {
      return `
        bg-slate-100 dark:bg-slate-900
        text-slate-800 dark:text-slate-200
        border-slate-300 dark:border-slate-700
      `;
    }

    if (rank.includes('Gold')) {
      return `
        bg-gold/15
        text-gold
        border-gold/30
      `;
    }

    if (rank.includes('Silver')) {
      return `
        bg-gray-100 dark:bg-gray-800
        text-gray-700 dark:text-gray-300
        border-gray-300 dark:border-gray-700
      `;
    }

    return `
      bg-amber-100 dark:bg-amber-950/40
      text-amber-800 dark:text-amber-300
      border-amber-300 dark:border-amber-800
    `;
  };

  // =========================================================
  // START EDITING MEMBER
  // =========================================================

  const startEditingMember = (member) => {
    const data = member.rawData || {};

    setEditingMember(member);

    setEditForm({
      full_name: data.full_name || '',
      email: data.email || '',
      phone: data.phone || '',
      address: data.address || '',
      city: data.city || '',
      state: data.state || '',
      pincode: data.pincode || '',
      country: data.country || 'India',
      membership_status: data.membership_status || 'active',
      membership_plan: data.membership_plan || '',
      sponsor: data.sponsor || ''
    });

    setSelectedMember(null);
  };

  // =========================================================
  // HANDLE EDIT INPUT
  // =========================================================

  const handleEditChange = (e) => {
    const { name, value } = e.target;

    setEditForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // =========================================================
  // SAVE MEMBER
  // =========================================================

  const saveMember = async (e) => {
    e.preventDefault();

    if (!editingMember) {
      return;
    }

    if (!editForm.full_name.trim()) {
      triggerToast?.(
        'Full name is required.',
        'danger'
      );
      return;
    }

    if (!editForm.email.trim()) {
      triggerToast?.(
        'Email is required.',
        'danger'
      );
      return;
    }

    try {
      setSavingMember(true);

      const { data, error } = await supabase
        .from('members')
        .update({
          full_name: editForm.full_name.trim(),
          email: editForm.email.trim().toLowerCase(),
          phone: editForm.phone.trim() || null,
          address: editForm.address.trim() || null,
          city: editForm.city.trim() || null,
          state: editForm.state.trim() || null,
          pincode: editForm.pincode.trim() || null,
          country: editForm.country.trim() || 'India',
          membership_status:
            editForm.membership_status || 'active',
          membership_plan:
            editForm.membership_plan.trim() || null,
          sponsor:
            editForm.sponsor.trim() || null
        })
        .eq('id', editingMember.databaseId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log('Member updated:', data);

      // Update local UI immediately
      setMembers((prevMembers) =>
        prevMembers.map((member) => {
          if (member.databaseId !== editingMember.databaseId) {
            return member;
          }

          return {
            ...member,

            name: data.full_name || 'Unnamed Member',

            email: data.email || '—',

            phone: data.phone || '—',

            rank: data.membership_plan || 'Member',

            sponsor: data.sponsor || '—',

            status: formatStatus(data.membership_status),

            address: data.address || '—',

            city: data.city || '—',

            state: data.state || '—',

            pincode: data.pincode || '—',

            country: data.country || 'India',

            profileCompleted:
              data.profile_completed ?? false,

            rawData: data
          };
        })
      );

      setEditingMember(null);

      triggerToast?.(
        'Member details updated successfully.',
        'success'
      );

    } catch (err) {
      console.error('Error updating member:', err);

      triggerToast?.(
        err?.message ||
        'Unable to update member details.',
        'danger'
      );

    } finally {
      setSavingMember(false);
    }
  };

  // =========================================================
  // LOADING STATE
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center animate-fade-in">

        <div className="flex flex-col items-center gap-3">

          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />

          <p className="text-sm font-semibold text-warm-gray">
            Loading members...
          </p>

        </div>

      </div>
    );
  }

  // =========================================================
  // MAIN UI
  // =========================================================

  return (
    <div className="space-y-6 animate-fade-in pb-12">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

        <div>

          <h1 className="text-2xl font-bold text-espresso dark:text-bone tracking-tight">
            {t('members.title')}
          </h1>

          <p className="text-sm text-warm-gray font-medium mt-0.5">
            {t('members.subtitle')}
          </p>

        </div>

        <div className="flex items-center gap-2">

          <button
            onClick={fetchMembers}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-sand dark:border-outline-variant text-warm-gray hover:text-espresso dark:hover:text-bone hover:bg-bone dark:hover:bg-espresso text-xs font-semibold transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>

          <span className="text-xs font-semibold px-3 py-1.5 bg-cream dark:bg-surface border border-sand dark:border-outline-variant rounded-lg text-warm-gray">

            Showing{' '}

            <strong className="text-primary dark:text-rose-400">
              {filteredMembers.length}
            </strong>

            {' '}of {members.length} Members

          </span>

        </div>

      </div>

      {/* =====================================================
          ERROR MESSAGE
      ===================================================== */}

      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl px-4 py-3 flex items-center justify-between gap-4">

          <div>

            <p className="text-xs font-semibold text-red-700 dark:text-red-300">
              Unable to load members
            </p>

            <p className="text-[11px] text-red-600 dark:text-red-400 mt-0.5">
              {error}
            </p>

          </div>

          <button
            onClick={fetchMembers}
            className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition cursor-pointer"
          >
            Retry
          </button>

        </div>
      )}

      {/* =====================================================
          SEARCH + FILTER
      ===================================================== */}

      <div className="bg-cream dark:bg-surface border border-sand dark:border-outline-variant rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">

        {/* SEARCH */}

        <div className="relative w-full sm:w-80">

          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray" />

          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('members.searchPlaceholder')}
            className="w-full pl-9 pr-4 h-9 text-xs font-medium bg-bone dark:bg-espresso border border-sand dark:border-outline-variant rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-espresso dark:text-bone"
          />

        </div>

        {/* STATUS FILTER */}

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">

          <div className="flex items-center gap-1.5 text-xs font-semibold text-warm-gray">

            <Filter className="w-3.5 h-3.5 text-primary dark:text-rose-400" />

            <span>
              {t('members.filterStatus')}
            </span>

          </div>

          <div className="flex items-center bg-bone dark:bg-espresso p-1 rounded-lg border border-sand dark:border-outline-variant">

            {[
              {
                key: 'All',
                label: t('members.all')
              },
              {
                key: 'Active',
                label: t('members.active')
              },
              {
                key: 'Inactive',
                label: t('members.inactive')
              }
            ].map((status) => (

              <button
                key={status.key}
                onClick={() => setStatusFilter(status.key)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${statusFilter === status.key
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-warm-gray hover:text-espresso dark:hover:text-bone'
                  }`}
              >
                {status.label}
              </button>

            ))}

          </div>

        </div>

      </div>

      {/* =====================================================
          MEMBERS TABLE
      ===================================================== */}

      <DataTable
        headers={[
          'Member',
          'Email',
          'Rank Badge',
          'Sponsor',
          'Status',
          'Joined Date',
          'Actions'
        ]}
      >

        {filteredMembers.length === 0 ? (

          <tr>

            <td
              colSpan={7}
              className="px-6 py-12 text-center text-warm-gray"
            >

              {members.length === 0
                ? 'No members have been added yet.'
                : 'No members found matching your search parameters.'
              }

            </td>

          </tr>

        ) : (

          filteredMembers.map((member) => (

            <tr
              key={member.databaseId}
              className="hover:bg-bone/50 dark:hover:bg-espresso/50 transition-colors border-b border-sand/40 dark:border-outline-variant/40"
            >

              {/* MEMBER */}

              <td className="px-6 py-4">

                <div className="flex items-center gap-3">

                  <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs shadow-sm ring-2 ring-gold/30">

                    {member.name
                      .charAt(0)
                      .toUpperCase()
                    }

                  </div>

                  <div>

                    <span className="font-semibold text-espresso dark:text-bone text-xs block">
                      {member.name}
                    </span>

                    <span className="text-[10px] font-mono text-warm-gray">
                      {member.id}
                    </span>

                  </div>

                </div>

              </td>

              {/* EMAIL */}

              <td className="px-6 py-4 text-warm-gray text-xs font-medium">
                {member.email}
              </td>

              {/* RANK */}

              <td className="px-6 py-4">

                <span
                  className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded border ${getRankBadgeStyle(member.rank)}`}
                >

                  <Award className="w-3.5 h-3.5" />

                  {member.rank}

                </span>

              </td>

              {/* SPONSOR */}

              <td className="px-6 py-4 text-xs font-semibold text-espresso dark:text-bone">
                {member.sponsor}
              </td>

              {/* STATUS */}

              <td className="px-6 py-4">

                <StatusBadge
                  status={member.status}
                />

              </td>

              {/* JOINED DATE */}

              <td className="px-6 py-4 text-xs text-warm-gray font-medium">
                {member.joinedDate}
              </td>

              {/* ACTIONS */}

              <td className="px-6 py-4">

                <div className="flex items-center gap-2">

                  <button
                    onClick={() => setSelectedMember(member)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg border border-primary text-primary dark:text-rose-400 hover:bg-primary hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
                  >

                    <Eye className="w-3.5 h-3.5" />

                    <span>
                      {t('members.viewDetails')}
                    </span>

                  </button>

                  <button
                    onClick={() => startEditingMember(member)}
                    className="inline-flex items-center justify-center p-1.5 text-primary dark:text-rose-400 rounded-lg border border-primary/40 hover:bg-primary hover:text-white transition-all cursor-pointer"
                    title="Edit member"
                  >

                    <Pencil className="w-3.5 h-3.5" />

                  </button>

                </div>

              </td>

            </tr>

          ))

        )}

      </DataTable>

      {/* =====================================================
          MEMBER DETAILS MODAL
      ===================================================== */}

      {selectedMember && (

        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">

          <div className="bg-cream dark:bg-surface border border-sand dark:border-outline-variant rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6 relative animate-fade-in">

            {/* CLOSE */}

            <button
              onClick={() => setSelectedMember(null)}
              className="absolute top-5 right-5 p-1.5 rounded-full text-warm-gray hover:bg-ivory dark:hover:bg-espresso transition cursor-pointer"
            >

              <X className="w-5 h-5" />

            </button>

            {/* HEADER */}

            <div className="flex items-center gap-4 border-b border-sand dark:border-outline-variant pb-5">

              <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-lg shadow-sm">

                {selectedMember.name
                  .charAt(0)
                  .toUpperCase()
                }

              </div>

              <div>

                <div className="flex items-center gap-2 flex-wrap">

                  <h3 className="font-bold text-lg text-espresso dark:text-bone">
                    {selectedMember.name}
                  </h3>

                  <StatusBadge
                    status={selectedMember.status}
                  />

                </div>

                <p className="text-xs text-warm-gray font-mono mt-0.5">
                  {selectedMember.id}
                </p>

              </div>

            </div>

            {/* MEMBER INFORMATION */}

            <div className="space-y-3 text-xs">

              {/* RANK + WALLET */}

              <div className="grid grid-cols-2 gap-3">

                <div className="p-3 bg-bone dark:bg-espresso rounded-xl border border-sand dark:border-outline-variant space-y-1">

                  <span className="text-warm-gray text-[10px] uppercase font-semibold tracking-wider">
                    Rank Status
                  </span>

                  <p className="font-bold text-gold flex items-center gap-1.5 text-xs">

                    <Award className="w-4 h-4" />

                    {selectedMember.rank}

                  </p>

                </div>

                <div className="p-3 bg-bone dark:bg-espresso rounded-xl border border-sand dark:border-outline-variant space-y-1">

                  <span className="text-warm-gray text-[10px] uppercase font-semibold tracking-wider">
                    Wallet Balance
                  </span>

                  <p className="font-bold text-forest dark:text-emerald-400 text-xs">

                    {selectedMember.walletBalance}

                  </p>

                </div>

              </div>

              {/* CONTACT DETAILS */}

              <div className="p-4 bg-cream dark:bg-surface rounded-xl border border-sand dark:border-outline-variant space-y-2.5">

                {/* EMAIL */}

                <div className="flex items-center justify-between gap-4">

                  <span className="text-warm-gray font-medium flex items-center gap-2">

                    <Mail className="w-4 h-4 text-primary dark:text-rose-400" />

                    Email:

                  </span>

                  <span className="font-semibold text-espresso dark:text-bone text-right break-all">
                    {selectedMember.email}
                  </span>

                </div>

                {/* PHONE */}

                <div className="flex items-center justify-between gap-4">

                  <span className="text-warm-gray font-medium flex items-center gap-2">

                    <Phone className="w-4 h-4 text-primary dark:text-rose-400" />

                    Phone:

                  </span>

                  <span className="font-semibold text-espresso dark:text-bone text-right">
                    {selectedMember.phone}
                  </span>

                </div>

                {/* SPONSOR */}

                <div className="flex items-center justify-between gap-4">

                  <span className="text-warm-gray font-medium flex items-center gap-2">

                    <Building2 className="w-4 h-4 text-primary dark:text-rose-400" />

                    Direct Sponsor:

                  </span>

                  <span className="font-semibold text-espresso dark:text-bone text-right">
                    {selectedMember.sponsor}
                  </span>

                </div>

                {/* JOINED */}

                <div className="flex items-center justify-between gap-4">

                  <span className="text-warm-gray font-medium flex items-center gap-2">

                    <Calendar className="w-4 h-4 text-warm-gray" />

                    Joined:

                  </span>

                  <span className="font-semibold text-espresso dark:text-bone">
                    {selectedMember.joinedDate}
                  </span>

                </div>

                {/* LOCATION */}

                <div className="flex items-center justify-between gap-4">

                  <span className="text-warm-gray font-medium flex items-center gap-2">

                    <MapPin className="w-4 h-4 text-primary dark:text-rose-400" />

                    Location:

                  </span>

                  <span className="font-semibold text-espresso dark:text-bone text-right">

                    {selectedMember.city !== '—'
                      ? `${selectedMember.city}, ${selectedMember.state}`
                      : '—'
                    }

                  </span>

                </div>

                {/* ADDRESS */}

                <div className="flex items-center justify-between gap-4">

                  <span className="text-warm-gray font-medium">
                    Address:
                  </span>

                  <span className="font-semibold text-espresso dark:text-bone text-right max-w-[250px]">
                    {selectedMember.address}
                  </span>

                </div>

                {/* PINCODE */}

                <div className="flex items-center justify-between gap-4">

                  <span className="text-warm-gray font-medium">
                    Pincode:
                  </span>

                  <span className="font-semibold text-espresso dark:text-bone">
                    {selectedMember.pincode}
                  </span>

                </div>

                {/* COUNTRY */}

                <div className="flex items-center justify-between gap-4">

                  <span className="text-warm-gray font-medium">
                    Country:
                  </span>

                  <span className="font-semibold text-espresso dark:text-bone">
                    {selectedMember.country}
                  </span>

                </div>

                {/* TOTAL EARNINGS */}

                <div className="flex items-center justify-between gap-4">

                  <span className="text-warm-gray font-medium flex items-center gap-2">

                    <Wallet className="w-4 h-4 text-forest dark:text-emerald-400" />

                    Total Earnings:

                  </span>

                  <span className="font-semibold text-forest dark:text-emerald-400">
                    {selectedMember.totalEarnings}
                  </span>

                </div>

                {/* PROFILE */}

                <div className="flex items-center justify-between gap-4">

                  <span className="text-warm-gray font-medium">
                    Profile:
                  </span>

                  <span
                    className={`font-semibold ${selectedMember.profileCompleted
                        ? 'text-forest dark:text-emerald-400'
                        : 'text-gold'
                      }`}
                  >

                    {selectedMember.profileCompleted
                      ? 'Completed'
                      : 'Incomplete'
                    }

                  </span>

                </div>

              </div>

            </div>

            {/* ACTION BUTTONS */}

            <div className="pt-2 flex gap-3">

              <button
                onClick={() => startEditingMember(selectedMember)}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold text-xs rounded-lg shadow-sm transition cursor-pointer"
              >

                <Pencil className="w-4 h-4" />

                Edit Member

              </button>

              <button
                onClick={() => setSelectedMember(null)}
                className="flex-1 py-2.5 border border-sand dark:border-outline-variant text-espresso dark:text-bone font-semibold text-xs rounded-lg hover:bg-bone dark:hover:bg-espresso transition cursor-pointer"
              >
                Close
              </button>

            </div>

          </div>

        </div>

      )}

      {/* =====================================================
          EDIT MEMBER MODAL
      ===================================================== */}

      {editingMember && (

        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">

          <div className="bg-cream dark:bg-surface border border-sand dark:border-outline-variant rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative my-8">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-sand dark:border-outline-variant pb-4 mb-5">

              <div>

                <h3 className="text-lg font-bold text-espresso dark:text-bone">
                  Edit Member
                </h3>

                <p className="text-xs text-warm-gray mt-1">
                  Update the member information stored in Supabase.
                </p>

              </div>

              <button
                onClick={() => setEditingMember(null)}
                disabled={savingMember}
                className="p-1.5 rounded-full text-warm-gray hover:bg-bone dark:hover:bg-espresso transition cursor-pointer disabled:opacity-50"
              >

                <X className="w-5 h-5" />

              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={saveMember}
              className="space-y-5"
            >

              {/* PERSONAL INFORMATION */}

              <div>

                <div className="flex items-center gap-2 mb-3">

                  <User className="w-4 h-4 text-primary" />

                  <h4 className="text-sm font-bold text-espresso dark:text-bone">
                    Personal Information
                  </h4>

                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  {/* FULL NAME */}

                  <div className="space-y-1">

                    <label className="text-[11px] font-semibold text-warm-gray">
                      Full Name *
                    </label>

                    <input
                      type="text"
                      name="full_name"
                      value={editForm.full_name}
                      onChange={handleEditChange}
                      required
                      className="w-full h-10 px-3 rounded-lg border border-sand dark:border-outline-variant bg-bone dark:bg-espresso text-espresso dark:text-bone text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />

                  </div>

                  {/* EMAIL */}

                  <div className="space-y-1">

                    <label className="text-[11px] font-semibold text-warm-gray">
                      Email *
                    </label>

                    <input
                      type="email"
                      name="email"
                      value={editForm.email}
                      onChange={handleEditChange}
                      required
                      className="w-full h-10 px-3 rounded-lg border border-sand dark:border-outline-variant bg-bone dark:bg-espresso text-espresso dark:text-bone text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />

                  </div>

                  {/* PHONE */}

                  <div className="space-y-1">

                    <label className="text-[11px] font-semibold text-warm-gray">
                      Phone
                    </label>

                    <input
                      type="tel"
                      name="phone"
                      value={editForm.phone}
                      onChange={handleEditChange}
                      className="w-full h-10 px-3 rounded-lg border border-sand dark:border-outline-variant bg-bone dark:bg-espresso text-espresso dark:text-bone text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />

                  </div>

                  {/* SPONSOR */}

                  <div className="space-y-1">

                    <label className="text-[11px] font-semibold text-warm-gray">
                      Sponsor
                    </label>

                    <input
                      type="text"
                      name="sponsor"
                      value={editForm.sponsor}
                      onChange={handleEditChange}
                      className="w-full h-10 px-3 rounded-lg border border-sand dark:border-outline-variant bg-bone dark:bg-espresso text-espresso dark:text-bone text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />

                  </div>

                </div>

              </div>

              {/* ADDRESS */}

              <div>

                <div className="flex items-center gap-2 mb-3">

                  <MapPin className="w-4 h-4 text-primary" />

                  <h4 className="text-sm font-bold text-espresso dark:text-bone">
                    Address
                  </h4>

                </div>

                <div className="space-y-4">

                  {/* ADDRESS */}

                  <div className="space-y-1">

                    <label className="text-[11px] font-semibold text-warm-gray">
                      Street Address
                    </label>

                    <textarea
                      name="address"
                      value={editForm.address}
                      onChange={handleEditChange}
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-sand dark:border-outline-variant bg-bone dark:bg-espresso text-espresso dark:text-bone text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    />

                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    {/* CITY */}

                    <div className="space-y-1">

                      <label className="text-[11px] font-semibold text-warm-gray">
                        City
                      </label>

                      <input
                        type="text"
                        name="city"
                        value={editForm.city}
                        onChange={handleEditChange}
                        className="w-full h-10 px-3 rounded-lg border border-sand dark:border-outline-variant bg-bone dark:bg-espresso text-espresso dark:text-bone text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      />

                    </div>

                    {/* STATE */}

                    <div className="space-y-1">

                      <label className="text-[11px] font-semibold text-warm-gray">
                        State
                      </label>

                      <input
                        type="text"
                        name="state"
                        value={editForm.state}
                        onChange={handleEditChange}
                        className="w-full h-10 px-3 rounded-lg border border-sand dark:border-outline-variant bg-bone dark:bg-espresso text-espresso dark:text-bone text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      />

                    </div>

                    {/* PINCODE */}

                    <div className="space-y-1">

                      <label className="text-[11px] font-semibold text-warm-gray">
                        Pincode
                      </label>

                      <input
                        type="text"
                        name="pincode"
                        value={editForm.pincode}
                        onChange={handleEditChange}
                        className="w-full h-10 px-3 rounded-lg border border-sand dark:border-outline-variant bg-bone dark:bg-espresso text-espresso dark:text-bone text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      />

                    </div>

                    {/* COUNTRY */}

                    <div className="space-y-1">

                      <label className="text-[11px] font-semibold text-warm-gray">
                        Country
                      </label>

                      <input
                        type="text"
                        name="country"
                        value={editForm.country}
                        onChange={handleEditChange}
                        className="w-full h-10 px-3 rounded-lg border border-sand dark:border-outline-variant bg-bone dark:bg-espresso text-espresso dark:text-bone text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      />

                    </div>

                  </div>

                </div>

              </div>

              {/* MEMBERSHIP */}

              <div>

                <div className="flex items-center gap-2 mb-3">

                  <Award className="w-4 h-4 text-primary" />

                  <h4 className="text-sm font-bold text-espresso dark:text-bone">
                    Membership
                  </h4>

                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  {/* STATUS */}

                  <div className="space-y-1">

                    <label className="text-[11px] font-semibold text-warm-gray">
                      Status
                    </label>

                    <select
                      name="membership_status"
                      value={editForm.membership_status}
                      onChange={handleEditChange}
                      className="w-full h-10 px-3 rounded-lg border border-sand dark:border-outline-variant bg-bone dark:bg-espresso text-espresso dark:text-bone text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    >

                      <option value="active">
                        Active
                      </option>

                      <option value="inactive">
                        Inactive
                      </option>

                    </select>

                  </div>

                  {/* PLAN */}

                  <div className="space-y-1">

                    <label className="text-[11px] font-semibold text-warm-gray">
                      Membership Plan / Rank
                    </label>

                    <input
                      type="text"
                      name="membership_plan"
                      value={editForm.membership_plan}
                      onChange={handleEditChange}
                      placeholder="e.g. Gold"
                      className="w-full h-10 px-3 rounded-lg border border-sand dark:border-outline-variant bg-bone dark:bg-espresso text-espresso dark:text-bone text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />

                  </div>

                </div>

              </div>

              {/* ACTIONS */}

              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-3 border-t border-sand dark:border-outline-variant">

                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  disabled={savingMember}
                  className="flex-1 h-10 rounded-lg border border-sand dark:border-outline-variant text-espresso dark:text-bone text-sm font-semibold hover:bg-bone dark:hover:bg-espresso transition cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingMember}
                  className="flex-1 h-10 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-semibold transition cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                >

                  {savingMember ? (

                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />

                      Saving...

                    </>

                  ) : (

                    <>
                      <Save className="w-4 h-4" />

                      Save Changes
                    </>

                  )}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
} 