import React, { useCallback, useEffect, useState } from 'react';

import StatCard from './StatCard';
import DataTable from './DataTable';
import StatusBadge from './StatusBadge';

import {
  ArrowUpRight,
  Activity,
  CheckCircle2,
  Clock,
  PlusCircle,
  Crown,
  Users,
  Wallet,
  MessageSquare,
} from 'lucide-react';

import { useLanguage } from '../context/LanguageContext';
import { useAdmin } from '../context/AdminContext';
import { supabase } from '../lib/supabase';

export default function Dashboard({ setRoute, triggerToast }) {
  const { t, locale } = useLanguage();
  const { adminName } = useAdmin();

  const [stats, setStats] = useState({
    totalMembers: 0,
    pendingWithdrawals: 0,
    totalPayouts: 0,
    openTickets: 0,
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ─────────────────────────────────────────────
     Helpers
  ───────────────────────────────────────────── */

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(value) || 0);
  };

  const formatDate = (date) => {
    if (!date) return '-';

    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const timeAgo = (date) => {
    if (!date) return '-';

    const now = new Date();
    const past = new Date(date);

    const seconds = Math.floor((now - past) / 1000);

    if (seconds < 60) {
      return 'Just now';
    }

    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) {
      return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
      return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    }

    const days = Math.floor(hours / 24);

    if (days < 30) {
      return `${days} day${days === 1 ? '' : 's'} ago`;
    }

    return formatDate(date);
  };

  const getInitials = (name) => {
    if (!name) return 'M';

    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  };

  /* ─────────────────────────────────────────────
     Load Dashboard
  ───────────────────────────────────────────── */

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);

      /* ═══════════════════════════════════════════
         1. TOTAL MEMBERS
      ═══════════════════════════════════════════ */

      const { count: totalMembers, error: membersCountError } =
        await supabase
          .from('members')
          .select('id', {
            count: 'exact',
            head: true,
          });

      if (membersCountError) {
        console.error(
          'Error loading member count:',
          membersCountError
        );
      }

      /* ═══════════════════════════════════════════
         2. PENDING WITHDRAWALS
      ═══════════════════════════════════════════ */

      const {
        count: pendingWithdrawals,
        error: pendingWithdrawalError,
      } = await supabase
        .from('withdrawals')
        .select('id', {
          count: 'exact',
          head: true,
        })
        .eq('status', 'pending');

      if (pendingWithdrawalError) {
        console.error(
          'Error loading pending withdrawals:',
          pendingWithdrawalError
        );
      }

      /* ═══════════════════════════════════════════
         3. TOTAL APPROVED PAYOUTS
      ═══════════════════════════════════════════ */

      const {
        data: approvedWithdrawals,
        error: approvedWithdrawalError,
      } = await supabase
        .from('withdrawals')
        .select('amount')
        .eq('status', 'approved');

      if (approvedWithdrawalError) {
        console.error(
          'Error loading approved payouts:',
          approvedWithdrawalError
        );
      }

      const totalPayouts = (approvedWithdrawals || []).reduce(
        (total, withdrawal) =>
          total + (Number(withdrawal.amount) || 0),
        0
      );

      /* ═══════════════════════════════════════════
         4. OPEN SUPPORT TICKETS
         Includes Open + In Progress
      ═══════════════════════════════════════════ */

      const { count: openTickets, error: ticketsCountError } =
        await supabase
          .from('support_tickets')
          .select('id', {
            count: 'exact',
            head: true,
          })
          .in('status', ['Open', 'In Progress']);

      if (ticketsCountError) {
        console.error(
          'Error loading support ticket count:',
          ticketsCountError
        );
      }

      setStats({
        totalMembers: totalMembers || 0,
        pendingWithdrawals: pendingWithdrawals || 0,
        totalPayouts,
        openTickets: openTickets || 0,
      });

      /* ═══════════════════════════════════════════
         5. RECENT MEMBERS
      ═══════════════════════════════════════════ */

      const {
        data: recentMembers,
        error: recentMembersError,
      } = await supabase
        .from('members')
        .select(`
          id,
          full_name,
          email,
          member_id,
          membership_plan,
          membership_status,
          payment_status,
          plan_amount,
          created_at
        `)
        .order('created_at', {
          ascending: false,
        })
        .limit(8);

      if (recentMembersError) {
        console.error(
          'Error loading recent members:',
          recentMembersError
        );
      }

      /* ═══════════════════════════════════════════
         6. RECENT WITHDRAWALS
      ═══════════════════════════════════════════ */

      const {
        data: recentWithdrawals,
        error: recentWithdrawalsError,
      } = await supabase
        .from('withdrawals')
        .select(`
          id,
          member_id,
          amount,
          method,
          status,
          created_at,
          updated_at
        `)
        .order('created_at', {
          ascending: false,
        })
        .limit(8);

      if (recentWithdrawalsError) {
        console.error(
          'Error loading recent withdrawals:',
          recentWithdrawalsError
        );
      }

      /* ═══════════════════════════════════════════
         7. RECENT SUPPORT TICKETS
      ═══════════════════════════════════════════ */

      const {
        data: recentTickets,
        error: recentTicketsError,
      } = await supabase
        .from('support_tickets')
        .select(`
          id,
          ticket_number,
          user_id,
          subject,
          category,
          priority,
          status,
          created_at,
          updated_at
        `)
        .order('created_at', {
          ascending: false,
        })
        .limit(8);

      if (recentTicketsError) {
        console.error(
          'Error loading recent support tickets:',
          recentTicketsError
        );
      }

      /* ═══════════════════════════════════════════
         8. GET MEMBER NAMES FOR TICKETS/WITHDRAWALS
      ═══════════════════════════════════════════ */

      const userIds = [
        ...(recentTickets || []).map(
          (ticket) => ticket.user_id
        ),
        ...(recentWithdrawals || []).map(
          (withdrawal) => withdrawal.member_id
        ),
      ].filter(Boolean);

      const uniqueUserIds = [
        ...new Set(userIds),
      ];

      let membersMap = {};

      if (uniqueUserIds.length > 0) {
        const {
          data: relatedMembers,
          error: relatedMembersError,
        } = await supabase
          .from('members')
          .select(`
            id,
            full_name,
            email,
            member_id
          `)
          .in('id', uniqueUserIds);

        if (relatedMembersError) {
          console.error(
            'Error loading related members:',
            relatedMembersError
          );
        } else {
          membersMap = (relatedMembers || []).reduce(
            (acc, member) => {
              acc[member.id] = member;
              return acc;
            },
            {}
          );
        }
      }

      /* ═══════════════════════════════════════════
         9. BUILD REAL ACTIVITY FEED
      ═══════════════════════════════════════════ */

      const activities = [];

      /* New members */

      (recentMembers || []).forEach((member) => {
        activities.push({
          id: `member-${member.id}`,
          user: member.full_name || 'New Member',
          memberId: member.member_id || member.id,
          action: 'New Member',
          details:
            member.membership_plan
              ? `${member.membership_plan} • ${formatCurrency(
                member.plan_amount
              )}`
              : 'Registration completed',
          type: 'Member',
          time: member.created_at,
          status:
            member.membership_status ||
            'Active',
        });
      });

      /* Withdrawals */

      (recentWithdrawals || []).forEach(
        (withdrawal) => {
          const member =
            membersMap[withdrawal.member_id];

          activities.push({
            id: `withdrawal-${withdrawal.id}`,
            user:
              member?.full_name ||
              'Member',
            memberId:
              member?.member_id ||
              withdrawal.member_id,
            action: 'Withdrawal',
            details: `${formatCurrency(
              withdrawal.amount
            )} • ${withdrawal.method ||
              'Withdrawal request'
              }`,
            type: 'Withdrawal',
            time: withdrawal.created_at,
            status:
              withdrawal.status ||
              'pending',
          });
        }
      );

      /* Support tickets */

      (recentTickets || []).forEach(
        (ticket) => {
          const member =
            membersMap[ticket.user_id];

          activities.push({
            id: `ticket-${ticket.id}`,
            user:
              member?.full_name ||
              'Member',
            memberId:
              member?.member_id ||
              ticket.user_id,
            action: 'Support Ticket',
            details: `${ticket.ticket_number} • ${ticket.subject}`,
            type: 'Support',
            time: ticket.created_at,
            status:
              ticket.status ||
              'Open',
          });
        }
      );

      /* Sort newest first */

      activities.sort(
        (a, b) =>
          new Date(b.time) -
          new Date(a.time)
      );

      setRecentActivity(
        activities.slice(0, 8)
      );
    } catch (error) {
      console.error(
        'Admin dashboard loading error:',
        error
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /* ─────────────────────────────────────────────
     Initial Load
  ───────────────────────────────────────────── */

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  /* ─────────────────────────────────────────────
     Realtime Updates
  ───────────────────────────────────────────── */

  useEffect(() => {
    const membersChannel = supabase
      .channel('admin-dashboard-members')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'members',
        },
        () => {
          loadDashboard();
        }
      )
      .subscribe();

    const withdrawalsChannel = supabase
      .channel('admin-dashboard-withdrawals')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'withdrawals',
        },
        () => {
          loadDashboard();
        }
      )
      .subscribe();

    const ticketsChannel = supabase
      .channel('admin-dashboard-tickets')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_tickets',
        },
        () => {
          loadDashboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(
        membersChannel
      );

      supabase.removeChannel(
        withdrawalsChannel
      );

      supabase.removeChannel(
        ticketsChannel
      );
    };
  }, [loadDashboard]);

  /* ─────────────────────────────────────────────
     Stat Cards
  ───────────────────────────────────────────── */

  const localizedStats = [
    {
      id: 'total-members',
      label: t('dashboard.totalMembers'),
      value: stats.totalMembers,
      icon: Users,
      trend: null,
    },
    {
      id: 'pending-withdrawals',
      label: t('dashboard.pendingWithdrawals'),
      value: stats.pendingWithdrawals,
      icon: Clock,
      trend: null,
    },
    {
      id: 'total-payouts',
      label: t('dashboard.totalPayouts'),
      value: formatCurrency(
        stats.totalPayouts
      ),
      icon: Wallet,
      trend: null,
    },
    {
      id: 'support-tickets',
      label: t('dashboard.openTickets'),
      value: stats.openTickets,
      icon: MessageSquare,
      trend: null,
    },
  ];

  /* ─────────────────────────────────────────────
     Render
  ───────────────────────────────────────────── */

  return (
    <div className="space-y-6 animate-fade-in pb-12">

      {/* ═══════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════ */}

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-[#641722] to-[#4A1019] text-on-primary p-6 md:p-8 shadow-lg">

        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 rounded-full bg-gradient-to-br from-gold/30 to-transparent blur-2xl pointer-events-none" />

        <div className="absolute bottom-0 left-1/3 w-40 h-40 rounded-full bg-white/5 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">

          <div className="space-y-2 max-w-xl">

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/20 border border-gold/30 text-cream text-xs font-bold uppercase tracking-wider backdrop-blur-sm">

              <Crown className="w-3.5 h-3.5 text-gold" />

              <span>
                SUPER ADMIN WORKSPACE
              </span>

            </div>

            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-cream">
              {t(
                'dashboard.welcome',
                { name: adminName }
              )}
            </h1>

            <p className="text-sm text-cream/80 leading-relaxed font-medium">
              {t('dashboard.subtitle')}
            </p>

          </div>

          <div className="flex items-center gap-3 flex-wrap">

            <button
              onClick={() =>
                setRoute('payment-approval')
              }
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold hover:bg-[#a38233] text-white text-xs font-bold rounded-lg shadow-sm transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4" />

              <span>
                Payment Approval
              </span>
            </button>

            <button
              onClick={() =>
                setRoute('members')
              }
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold rounded-lg backdrop-blur-sm transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />

              <span>
                {t(
                  'dashboard.manageMembers'
                )}
              </span>
            </button>

          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          STAT CARDS
      ═══════════════════════════════════════════ */}

      <div>

        <div className="flex items-center justify-between mb-4">

          <h2 className="text-lg font-bold text-espresso dark:text-bone tracking-tight">
            {locale === 'hi'
              ? 'वित्तीय और सदस्य मेट्रिक्स'
              : 'Financial & Member Metrics'}
          </h2>

          <div className="flex items-center gap-2 text-xs text-warm-gray font-medium">

            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />

            <span>
              Live
            </span>

          </div>

        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

          {localizedStats.map(
            (stat) => (
              <StatCard
                key={stat.id}
                stat={stat}
              />
            )
          )}

        </div>

      </div>

      {/* ═══════════════════════════════════════════
          MAIN CONTENT
      ═══════════════════════════════════════════ */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ═══════════════════════════════════════
            RECENT ACTIVITY
        ═══════════════════════════════════════ */}

        <div className="lg:col-span-2">

          <DataTable
            title={t(
              'dashboard.recentActivity'
            )}
            subtitle={
              'Latest members, withdrawals and support activity'
            }
            headers={[
              'User',
              'Action',
              'Details',
              'Type',
              'Time',
              'Status',
            ]}
            actionButton={
              <button
                onClick={() =>
                  setRoute('members')
                }
                className="inline-flex items-center gap-1 text-xs font-bold text-primary dark:text-rose-400 hover:underline cursor-pointer bg-transparent border-none"
              >
                {t(
                  'dashboard.viewAll'
                )}

                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            }
          >

            {loading ? (

              <tr>
                <td
                  colSpan="6"
                  className="px-6 py-12 text-center"
                >
                  <div className="flex items-center justify-center gap-2 text-warm-gray">

                    <span className="material-symbols-outlined animate-spin">
                      progress_activity
                    </span>

                    <span className="text-sm">
                      Loading activity...
                    </span>

                  </div>
                </td>
              </tr>

            ) : recentActivity.length === 0 ? (

              <tr>
                <td
                  colSpan="6"
                  className="px-6 py-12 text-center"
                >

                  <div className="w-12 h-12 mx-auto rounded-full bg-bone flex items-center justify-center">

                    <Activity className="w-5 h-5 text-warm-gray/60" />

                  </div>

                  <p className="text-sm font-semibold text-espresso mt-3">
                    No recent activity
                  </p>

                  <p className="text-xs text-warm-gray mt-1">
                    New members, withdrawals and
                    support tickets will appear here.
                  </p>

                </td>
              </tr>

            ) : (

              recentActivity.map(
                (item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-bone/50 dark:hover:bg-espresso/50 transition-colors border-b border-sand/40 dark:border-outline-variant/40"
                  >

                    {/* USER */}

                    <td className="px-6 py-4">

                      <div className="flex items-center gap-3">

                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 ring-2 ring-sand">

                          {getInitials(
                            item.user
                          )}

                        </div>

                        <div className="min-w-0">

                          <span className="font-semibold text-espresso dark:text-bone text-xs block truncate max-w-[130px]">
                            {item.user}
                          </span>

                          <span className="text-[10px] text-warm-gray font-mono block truncate max-w-[130px]">
                            {item.memberId}
                          </span>

                        </div>

                      </div>

                    </td>

                    {/* ACTION */}

                    <td className="px-6 py-4 font-semibold text-espresso dark:text-bone text-xs">
                      {item.action}
                    </td>

                    {/* DETAILS */}

                    <td className="px-6 py-4 text-warm-gray text-xs font-medium max-w-[220px]">
                      <span className="block truncate">
                        {item.details}
                      </span>
                    </td>

                    {/* TYPE */}

                    <td className="px-6 py-4">

                      <span className="inline-block text-[10px] font-semibold bg-ivory dark:bg-espresso text-espresso dark:text-bone px-2.5 py-0.5 rounded border border-sand dark:border-outline-variant">
                        {item.type}
                      </span>

                    </td>

                    {/* TIME */}

                    <td className="px-6 py-4 text-warm-gray text-xs whitespace-nowrap">
                      {timeAgo(
                        item.time
                      )}
                    </td>

                    {/* STATUS */}

                    <td className="px-6 py-4">
                      <StatusBadge
                        status={
                          item.status
                        }
                      />
                    </td>

                  </tr>
                )
              )

            )}

          </DataTable>

        </div>

        {/* ═══════════════════════════════════════
            SYSTEM OPERATIONS
        ═══════════════════════════════════════ */}

        <div className="space-y-6">

          <div className="bg-cream dark:bg-surface border border-sand dark:border-outline-variant rounded-2xl p-6 shadow-sm space-y-5">

            <div className="flex items-center justify-between border-b border-sand dark:border-outline-variant pb-3">

              <h3 className="font-bold text-base text-espresso dark:text-bone flex items-center gap-2">

                <Activity className="w-5 h-5 text-primary dark:text-rose-400" />

                <span>
                  {t(
                    'dashboard.systemOperations'
                  )}
                </span>

              </h3>

              <div className="flex items-center gap-2">

                <span className="w-2 h-2 rounded-full bg-forest dark:bg-emerald-400 animate-pulse" />

                <span className="text-[10px] font-semibold text-forest dark:text-emerald-400">
                  Live
                </span>

              </div>

            </div>

            <div className="space-y-4 text-xs">

              {/* PENDING WITHDRAWALS */}

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-bone dark:bg-espresso border border-sand dark:border-outline-variant">

                <div className="flex items-center gap-3">

                  <div className="p-2 rounded-lg bg-gold/15 text-gold">

                    <Clock className="w-4 h-4" />

                  </div>

                  <div>

                    <p className="font-bold text-espresso dark:text-bone">
                      {locale === 'hi'
                        ? 'लंबित निकासी'
                        : 'Pending Withdrawals'}
                    </p>

                    <p className="text-warm-gray text-[11px]">
                      {stats.pendingWithdrawals}{' '}
                      pending request
                      {stats.pendingWithdrawals ===
                        1
                        ? ''
                        : 's'}
                    </p>

                  </div>

                </div>

                <button
                  onClick={() =>
                    setRoute(
                      'payment-approval'
                    )
                  }
                  className="text-[11px] font-bold text-primary dark:text-rose-400 hover:underline cursor-pointer bg-transparent border-none"
                >
                  Review
                </button>

              </div>

              {/* SUPPORT */}

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-bone dark:bg-espresso border border-sand dark:border-outline-variant">

                <div className="flex items-center gap-3">

                  <div className="p-2 rounded-lg bg-primary/10 text-primary">

                    <MessageSquare className="w-4 h-4" />

                  </div>

                  <div>

                    <p className="font-bold text-espresso dark:text-bone">
                      {locale === 'hi'
                        ? 'सहायता टिकट'
                        : 'Support Tickets'}
                    </p>

                    <p className="text-warm-gray text-[11px]">
                      {stats.openTickets}{' '}
                      open or in progress
                    </p>

                  </div>

                </div>

                <button
                  onClick={() =>
                    setRoute(
                      'help-desk'
                    )
                  }
                  className="text-[11px] font-bold text-primary dark:text-rose-400 hover:underline cursor-pointer bg-transparent border-none"
                >
                  Review
                </button>

              </div>

              {/* MEMBER SYSTEM */}

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-bone dark:bg-espresso border border-sand dark:border-outline-variant">

                <div className="flex items-center gap-3">

                  <div className="p-2 rounded-lg bg-forest/15 text-forest dark:text-emerald-400">

                    <CheckCircle2 className="w-4 h-4" />

                  </div>

                  <div>

                    <p className="font-bold text-espresso dark:text-bone">
                      {locale === 'hi'
                        ? 'सदस्य प्रणाली'
                        : 'Member System'}
                    </p>

                    <p className="text-warm-gray text-[11px]">
                      {stats.totalMembers}{' '}
                      registered members
                    </p>

                  </div>

                </div>

                <span className="font-bold text-forest dark:text-emerald-400">
                  Healthy
                </span>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}