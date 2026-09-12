import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DataTable from './DataTable';
import StatusBadge from './StatusBadge';
import {
  CheckCircle,
  XCircle,
  ArrowUpRight,
  RefreshCw,
  Wallet,
  CreditCard,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';

export default function Payouts({ triggerToast }) {
  const { t } = useLanguage();

  const [transactions, setTransactions] = useState([]);
  const [typeFilter, setTypeFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  /* =========================================================
     Helpers
  ========================================================= */

  const formatCurrency = (value) => {
    const amount = Number(value) || 0;

    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return '-';

    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (date) => {
    if (!date) return '-';

    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const normalizeStatus = (status) => {
    if (!status) return 'Pending';

    const value = status.toLowerCase();

    if (value === 'approved') return 'Approved';
    if (value === 'rejected') return 'Rejected';
    if (value === 'pending') return 'Pending';

    return status;
  };

  /* =========================================================
     Load Withdrawals + Deposits
  ========================================================= */

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);

      /* -----------------------------------------------------
         1. Load withdrawals
      ----------------------------------------------------- */

      const {
        data: withdrawalData,
        error: withdrawalError,
      } = await supabase
        .from('withdrawals')
        .select(`
          id,
          member_id,
          amount,
          method,
          status,
          note,
          admin_note,
          created_at,
          updated_at
        `)
        .order('created_at', {
          ascending: false,
        });

      if (withdrawalError) {
        console.error(
          'Error loading withdrawals:',
          withdrawalError
        );
        throw withdrawalError;
      }

      /* -----------------------------------------------------
         2. Get member IDs for withdrawals
      ----------------------------------------------------- */

      const withdrawalMemberIds = [
        ...new Set(
          (withdrawalData || [])
            .map((item) => item.member_id)
            .filter(Boolean)
        ),
      ];

      let withdrawalMembers = [];

      if (withdrawalMemberIds.length > 0) {
        const {
          data,
          error,
        } = await supabase
          .from('members')
          .select(`
            id,
            full_name,
            email,
            phone,
            member_id,
            membership_plan,
            membership_status,
            wallet_balance,
            account_holder_name,
            account_number,
            bank_name,
            ifsc_code,
            branch_name
          `)
          .in('id', withdrawalMemberIds);

        if (error) {
          console.error(
            'Error loading withdrawal members:',
            error
          );
        } else {
          withdrawalMembers = data || [];
        }
      }

      const withdrawalMemberMap = withdrawalMembers.reduce(
        (map, member) => {
          map[member.id] = member;
          return map;
        },
        {}
      );

      /* -----------------------------------------------------
         3. Convert withdrawals into transactions
      ----------------------------------------------------- */

      const withdrawalTransactions = (
        withdrawalData || []
      ).map((withdrawal) => {
        const member =
          withdrawalMemberMap[withdrawal.member_id] || {};

        return {
          id: withdrawal.id,
          sourceId: withdrawal.id,
          memberId: withdrawal.member_id,
          memberName: member.full_name || 'Unknown Member',
          memberCode: member.member_id || '-',
          type: 'Withdrawal',
          amount: Number(withdrawal.amount) || 0,
          status: normalizeStatus(withdrawal.status),
          date: withdrawal.created_at,
          updatedAt: withdrawal.updated_at,
          paymentMethod:
            withdrawal.method || 'Withdrawal',
          accountDetails:
            withdrawal.note || '-',
          bankName: member.bank_name || '',
          accountHolder:
            member.account_holder_name || '',
          accountNumber:
            member.account_number || '',
          ifscCode:
            member.ifsc_code || '',
          branchName:
            member.branch_name || '',
          raw: withdrawal,
        };
      });

      /* -----------------------------------------------------
         4. Load deposits from members
         
         Your current payment system stores:
         membership_plan
         plan_amount
         payment_status
         payment_reference
      ----------------------------------------------------- */

      const {
        data: memberData,
        error: memberError,
      } = await supabase
        .from('members')
        .select(`
          id,
          full_name,
          email,
          phone,
          member_id,
          membership_plan,
          membership_status,
          plan_amount,
          payment_status,
          payment_reference,
          created_at
        `)
        .not('membership_plan', 'is', null)
        .order('created_at', {
          ascending: false,
        });

      if (memberError) {
        console.error(
          'Error loading deposits:',
          memberError
        );
      }

      /* -----------------------------------------------------
         5. Convert members into deposit transactions
         
         Only members who have a payment status are shown.
      ----------------------------------------------------- */

      const depositTransactions = (
        memberData || []
      )
        .filter(
          (member) =>
            member.payment_status === 'pending' ||
            member.payment_status === 'approved' ||
            member.payment_status === 'rejected'
        )
        .map((member) => ({
          id: `deposit-${member.id}`,
          sourceId: member.id,
          memberId: member.id,
          memberName:
            member.full_name || 'Unknown Member',
          memberCode:
            member.member_id || '-',
          type: 'Deposit',
          amount: Number(member.plan_amount) || 0,
          status: normalizeStatus(
            member.payment_status
          ),
          date: member.created_at,
          updatedAt: member.created_at,
          paymentMethod: member.membership_plan || 'Plan',
          accountDetails:
            member.payment_reference ||
            'No payment reference',
          paymentReference:
            member.payment_reference || '',
          email: member.email || '',
          phone: member.phone || '',
          raw: member,
        }));

      /* -----------------------------------------------------
         6. Combine both
      ----------------------------------------------------- */

      const combined = [
        ...withdrawalTransactions,
        ...depositTransactions,
      ].sort(
        (a, b) =>
          new Date(b.date) - new Date(a.date)
      );

      setTransactions(combined);
      setLastUpdated(new Date());
    } catch (error) {
      console.error(
        'Payment Approval loading error:',
        error
      );

      setTransactions([]);

      if (triggerToast) {
        triggerToast(
          'Unable to load payment records.',
          'danger'
        );
      }
    } finally {
      setLoading(false);
    }
  }, [triggerToast]);

  /* =========================================================
     Initial Load
  ========================================================= */

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  /* =========================================================
     Realtime Withdrawals
  ========================================================= */

  useEffect(() => {
    const withdrawalChannel = supabase
      .channel('admin-payment-withdrawals')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'withdrawals',
        },
        () => {
          loadTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(
        withdrawalChannel
      );
    };
  }, [loadTransactions]);

  /* =========================================================
     Realtime Members / Deposits
  ========================================================= */

  useEffect(() => {
    const membersChannel = supabase
      .channel('admin-payment-members')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'members',
        },
        () => {
          loadTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(
        membersChannel
      );
    };
  }, [loadTransactions]);

  /* =========================================================
     Approve Withdrawal
  ========================================================= */

  const handleApproveWithdrawal = async (
    transaction
  ) => {
    if (processingId) return;

    try {
      setProcessingId(transaction.id);

      const {
        error,
      } = await supabase
        .from('withdrawals')
        .update({
          status: 'approved',
          updated_at:
            new Date().toISOString(),
        })
        .eq('id', transaction.sourceId);

      if (error) {
        throw error;
      }

      if (triggerToast) {
        triggerToast(
          `Withdrawal ${transaction.memberCode} approved.`,
          'success'
        );
      }

      await loadTransactions();
    } catch (error) {
      console.error(
        'Withdrawal approval error:',
        error
      );

      if (triggerToast) {
        triggerToast(
          'Unable to approve withdrawal.',
          'danger'
        );
      }
    } finally {
      setProcessingId(null);
    }
  };

  /* =========================================================
     Reject Withdrawal
  ========================================================= */

  const handleRejectWithdrawal = async (
    transaction
  ) => {
    if (processingId) return;

    try {
      setProcessingId(transaction.id);

      const {
        error,
      } = await supabase
        .from('withdrawals')
        .update({
          status: 'rejected',
          updated_at:
            new Date().toISOString(),
        })
        .eq('id', transaction.sourceId);

      if (error) {
        throw error;
      }

      if (triggerToast) {
        triggerToast(
          `Withdrawal ${transaction.memberCode} rejected.`,
          'danger'
        );
      }

      await loadTransactions();
    } catch (error) {
      console.error(
        'Withdrawal rejection error:',
        error
      );

      if (triggerToast) {
        triggerToast(
          'Unable to reject withdrawal.',
          'danger'
        );
      }
    } finally {
      setProcessingId(null);
    }
  };

  /* =========================================================
     Approve Deposit
  ========================================================= */

  const handleApproveDeposit = async (
    transaction
  ) => {
    if (processingId) return;

    try {
      setProcessingId(transaction.id);

      const {
        error,
      } = await supabase
        .from('members')
        .update({
          payment_status: 'approved',
          updated_at:
            new Date().toISOString(),
        })
        .eq('id', transaction.sourceId);

      if (error) {
        throw error;
      }

      if (triggerToast) {
        triggerToast(
          `Deposit for ${transaction.memberCode} approved.`,
          'success'
        );
      }

      await loadTransactions();
    } catch (error) {
      console.error(
        'Deposit approval error:',
        error
      );

      if (triggerToast) {
        triggerToast(
          'Unable to approve deposit.',
          'danger'
        );
      }
    } finally {
      setProcessingId(null);
    }
  };

  /* =========================================================
     Reject Deposit
  ========================================================= */

  const handleRejectDeposit = async (
    transaction
  ) => {
    if (processingId) return;

    try {
      setProcessingId(transaction.id);

      const {
        error,
      } = await supabase
        .from('members')
        .update({
          payment_status: 'rejected',
          updated_at:
            new Date().toISOString(),
        })
        .eq('id', transaction.sourceId);

      if (error) {
        throw error;
      }

      if (triggerToast) {
        triggerToast(
          `Deposit for ${transaction.memberCode} rejected.`,
          'danger'
        );
      }

      await loadTransactions();
    } catch (error) {
      console.error(
        'Deposit rejection error:',
        error
      );

      if (triggerToast) {
        triggerToast(
          'Unable to reject deposit.',
          'danger'
        );
      }
    } finally {
      setProcessingId(null);
    }
  };

  /* =========================================================
     Filter
  ========================================================= */

  const filteredTransactions =
    useMemo(() => {
      if (typeFilter === 'All') {
        return transactions;
      }

      return transactions.filter(
        (transaction) =>
          transaction.type === typeFilter
      );
    }, [
      transactions,
      typeFilter,
    ]);

  /* =========================================================
     Summary
  ========================================================= */

  const pendingWithdrawalTotal =
    transactions
      .filter(
        (transaction) =>
          transaction.type === 'Withdrawal' &&
          transaction.status === 'Pending'
      )
      .reduce(
        (total, transaction) =>
          total + transaction.amount,
        0
      );

  const approvedToday =
    transactions
      .filter((transaction) => {
        if (
          transaction.type !==
          'Withdrawal' ||
          transaction.status !==
          'Approved'
        ) {
          return false;
        }

        const date =
          new Date(transaction.updatedAt);

        const today =
          new Date();

        return (
          date.getDate() ===
          today.getDate() &&
          date.getMonth() ===
          today.getMonth() &&
          date.getFullYear() ===
          today.getFullYear()
        );
      })
      .reduce(
        (total, transaction) =>
          total + transaction.amount,
        0
      );

  const pendingDeposits =
    transactions.filter(
      (transaction) =>
        transaction.type === 'Deposit' &&
        transaction.status === 'Pending'
    ).length;

  /* =========================================================
     Render
  ========================================================= */

  return (
    <div className="space-y-6 animate-fade-in pb-12">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

        <div>
          <h1 className="text-2xl font-bold text-espresso dark:text-bone tracking-tight">
            Payment Approval
          </h1>

          <p className="text-sm text-warm-gray font-medium mt-0.5">
            Manage member deposits and withdrawal requests.
          </p>
        </div>

        <button
          onClick={loadTransactions}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-cream dark:bg-surface border border-sand dark:border-outline-variant text-xs font-bold text-espresso dark:text-bone hover:bg-bone transition-colors disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw
            className={`w-4 h-4 ${loading
                ? 'animate-spin'
                : ''
              }`}
          />

          Refresh
        </button>

      </div>

      {/* =====================================================
          SUMMARY CARDS
      ===================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">

        {/* Pending Withdrawals */}

        <div className="bg-cream dark:bg-surface border border-sand dark:border-outline-variant rounded-2xl p-5 shadow-sm">

          <div className="flex items-center gap-4">

            <div className="p-3 bg-primary/10 text-primary dark:text-rose-400 rounded-xl">
              <ArrowUpRight className="w-5 h-5" />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-warm-gray">
                Pending Withdrawals
              </p>

              <p className="text-2xl font-bold text-primary dark:text-rose-400 mt-0.5">
                {formatCurrency(
                  pendingWithdrawalTotal
                )}
              </p>
            </div>

          </div>

        </div>

        {/* Approved Today */}

        <div className="bg-cream dark:bg-surface border border-sand dark:border-outline-variant rounded-2xl p-5 shadow-sm">

          <div className="flex items-center gap-4">

            <div className="p-3 bg-forest/10 text-forest dark:text-emerald-400 rounded-xl">
              <CheckCircle className="w-5 h-5" />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-warm-gray">
                Approved Withdrawals Today
              </p>

              <p className="text-2xl font-bold text-forest dark:text-emerald-400 mt-0.5">
                {formatCurrency(
                  approvedToday
                )}
              </p>
            </div>

          </div>

        </div>

        {/* Pending Deposits */}

        <div className="bg-cream dark:bg-surface border border-sand dark:border-outline-variant rounded-2xl p-5 shadow-sm">

          <div className="flex items-center gap-4">

            <div className="p-3 bg-gold/15 text-gold rounded-xl">
              <CreditCard className="w-5 h-5" />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-warm-gray">
                Pending Deposits
              </p>

              <p className="text-2xl font-bold text-gold mt-0.5">
                {pendingDeposits}
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* =====================================================
          FILTERS
      ===================================================== */}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-cream dark:bg-surface border border-sand dark:border-outline-variant rounded-2xl p-4 shadow-sm">

        <div className="flex items-center gap-2 flex-wrap">

          <span className="text-xs font-semibold text-warm-gray">
            Type:
          </span>

          <div className="flex items-center bg-bone dark:bg-espresso p-1 rounded-lg border border-sand dark:border-outline-variant">

            {[
              {
                key: 'All',
                label: 'All',
              },
              {
                key: 'Withdrawal',
                label: 'Withdrawal',
              },
              {
                key: 'Deposit',
                label: 'Deposit',
              },
            ].map((type) => (

              <button
                key={type.key}
                onClick={() =>
                  setTypeFilter(
                    type.key
                  )
                }
                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${typeFilter ===
                    type.key
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-warm-gray hover:text-espresso dark:hover:text-bone'
                  }`}
              >
                {type.label}
              </button>

            ))}

          </div>

        </div>

        <div className="flex items-center gap-3">

          {lastUpdated && (
            <span className="text-[10px] text-warm-gray">
              Updated{' '}
              {formatDateTime(
                lastUpdated
              )}
            </span>
          )}

          <span className="text-xs font-semibold text-warm-gray">
            Showing{' '}
            {filteredTransactions.length}{' '}
            records
          </span>

        </div>

      </div>

      {/* =====================================================
          TRANSACTION TABLE
      ===================================================== */}

      <DataTable
        title="Payment Approval Queue"
        subtitle="Real member deposits and withdrawal requests from Supabase"
        headers={[
          'Member',
          'Type',
          'Amount',
          'Status',
          'Date',
          'Payment Details',
          'Actions',
        ]}
      >

        {loading ? (

          <tr>
            <td
              colSpan={7}
              className="px-6 py-14 text-center text-warm-gray"
            >
              <div className="flex items-center justify-center gap-3">

                <RefreshCw className="w-4 h-4 animate-spin" />

                <span className="text-sm">
                  Loading payment records...
                </span>

              </div>
            </td>
          </tr>

        ) : filteredTransactions.length === 0 ? (

          <tr>
            <td
              colSpan={7}
              className="px-6 py-14 text-center"
            >

              <Wallet className="w-8 h-8 mx-auto text-warm-gray/40" />

              <p className="text-sm font-semibold text-espresso dark:text-bone mt-3">
                No payment records found
              </p>

              <p className="text-xs text-warm-gray mt-1">
                New deposits and withdrawal requests will appear here automatically.
              </p>

            </td>
          </tr>

        ) : (

          filteredTransactions.map(
            (transaction) => {

              const isProcessing =
                processingId ===
                transaction.id;

              return (
                <tr
                  key={transaction.id}
                  className="hover:bg-bone/50 dark:hover:bg-espresso/50 transition-colors border-b border-sand/40 dark:border-outline-variant/40"
                >

                  {/* MEMBER */}

                  <td className="px-6 py-4">

                    <div className="flex flex-col">

                      <span className="font-semibold text-espresso dark:text-bone text-xs">
                        {transaction.memberName}
                      </span>

                      <span className="text-[10px] font-mono text-warm-gray mt-0.5">
                        {transaction.memberCode}
                      </span>

                    </div>

                  </td>

                  {/* TYPE */}

                  <td className="px-6 py-4">
                    <StatusBadge
                      type={
                        transaction.type
                      }
                    />
                  </td>

                  {/* AMOUNT */}

                  <td className="px-6 py-4">

                    <span className="font-bold text-espresso dark:text-bone text-sm">
                      {formatCurrency(
                        transaction.amount
                      )}
                    </span>

                  </td>

                  {/* STATUS */}

                  <td className="px-6 py-4">

                    <StatusBadge
                      status={
                        transaction.status
                      }
                    />

                  </td>

                  {/* DATE */}

                  <td className="px-6 py-4">

                    <div className="flex flex-col">

                      <span className="text-xs text-warm-gray font-medium">
                        {formatDate(
                          transaction.date
                        )}
                      </span>

                      {transaction.type ===
                        'Withdrawal' &&
                        transaction.updatedAt &&
                        transaction.status !==
                        'Pending' && (
                          <span className="text-[9px] text-warm-gray mt-0.5">
                            Updated{' '}
                            {formatDate(
                              transaction.updatedAt
                            )}
                          </span>
                        )}

                    </div>

                  </td>

                  {/* PAYMENT DETAILS */}

                  <td className="px-6 py-4">

                    {transaction.type ===
                      'Withdrawal' ? (

                      <div className="text-xs">

                        <div className="font-semibold text-espresso dark:text-bone">
                          {transaction.paymentMethod}
                        </div>

                        {transaction.bankName && (
                          <div className="text-[10px] text-warm-gray mt-0.5">
                            {transaction.bankName}
                          </div>
                        )}

                        {transaction.accountNumber && (
                          <div className="text-[10px] font-mono text-warm-gray mt-0.5">
                            A/C:{' '}
                            {transaction.accountNumber}
                          </div>
                        )}

                        {transaction.ifscCode && (
                          <div className="text-[10px] font-mono text-warm-gray">
                            IFSC:{' '}
                            {transaction.ifscCode}
                          </div>
                        )}

                      </div>

                    ) : (

                      <div className="text-xs">

                        <div className="font-semibold text-espresso dark:text-bone">
                          {transaction.paymentMethod}
                        </div>

                        <div className="text-[10px] font-mono text-warm-gray mt-0.5">
                          Ref:{' '}
                          {transaction.paymentReference ||
                            'Not provided'}
                        </div>

                      </div>

                    )}

                  </td>

                  {/* ACTIONS */}

                  <td className="px-6 py-4">

                    {transaction.status ===
                      'Pending' ? (

                      <div className="flex items-center gap-2">

                        <button
                          disabled={
                            isProcessing
                          }
                          onClick={() => {
                            if (
                              transaction.type ===
                              'Withdrawal'
                            ) {
                              handleApproveWithdrawal(
                                transaction
                              );
                            } else {
                              handleApproveDeposit(
                                transaction
                              );
                            }
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-forest hover:bg-emerald-800 text-white transition-all shadow-sm cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >

                          {isProcessing ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle className="w-3.5 h-3.5" />
                          )}

                          <span>
                            Approve
                          </span>

                        </button>

                        <button
                          disabled={
                            isProcessing
                          }
                          onClick={() => {
                            if (
                              transaction.type ===
                              'Withdrawal'
                            ) {
                              handleRejectWithdrawal(
                                transaction
                              );
                            } else {
                              handleRejectDeposit(
                                transaction
                              );
                            }
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-primary text-primary dark:text-rose-400 hover:bg-primary/10 transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >

                          <XCircle className="w-3.5 h-3.5" />

                          <span>
                            Reject
                          </span>

                        </button>

                      </div>

                    ) : (

                      <span className="text-xs text-warm-gray italic font-medium">
                        Completed
                      </span>

                    )}

                  </td>

                </tr>
              );
            }
          )

        )}

      </DataTable>

    </div>
  );
}