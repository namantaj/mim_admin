import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  RefreshCw,
  Eye,
  X,
  User,
  FileText,
  Building,
  Copy,
  Check,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  LayoutList,
  BadgeDollarSign,
  Lock,
  Unlock,
  ShieldCheck,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import StatusBadge from './StatusBadge';

// ─── Config ──────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'all', label: 'All', Icon: LayoutList },
  { key: 'deposit', label: 'Deposit', Icon: ArrowDownCircle },
  { key: 'withdrawal', label: 'Withdrawal', Icon: ArrowUpCircle },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (amount) => {
  if (amount === null || amount === undefined || amount === '') {
    return '₹0';
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);
};

const fmtDate = (d) => {
  if (!d) return '—';

  try {
    return new Date(d).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function PaymentApproval({ triggerToast }) {
  const [activeTab, setActiveTab] = useState('all');

  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);

  // Members used for withdrawal access management
  const [members, setMembers] = useState([]);
  const [memberPlans, setMemberPlans] = useState([]);

  const [loadingDep, setLoadingDep] = useState(true);
  const [loadingWith, setLoadingWith] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(true);

  const [errDep, setErrDep] = useState('');
  const [errWith, setErrWith] = useState('');
  const [errMembers, setErrMembers] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [memberSearch, setMemberSearch] = useState('');

  const [selected, setSelected] = useState(null);

  const [copiedRef, setCopiedRef] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [accessUpdating, setAccessUpdating] = useState(null);

  // ── Fetch deposits ─────────────────────────────────────────────────────────
  const fetchDeposits = useCallback(async () => {
    try {
      setLoadingDep(true);
      setErrDep('');

      const { data, error } = await supabase
        .from('members')
        .select(`
          id,
          full_name,
          email,
          phone,
          member_id,
          membership_plan,
          plan_amount,
          payment_status,
          payment_reference,
          sponsor,
          bank_name,
          account_number,
          account_holder_name,
          ifsc_code,
          created_at,
          updated_at
        `)
        .not('payment_status', 'is', null)
        .not('membership_plan', 'is', null)
        .order('updated_at', {
          ascending: false,
          nullsFirst: false,
        });

      if (error) throw error;

      setDeposits(
        (data || []).filter((r) => r.membership_plan)
      );
    } catch (err) {
      console.error('Deposits fetch error:', err);

      setErrDep(
        err?.message ||
        'Unable to load deposit records.'
      );

      if (triggerToast) {
        triggerToast(
          'Failed to load deposits.',
          'danger'
        );
      }
    } finally {
      setLoadingDep(false);
    }
  }, [triggerToast]);

  // ── Fetch withdrawals ──────────────────────────────────────────────────────
  const fetchWithdrawals = useCallback(async () => {
    try {
      setLoadingWith(true);
      setErrWith('');

      const [withdrawalsResult, plansResult, membersResult] = await Promise.all([
        supabase
          .from('withdrawals')
          .select(`
            id,
            member_id,
            member_plan_id,
            amount,
            method,
            status,
            note,
            admin_note,
            created_at,
            updated_at
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('member_plans')
          .select(`
            id,
            member_id,
            plan_name,
            plan_amount,
            withdrawal_balance,
            withdrawal_enabled,
            created_at,
            updated_at
          `),
        supabase
          .from('members')
          .select(`
            id,
            full_name,
            email,
            phone,
            member_id,
            bank_name,
            account_number,
            account_holder_name,
            ifsc_code
          `),
      ]);

      if (withdrawalsResult.error) throw withdrawalsResult.error;
      if (plansResult.error) throw plansResult.error;
      if (membersResult.error) throw membersResult.error;

      const planMap = new Map(
        (plansResult.data || []).map((plan) => [plan.id, plan])
      );

      const memberMap = new Map(
        (membersResult.data || []).map((member) => [member.id, member])
      );

      const flat = (withdrawalsResult.data || []).map((r) => {
        const plan = r.member_plan_id
          ? planMap.get(r.member_plan_id)
          : null;
        const member = memberMap.get(r.member_id);

        return {
          ...r,
          full_name: member?.full_name || '—',
          email: member?.email || '—',
          phone: member?.phone || '—',
          member_ref_id: member?.member_id || '—',
          bank_name: member?.bank_name,
          account_number: member?.account_number,
          account_holder_name: member?.account_holder_name,
          ifsc_code: member?.ifsc_code,
          plan_name: plan?.plan_name || '—',
          plan_amount: plan?.plan_amount ?? 0,
          withdrawal_balance: plan?.withdrawal_balance ?? 0,
          withdrawal_enabled: Boolean(plan?.withdrawal_enabled),
        };
      });

      setWithdrawals(flat);
    } catch (err) {
      console.error('Withdrawals fetch error:', err);
      setErrWith(err?.message || 'Unable to load withdrawal records.');
    } finally {
      setLoadingWith(false);
    }
  }, []);

  // ── Fetch members + plans for plan-level withdrawal access ────────────────
  const fetchMembers = useCallback(async () => {
    try {
      setLoadingMembers(true);
      setErrMembers('');

      const [membersResult, plansResult] = await Promise.all([
        supabase
          .from('members')
          .select(`
            id,
            full_name,
            email,
            phone,
            member_id,
            membership_status,
            created_at
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('member_plans')
          .select(`
            id,
            member_id,
            plan_name,
            plan_amount,
            withdrawal_balance,
            withdrawal_enabled,
            created_at,
            updated_at
          `)
          .order('created_at', { ascending: false }),
      ]);

      if (membersResult.error) throw membersResult.error;
      if (plansResult.error) throw plansResult.error;

      const memberMap = new Map(
        (membersResult.data || []).map((member) => [member.id, member])
      );

      const plans = (plansResult.data || []).map((plan) => ({
        ...plan,
        full_name: memberMap.get(plan.member_id)?.full_name || '—',
        email: memberMap.get(plan.member_id)?.email || '—',
        phone: memberMap.get(plan.member_id)?.phone || '—',
        member_ref_id: memberMap.get(plan.member_id)?.member_id || '—',
        membership_status: memberMap.get(plan.member_id)?.membership_status || '',
      }));

      setMembers(membersResult.data || []);
      setMemberPlans(plans);
    } catch (err) {
      console.error('Plan withdrawal access fetch error:', err);
      setErrMembers(err?.message || 'Unable to load member plans.');
    } finally {
      setLoadingMembers(false);
    }
  }, []);

  // ── Initial load ────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchDeposits();
    fetchWithdrawals();
    fetchMembers();
  }, [
    fetchDeposits,
    fetchWithdrawals,
    fetchMembers,
  ]);

  // ── Realtime: members + member plans ──────────────────────────────────────
  useEffect(() => {
    const memberChannel = supabase
      .channel('admin-members-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'members' },
        () => {
          fetchDeposits();
          fetchMembers();
          fetchWithdrawals();
        }
      )
      .subscribe();

    const planChannel = supabase
      .channel('admin-member-plans-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'member_plans' },
        () => {
          fetchMembers();
          fetchWithdrawals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(memberChannel);
      supabase.removeChannel(planChannel);
    };
  }, [fetchDeposits, fetchMembers, fetchWithdrawals]);

  // ── Realtime: withdrawals ──────────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('admin-withdrawals-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'withdrawals',
        },
        () => {
          fetchWithdrawals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchWithdrawals]);

  // ── Refresh ────────────────────────────────────────────────────────────────
  const handleRefresh = () => {
    fetchDeposits();
    fetchWithdrawals();
    fetchMembers();
  };

  // ── Copy reference ─────────────────────────────────────────────────────────
  const copyRef = (ref) => {
    if (!ref) return;

    navigator.clipboard.writeText(ref);

    setCopiedRef(true);

    if (triggerToast) {
      triggerToast('Reference copied!');
    }

    setTimeout(() => {
      setCopiedRef(false);
    }, 2000);
  };

  // ── LOCK / UNLOCK WITHDRAWAL ACCESS PER PLAN ──────────────────────────────
  const toggleWithdrawalAccess = async (plan) => {
    if (!plan?.id) return;

    const newValue = !Boolean(plan.withdrawal_enabled);
    setAccessUpdating(plan.id);

    try {
      const { error } = await supabase
        .from('member_plans')
        .update({
          withdrawal_enabled: newValue,
          updated_at: new Date().toISOString(),
        })
        .eq('id', plan.id);

      if (error) throw error;

      setMemberPlans((prev) =>
        prev.map((p) =>
          p.id === plan.id
            ? { ...p, withdrawal_enabled: newValue }
            : p
        )
      );

      setWithdrawals((prev) =>
        prev.map((w) =>
          w.member_plan_id === plan.id
            ? { ...w, withdrawal_enabled: newValue }
            : w
        )
      );

      if (selected?.item?.member_plan_id === plan.id) {
        setSelected((s) => ({
          ...s,
          item: { ...s.item, withdrawal_enabled: newValue },
        }));
      }

      if (triggerToast) {
        triggerToast(
          newValue
            ? `Withdrawal access enabled for ${plan.plan_name}.`
            : `Withdrawal access locked for ${plan.plan_name}.`,
          'success'
        );
      }
    } catch (err) {
      console.error('Withdrawal plan access update error:', err);
      if (triggerToast) {
        triggerToast(
          'Unable to update withdrawal access: ' + (err?.message || 'Unknown error'),
          'danger'
        );
      }
    } finally {
      setAccessUpdating(null);
    }
  };

  // ── Approve Deposit ────────────────────────────────────────────────────────
  const approveDeposit = async (item) => {
    setActionLoading(true);

    try {
      const { error } = await supabase
        .from('members')
        .update({
          payment_status: 'approved',
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id);

      if (error) throw error;

      setDeposits((prev) =>
        prev.map((d) =>
          d.id === item.id
            ? {
              ...d,
              payment_status: 'approved',
            }
            : d
        )
      );

      if (selected?.item?.id === item.id) {
        setSelected((s) => ({
          ...s,
          item: {
            ...s.item,
            payment_status: 'approved',
          },
        }));
      }

      if (triggerToast) {
        triggerToast(
          `Deposit approved for ${item.full_name}.`,
          'success'
        );
      }
    } catch (err) {
      if (triggerToast) {
        triggerToast(
          'Approve failed: ' +
          (err?.message || err),
          'danger'
        );
      }
    } finally {
      setActionLoading(false);
    }
  };

  // ── Reject Deposit ─────────────────────────────────────────────────────────
  const rejectDeposit = async (item) => {
    setActionLoading(true);

    try {
      const { error } = await supabase
        .from('members')
        .update({
          payment_status: 'rejected',
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id);

      if (error) throw error;

      setDeposits((prev) =>
        prev.map((d) =>
          d.id === item.id
            ? {
              ...d,
              payment_status: 'rejected',
            }
            : d
        )
      );

      if (selected?.item?.id === item.id) {
        setSelected((s) => ({
          ...s,
          item: {
            ...s.item,
            payment_status: 'rejected',
          },
        }));
      }

      if (triggerToast) {
        triggerToast(
          `Deposit rejected for ${item.full_name}.`,
          'danger'
        );
      }
    } catch (err) {
      if (triggerToast) {
        triggerToast(
          'Reject failed: ' +
          (err?.message || err),
          'danger'
        );
      }
    } finally {
      setActionLoading(false);
    }
  };

  // ── Approve Withdrawal ─────────────────────────────────────────────────────
  const approveWithdrawal = async (item) => {
    setActionLoading(true);

    try {
      const { error } = await supabase
        .from('withdrawals')
        .update({
          status: 'approved',
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id);

      if (error) throw error;

      setWithdrawals((prev) =>
        prev.map((w) =>
          w.id === item.id
            ? {
              ...w,
              status: 'approved',
            }
            : w
        )
      );

      if (selected?.item?.id === item.id) {
        setSelected((s) => ({
          ...s,
          item: {
            ...s.item,
            status: 'approved',
          },
        }));
      }

      if (triggerToast) {
        triggerToast(
          `Withdrawal approved for ${item.full_name}.`,
          'success'
        );
      }
    } catch (err) {
      if (triggerToast) {
        triggerToast(
          'Approve failed: ' +
          (err?.message || err),
          'danger'
        );
      }
    } finally {
      setActionLoading(false);
    }
  };

  // ── Reject Withdrawal ─────────────────────────────────────────────────────
  const rejectWithdrawal = async (item) => {
    setActionLoading(true);

    try {
      const { error } = await supabase
        .from('withdrawals')
        .update({
          status: 'rejected',
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id);

      if (error) throw error;

      setWithdrawals((prev) =>
        prev.map((w) =>
          w.id === item.id
            ? {
              ...w,
              status: 'rejected',
            }
            : w
        )
      );

      if (selected?.item?.id === item.id) {
        setSelected((s) => ({
          ...s,
          item: {
            ...s.item,
            status: 'rejected',
          },
        }));
      }

      if (triggerToast) {
        triggerToast(
          `Withdrawal rejected for ${item.full_name}.`,
          'danger'
        );
      }
    } catch (err) {
      if (triggerToast) {
        triggerToast(
          'Reject failed: ' +
          (err?.message || err),
          'danger'
        );
      }
    } finally {
      setActionLoading(false);
    }
  };

  // ── Build unified transaction rows ─────────────────────────────────────────
  const allRows = [
    ...deposits.map((d) => ({
      ...d,
      _type: 'deposit',
      _status: d.payment_status,
    })),

    ...withdrawals.map((w) => ({
      ...w,
      _type: 'withdrawal',
      _status: w.status,
    })),
  ].sort(
    (a, b) =>
      new Date(
        b.updated_at || b.created_at
      ) -
      new Date(
        a.updated_at || a.created_at
      )
  );

  const tabRows = allRows.filter(
    (r) =>
      activeTab === 'all' ||
      r._type === activeTab
  );

  const filteredRows = tabRows.filter((r) => {
    const q = searchTerm
      .toLowerCase()
      .trim();

    if (!q) return true;

    return (
      (
        r.member_id ||
        r.member_ref_id ||
        ''
      )
        .toLowerCase()
        .includes(q) ||
      (r.full_name || '')
        .toLowerCase()
        .includes(q) ||
      (r.email || '')
        .toLowerCase()
        .includes(q) ||
      (r.payment_reference || '')
        .toLowerCase()
        .includes(q) ||
      (r.membership_plan || '')
        .toLowerCase()
        .includes(q) ||
      (r.plan_name || '')
        .toLowerCase()
        .includes(q) ||
      (r.method || '')
        .toLowerCase()
        .includes(q) ||
      (r.note || '')
        .toLowerCase()
        .includes(q)
    );
  });

  // ── Plan search ────────────────────────────────────────────────────────────
  const filteredPlans = memberPlans.filter((plan) => {
    const q = memberSearch.toLowerCase().trim();
    if (!q) return true;

    return (
      (plan.full_name || '').toLowerCase().includes(q) ||
      (plan.member_ref_id || '').toLowerCase().includes(q) ||
      (plan.email || '').toLowerCase().includes(q) ||
      (plan.phone || '').toLowerCase().includes(q) ||
      (plan.plan_name || '').toLowerCase().includes(q)
    );
  });

  const pendingDeposits =
    deposits.filter(
      (d) =>
        d.payment_status === 'pending'
    ).length;

  const pendingWithdrawals =
    withdrawals.filter(
      (w) => w.status === 'pending'
    ).length;

  const enabledPlans = memberPlans.filter(
    (plan) => Boolean(plan.withdrawal_enabled)
  ).length;

  const lockedPlans =
    memberPlans.length - enabledPlans;

  const isLoading =
    loadingDep || loadingWith;

  const getStatusForRow = (row) =>
    row._type === 'deposit'
      ? row.payment_status
      : row.status;

  const isPending = (row) =>
    getStatusForRow(row) ===
    'pending';

  const doApprove = (row) =>
    row._type === 'deposit'
      ? approveDeposit(row)
      : approveWithdrawal(row);

  const doReject = (row) =>
    row._type === 'deposit'
      ? rejectDeposit(row)
      : rejectWithdrawal(row);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-fade-in pb-12">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-espresso dark:text-bone tracking-tight flex items-center gap-2.5">
            <BadgeDollarSign className="w-6 h-6 text-primary dark:text-rose-400" />

            <span>
              Payment Approval
            </span>
          </h1>

          <p className="text-sm text-warm-gray font-medium mt-0.5">
            Review deposits, withdrawal requests, and control withdrawal access.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">

          <button
            onClick={handleRefresh}
            disabled={
              isLoading ||
              loadingMembers
            }
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-sand dark:border-outline-variant text-warm-gray hover:text-espresso dark:hover:text-bone hover:bg-bone dark:hover:bg-espresso text-xs font-semibold transition cursor-pointer disabled:opacity-60"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoading ||
                loadingMembers
                ? 'animate-spin'
                : ''
                }`}
            />

            Refresh
          </button>

          {pendingDeposits > 0 && (
            <span className="text-xs font-semibold px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-lg text-amber-800 dark:text-amber-300">
              <ArrowDownCircle className="w-3.5 h-3.5 inline mr-1" />

              Deposits:{' '}
              <strong>
                {pendingDeposits}
              </strong>{' '}
              pending
            </span>
          )}

          {pendingWithdrawals > 0 && (
            <span className="text-xs font-semibold px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-lg text-blue-800 dark:text-blue-300">
              <ArrowUpCircle className="w-3.5 h-3.5 inline mr-1" />

              Withdrawals:{' '}
              <strong>
                {pendingWithdrawals}
              </strong>{' '}
              pending
            </span>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          WITHDRAWAL ACCESS MANAGEMENT
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-[#211E1A] border border-sand dark:border-outline-variant rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-sand dark:border-outline-variant bg-[#FBF9F4] dark:bg-[#2B2722]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-espresso dark:text-bone">
                  Withdrawal Access Management
                </h2>
                <p className="text-[11px] text-warm-gray mt-0.5">
                  Lock or unlock withdrawal access for each member plan independently.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-semibold">
              <span className="px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                {enabledPlans} Enabled
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-50 dark:bg-slate-950/30 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-800/50">
                {lockedPlans} Locked
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 border-b border-sand/60 dark:border-outline-variant/60">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray" />
            <input
              type="text"
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              placeholder="Search member, ID, or plan..."
              className="w-full pl-9 pr-4 h-9 text-xs font-medium bg-bone dark:bg-espresso border border-sand dark:border-outline-variant rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-espresso dark:text-bone placeholder:text-warm-gray"
            />
          </div>
        </div>

        {loadingMembers ? (
          <div className="min-h-[180px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-7 h-7 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-xs font-semibold text-warm-gray">Loading member plans...</p>
            </div>
          </div>
        ) : errMembers ? (
          <div className="px-5 py-8 text-center">
            <AlertCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
            <p className="text-xs font-semibold text-red-600">{errMembers}</p>
            <button
              onClick={fetchMembers}
              className="mt-3 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-espresso dark:text-bone">
              <thead className="bg-[#F4F0E6]/80 dark:bg-[#2B2722] text-warm-gray uppercase text-[10px] tracking-wider font-extrabold border-b border-sand dark:border-outline-variant">
                <tr>
                  <th className="px-5 py-3.5">Member</th>
                  <th className="px-5 py-3.5">Member ID</th>
                  <th className="px-5 py-3.5">Plan</th>
                  <th className="px-5 py-3.5">Plan Amount</th>
                  <th className="px-5 py-3.5">Withdrawal Balance</th>
                  <th className="px-5 py-3.5">Access</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand/40 dark:divide-outline-variant/40">
                {filteredPlans.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center">
                      <Clock className="w-5 h-5 text-warm-gray mx-auto mb-2" />
                      <p className="text-xs font-semibold text-warm-gray">No member plans found.</p>
                    </td>
                  </tr>
                ) : (
                  filteredPlans.map((plan) => {
                    const enabled = Boolean(plan.withdrawal_enabled);
                    const updating = accessUpdating === plan.id;

                    return (
                      <tr key={plan.id} className="hover:bg-bone/50 dark:hover:bg-espresso/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-semibold">{plan.full_name || '—'}</div>
                          <div className="text-[10px] text-warm-gray">{plan.email || '—'}</div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-mono text-[10px] font-bold text-primary dark:text-rose-400">
                            {plan.member_ref_id || '—'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-semibold">{plan.plan_name || '—'}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-bold">{fmt(plan.plan_amount)}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-bold text-blue-700 dark:text-blue-400">
                            {fmt(plan.withdrawal_balance)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          {enabled ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                              <Unlock className="w-3 h-3" /> Enabled
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-50 dark:bg-slate-950/30 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-800/50">
                              <Lock className="w-3 h-3" /> Locked
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => toggleWithdrawalAccess(plan)}
                            disabled={updating}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer disabled:opacity-60 ${enabled
                              ? 'border border-primary text-primary dark:text-rose-400 hover:bg-primary/10'
                              : 'bg-forest hover:bg-emerald-800 text-white'
                              }`}
                          >
                            {updating ? (
                              <span className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                            ) : enabled ? (
                              <Lock className="w-3.5 h-3.5" />
                            ) : (
                              <Unlock className="w-3.5 h-3.5" />
                            )}
                            {updating ? 'Updating...' : enabled ? 'Lock' : 'Unlock'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-5 py-3 bg-[#FBF9F4] dark:bg-[#2B2722] border-t border-sand dark:border-outline-variant text-[11px] text-warm-gray">
          {filteredPlans.length} of {memberPlans.length} member plans shown
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          ERROR BANNERS
      ═══════════════════════════════════════════════════════════════════ */}

      {errDep && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl px-4 py-3 flex items-center justify-between gap-4">

          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />

            <p className="text-xs font-semibold text-red-700 dark:text-red-300">
              {errDep}
            </p>
          </div>

          <button
            onClick={fetchDeposits}
            className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition cursor-pointer shrink-0"
          >
            Retry
          </button>

        </div>
      )}

      {errWith && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl px-4 py-3 flex items-center justify-between gap-4">

          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />

            <p className="text-xs font-semibold text-red-700 dark:text-red-300">
              {errWith}
            </p>
          </div>

          <button
            onClick={fetchWithdrawals}
            className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition cursor-pointer shrink-0"
          >
            Retry
          </button>

        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          TABS + SEARCH
      ═══════════════════════════════════════════════════════════════════ */}

      <div className="bg-cream dark:bg-surface border border-sand dark:border-outline-variant rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">

        <div className="flex items-center bg-bone dark:bg-espresso p-1 rounded-xl border border-sand dark:border-outline-variant gap-1">

          {TABS.map(
            ({
              key,
              label,
              Icon,
            }) => (
              <button
                key={key}
                onClick={() =>
                  setActiveTab(key)
                }
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeTab === key
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-warm-gray hover:text-espresso dark:hover:text-bone'
                  }`}
              >
                <Icon className="w-3.5 h-3.5" />

                {label}
              </button>
            )
          )}

        </div>

        <div className="relative w-full sm:w-80">

          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray" />

          <input
            type="text"
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(
                e.target.value
              )
            }
            placeholder="Search by name, member ID, reference…"
            className="w-full pl-9 pr-4 h-9 text-xs font-medium bg-bone dark:bg-espresso border border-sand dark:border-outline-variant rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-espresso dark:text-bone placeholder:text-warm-gray"
          />

        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          TRANSACTION TABLE
      ═══════════════════════════════════════════════════════════════════ */}

      <div className="bg-white dark:bg-[#211E1A] border border-sand dark:border-outline-variant rounded-2xl shadow-sm overflow-hidden">

        {isLoading ? (
          <div className="min-h-[280px] flex items-center justify-center">

            <div className="flex flex-col items-center gap-3">

              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />

              <p className="text-sm font-semibold text-warm-gray">
                Loading transactions…
              </p>

            </div>

          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full text-left text-xs text-espresso dark:text-bone">

              <thead className="bg-[#F4F0E6]/80 dark:bg-[#2B2722] text-warm-gray uppercase text-[10px] tracking-wider font-extrabold border-b border-sand dark:border-outline-variant">

                <tr>
                  <th className="px-5 py-4">
                    Type
                  </th>

                  <th className="px-5 py-4">
                    Member
                  </th>

                  <th className="px-5 py-4">
                    Plan / Amount
                  </th>

                  <th className="px-5 py-4">
                    Reference / UTR
                  </th>

                  <th className="px-5 py-4">
                    Status
                  </th>

                  <th className="px-5 py-4">
                    Date
                  </th>

                  <th className="px-5 py-4 text-right">
                    Actions
                  </th>
                </tr>

              </thead>

              <tbody className="divide-y divide-sand/40 dark:divide-outline-variant/40">

                {filteredRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-16 text-center"
                    >

                      <div className="flex flex-col items-center gap-2">

                        <div className="w-12 h-12 rounded-full bg-cream dark:bg-espresso flex items-center justify-center text-warm-gray mb-1">
                          <Clock className="w-6 h-6" />
                        </div>

                        <p className="text-sm font-bold text-espresso dark:text-bone">
                          No records found
                        </p>

                        <p className="text-xs text-warm-gray">
                          {searchTerm
                            ? 'No records match your search.'
                            : activeTab ===
                              'withdrawal'
                              ? 'No withdrawal requests exist yet.'
                              : 'No payment submissions found.'}
                        </p>

                      </div>

                    </td>
                  </tr>
                ) : (
                  filteredRows.map(
                    (row) => {
                      const isDeposit =
                        row._type ===
                        'deposit';

                      const status =
                        getStatusForRow(
                          row
                        );

                      const pending =
                        isPending(row);

                      const ref =
                        row.payment_reference ||
                        null;

                      const amount =
                        isDeposit
                          ? row.plan_amount
                          : row.amount;

                      const planLabel =
                        isDeposit
                          ? row.membership_plan ||
                          '—'
                          : row.method ||
                          'Withdrawal';

                      const memberId =
                        row.member_id ||
                        row.member_ref_id ||
                        row.id?.substring(
                          0,
                          8
                        );

                      return (
                        <tr
                          key={`${row._type}-${row.id}`}
                          className="hover:bg-bone/50 dark:hover:bg-espresso/50 transition-colors"
                        >

                          {/* Type */}
                          <td className="px-5 py-4 whitespace-nowrap">

                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border ${isDeposit
                                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50'
                                : 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/50'
                                }`}
                            >

                              {isDeposit ? (
                                <ArrowDownCircle className="w-3 h-3" />
                              ) : (
                                <ArrowUpCircle className="w-3 h-3" />
                              )}

                              {isDeposit
                                ? 'Deposit'
                                : 'Withdrawal'}

                            </span>

                          </td>

                          {/* Member */}
                          <td className="px-5 py-4 whitespace-nowrap">

                            <div className="font-semibold">
                              {row.full_name ||
                                '—'}
                            </div>

                            <div className="font-mono text-[10px] text-primary dark:text-rose-400">
                              {memberId}
                            </div>

                          </td>

                          {/* Amount */}
                          <td className="px-5 py-4 whitespace-nowrap">

                            <div
                              className={`font-bold ${isDeposit
                                ? 'text-forest dark:text-emerald-400'
                                : 'text-blue-700 dark:text-blue-400'
                                }`}
                            >
                              {fmt(amount)}
                            </div>

                            <div className="text-[11px] text-warm-gray mt-0.5">
                              {planLabel}
                            </div>

                          </td>

                          {/* Reference */}
                          <td className="px-5 py-4 whitespace-nowrap">

                            {ref ? (
                              <div className="flex items-center gap-1.5 font-mono bg-cream dark:bg-espresso px-2.5 py-1 rounded border border-sand dark:border-outline-variant w-fit">

                                <span className="font-semibold">
                                  {ref}
                                </span>

                                <button
                                  onClick={() =>
                                    copyRef(
                                      ref
                                    )
                                  }
                                  className="text-warm-gray hover:text-primary cursor-pointer p-0.5"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>

                              </div>
                            ) : (
                              <span className="text-warm-gray italic text-[11px]">
                                —
                              </span>
                            )}

                          </td>

                          {/* Status */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <StatusBadge
                              status={
                                status ||
                                'pending'
                              }
                            />
                          </td>

                          {/* Date */}
                          <td className="px-5 py-4 text-warm-gray text-[11px] whitespace-nowrap">
                            {fmtDate(
                              row.updated_at ||
                              row.created_at
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-4 text-right whitespace-nowrap">

                            <div className="flex items-center justify-end gap-2">

                              {pending ? (
                                <>
                                  <button
                                    disabled={
                                      actionLoading
                                    }
                                    onClick={() =>
                                      doApprove(
                                        row
                                      )
                                    }
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-forest hover:bg-emerald-800 text-white text-xs font-bold shadow-sm transition cursor-pointer disabled:opacity-60 active:scale-95"
                                  >
                                    <CheckCircle className="w-3.5 h-3.5" />

                                    Approve
                                  </button>

                                  <button
                                    disabled={
                                      actionLoading
                                    }
                                    onClick={() =>
                                      doReject(
                                        row
                                      )
                                    }
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-primary text-primary dark:text-rose-400 hover:bg-primary/10 text-xs font-bold transition cursor-pointer disabled:opacity-60 active:scale-95"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />

                                    Reject
                                  </button>
                                </>
                              ) : (
                                <span className="text-xs text-warm-gray italic font-medium capitalize">
                                  {status}
                                </span>
                              )}

                              <button
                                onClick={() =>
                                  setSelected({
                                    item: row,
                                    type: row._type,
                                  })
                                }
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bone dark:bg-espresso border border-sand dark:border-outline-variant hover:bg-sand/50 text-xs font-bold transition cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />

                                View
                              </button>

                            </div>

                          </td>

                        </tr>
                      );
                    }
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#FBF9F4] dark:bg-[#2B2722] border-t border-sand dark:border-outline-variant flex items-center justify-between text-xs text-warm-gray">

          <span>
            Showing {filteredRows.length} of{' '}
            {allRows.length} total records
          </span>

          <span className="text-[11px] font-medium">
            {deposits.length} Deposits ·{' '}
            {withdrawals.length}{' '}
            Withdrawals
          </span>

        </div>

      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          DETAILS MODAL
      ═══════════════════════════════════════════════════════════════════ */}

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">

          <div className="bg-cream dark:bg-surface border border-sand dark:border-outline-variant rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 relative animate-fade-in my-8">

            {/* Close */}
            <button
              onClick={() =>
                setSelected(null)
              }
              className="absolute top-5 right-5 p-1.5 rounded-full text-warm-gray hover:text-espresso dark:hover:text-bone hover:bg-sand/30 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3.5 border-b border-sand dark:border-outline-variant pb-4">

              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ring-4 ${selected.type ===
                  'deposit'
                  ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 ring-emerald-100/50 dark:ring-emerald-900/30'
                  : 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-blue-100/50 dark:ring-blue-900/30'
                  }`}
              >
                {selected.type ===
                  'deposit' ? (
                  <ArrowDownCircle className="w-6 h-6" />
                ) : (
                  <ArrowUpCircle className="w-6 h-6" />
                )}
              </div>

              <div>

                <h3 className="font-extrabold text-lg text-espresso dark:text-bone capitalize">
                  {selected.type}{' '}
                  Details
                </h3>

                <p className="text-xs text-warm-gray">
                  Member:{' '}
                  <span className="font-mono font-bold text-primary dark:text-rose-400">
                    {selected.item
                      .member_id ||
                      selected.item
                        .member_ref_id ||
                      selected.item.id?.substring(
                        0,
                        8
                      )}
                  </span>
                </p>

              </div>

            </div>

            {/* Body */}
            <div className="space-y-4 text-xs">

              {/* Customer Info */}
              <div className="bg-bone dark:bg-espresso p-4 rounded-xl border border-sand dark:border-outline-variant space-y-3">

                <h4 className="font-bold text-xs uppercase tracking-wider text-warm-gray flex items-center gap-1.5">

                  <User className="w-3.5 h-3.5 text-primary" />

                  Customer Information

                </h4>

                <div className="grid grid-cols-2 gap-3">

                  <div>
                    <span className="text-[11px] text-warm-gray block">
                      Full Name
                    </span>

                    <strong className="text-espresso dark:text-bone text-[13px]">
                      {selected.item
                        .full_name ||
                        '—'}
                    </strong>
                  </div>

                  <div>
                    <span className="text-[11px] text-warm-gray block">
                      Email
                    </span>

                    <span className="text-espresso dark:text-bone font-medium">
                      {selected.item
                        .email ||
                        '—'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-warm-gray block">
                      Phone
                    </span>

                    <span className="text-espresso dark:text-bone font-medium">
                      {selected.item
                        .phone ||
                        '—'}
                    </span>
                  </div>

                  {selected.type ===
                    'deposit' && (
                      <div>
                        <span className="text-[11px] text-warm-gray block">
                          Sponsor
                        </span>

                        <span className="font-mono font-bold text-espresso dark:text-bone">
                          {selected.item
                            .sponsor ||
                            '—'}
                        </span>
                      </div>
                    )}

                </div>

              </div>

              {/* Transaction Details */}
              <div className="bg-bone dark:bg-espresso p-4 rounded-xl border border-sand dark:border-outline-variant space-y-3">

                <h4 className="font-bold text-xs uppercase tracking-wider text-warm-gray flex items-center gap-1.5">

                  <FileText className="w-3.5 h-3.5 text-primary" />

                  {selected.type ===
                    'deposit'
                    ? 'Plan & Payment Reference'
                    : 'Withdrawal Details'}

                </h4>

                <div className="grid grid-cols-2 gap-3">

                  {selected.type ===
                    'deposit' ? (
                    <>
                      <div>
                        <span className="text-[11px] text-warm-gray block">
                          Membership Plan
                        </span>

                        <strong className="text-primary dark:text-rose-400 text-[13px]">
                          {selected.item
                            .membership_plan ||
                            '—'}
                        </strong>
                      </div>

                      <div>
                        <span className="text-[11px] text-warm-gray block">
                          Plan Amount
                        </span>

                        <strong className="text-forest dark:text-emerald-400 text-[15px]">
                          {fmt(
                            selected
                              .item
                              .plan_amount
                          )}
                        </strong>
                      </div>

                      <div className="col-span-2">

                        <span className="text-[11px] text-warm-gray block mb-1">
                          UTR / Transaction Reference
                        </span>

                        <div className="flex items-center justify-between p-2.5 bg-cream dark:bg-surface rounded-lg border border-sand dark:border-outline-variant">

                          <span className="font-mono font-extrabold text-sm text-espresso dark:text-bone tracking-wider">
                            {selected.item
                              .payment_reference ||
                              'None provided'}
                          </span>

                          {selected.item
                            .payment_reference && (
                              <button
                                onClick={() =>
                                  copyRef(
                                    selected
                                      .item
                                      .payment_reference
                                  )
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-sand/40 hover:bg-sand text-warm-gray hover:text-espresso text-[11px] font-semibold transition cursor-pointer"
                              >
                                {copiedRef ? (
                                  <Check className="w-3.5 h-3.5 text-forest" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}

                                <span>
                                  {copiedRef
                                    ? 'Copied'
                                    : 'Copy'}
                                </span>
                              </button>
                            )}

                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <span className="text-[11px] text-warm-gray block">
                          Amount Requested
                        </span>

                        <strong className="text-blue-700 dark:text-blue-400 text-[15px]">
                          {fmt(
                            selected.item
                              .amount
                          )}
                        </strong>
                      </div>

                      <div>
                        <span className="text-[11px] text-warm-gray block">
                          Plan
                        </span>

                        <strong className="text-primary dark:text-rose-400 text-[13px]">
                          {selected.item.plan_name || '—'}
                        </strong>
                      </div>

                      <div>
                        <span className="text-[11px] text-warm-gray block">
                          Plan Amount
                        </span>

                        <strong className="text-forest dark:text-emerald-400 text-[13px]">
                          {fmt(selected.item.plan_amount)}
                        </strong>
                      </div>

                      <div>
                        <span className="text-[11px] text-warm-gray block">
                          Withdrawal Method
                        </span>

                        <span className="text-espresso dark:text-bone font-medium">
                          {selected.item.method || '—'}
                        </span>
                      </div>

                      {selected.item.note && (
                        <div className="col-span-2">

                          <span className="text-[11px] text-warm-gray block">
                            Member Note
                          </span>

                          <span className="text-espresso dark:text-bone font-medium">
                            {selected.item
                              .note}
                          </span>

                        </div>
                      )}
                    </>
                  )}

                  <div>
                    <span className="text-[11px] text-warm-gray block">
                      Status
                    </span>

                    <div className="mt-1">
                      <StatusBadge
                        status={
                          getStatusForRow(
                            selected.item
                          ) ||
                          'pending'
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] text-warm-gray block">
                      Date
                    </span>

                    <span className="text-espresso dark:text-bone font-medium">
                      {fmtDate(
                        selected.item
                          .updated_at ||
                        selected.item
                          .created_at
                      )}
                    </span>
                  </div>

                  {selected.type ===
                    'withdrawal' && (
                      <div className="col-span-2">

                        <span className="text-[11px] text-warm-gray block">
                          Withdrawal Access for this Plan
                        </span>

                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          {selected.item.withdrawal_enabled ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Unlock className="w-3 h-3" />
                              Enabled
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-50 text-slate-700 border border-slate-200">
                              <Lock className="w-3 h-3" />
                              Locked
                            </span>
                          )}

                          <span className="text-[11px] text-warm-gray">
                            Balance: <strong className="text-espresso dark:text-bone">{fmt(selected.item.withdrawal_balance)}</strong>
                          </span>
                        </div>

                      </div>
                    )}

                </div>

              </div>

              {/* Bank Details */}
              {(selected.item
                .bank_name ||
                selected.item
                  .account_number) && (
                  <div className="bg-bone dark:bg-espresso p-4 rounded-xl border border-sand dark:border-outline-variant space-y-3">

                    <h4 className="font-bold text-xs uppercase tracking-wider text-warm-gray flex items-center gap-1.5">

                      <Building className="w-3.5 h-3.5 text-primary" />

                      Registered Bank Account

                    </h4>

                    <div className="grid grid-cols-2 gap-3">

                      <div>
                        <span className="text-[11px] text-warm-gray block">
                          Bank Name
                        </span>

                        <span className="text-espresso dark:text-bone font-medium">
                          {selected.item
                            .bank_name ||
                            '—'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[11px] text-warm-gray block">
                          Account Holder
                        </span>

                        <span className="text-espresso dark:text-bone font-medium">
                          {selected.item
                            .account_holder_name ||
                            selected.item
                              .full_name ||
                            '—'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[11px] text-warm-gray block">
                          Account Number
                        </span>

                        <span className="font-mono text-espresso dark:text-bone font-semibold">
                          {selected.item
                            .account_number ||
                            '—'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[11px] text-warm-gray block">
                          IFSC Code
                        </span>

                        <span className="font-mono text-espresso dark:text-bone font-semibold">
                          {selected.item
                            .ifsc_code ||
                            '—'}
                        </span>
                      </div>

                    </div>

                  </div>
                )}

              {/* Admin Note */}
              {selected.type ===
                'withdrawal' &&
                selected.item
                  .admin_note && (
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 p-3 rounded-xl text-[11px] text-amber-800 dark:text-amber-300">
                    <strong>
                      Admin Note:
                    </strong>{' '}
                    {
                      selected.item
                        .admin_note
                    }
                  </div>
                )}

            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-sand dark:border-outline-variant flex items-center justify-between gap-3">

              {isPending(
                selected.item
              ) ? (
                <div className="flex items-center gap-3">

                  <button
                    disabled={
                      actionLoading
                    }
                    onClick={() =>
                      doApprove(
                        selected.item
                      )
                    }
                    className="inline-flex items-center gap-1.5 py-2 px-4 bg-forest hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-sm transition cursor-pointer disabled:opacity-60"
                  >
                    <CheckCircle className="w-4 h-4" />

                    Approve
                  </button>

                  <button
                    disabled={
                      actionLoading
                    }
                    onClick={() =>
                      doReject(
                        selected.item
                      )
                    }
                    className="inline-flex items-center gap-1.5 py-2 px-4 border border-primary text-primary dark:text-rose-400 font-bold text-xs rounded-lg hover:bg-primary/10 transition cursor-pointer disabled:opacity-60"
                  >
                    <XCircle className="w-4 h-4" />

                    Reject
                  </button>

                </div>
              ) : (
                <span className="text-xs text-warm-gray italic font-medium">
                  This record has been{' '}
                  <strong className="capitalize">
                    {getStatusForRow(
                      selected.item
                    )}
                  </strong>
                  .
                </span>
              )}

              <button
                onClick={() =>
                  setSelected(null)
                }
                className="py-2 px-5 bg-sand/40 hover:bg-sand text-espresso dark:text-bone font-bold text-xs rounded-lg transition cursor-pointer"
              >
                Close
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}