'use client';

import React, { useState } from 'react';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { initialTransactions } from '../../data/mockData';
import { 
  CheckCircle, 
  XCircle, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Award, 
  DollarSign,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function PayoutsPage() {
  const { t } = useLanguage();
  const [transactions, setTransactions] = useState(initialTransactions);
  const [typeFilter, setTypeFilter] = useState('All');
  const [toast, setToast] = useState(null);

  // Handle Approve Action
  const handleApprove = (id) => {
    setTransactions((prev) =>
      prev.map((txn) => (txn.id === id ? { ...txn, status: 'Approved' } : txn))
    );
    setToast({ message: `Transaction ${id} Approved!`, type: 'success' });
    setTimeout(() => setToast(null), 3000);
  };

  // Handle Reject Action
  const handleReject = (id) => {
    setTransactions((prev) =>
      prev.map((txn) => (txn.id === id ? { ...txn, status: 'Rejected' } : txn))
    );
    setToast({ message: `Transaction ${id} Rejected.`, type: 'danger' });
    setTimeout(() => setToast(null), 3000);
  };

  // Filter transactions
  const filteredTxns = transactions.filter((txn) => {
    if (typeFilter === 'All') return true;
    return txn.type === typeFilter;
  });

  const pendingWithdrawalTotal = transactions
    .filter((t) => t.status === 'Pending' && t.type === 'Withdrawal')
    .reduce((acc, curr) => acc + parseInt(curr.amount.replace(/[^0-9]/g, '')), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Breadcrumb & Header */}
      <div>
        <nav className="flex items-center gap-2 text-xs text-[#756F66] font-medium mb-1">
          <span>Home</span>
          <span>/</span>
          <span className="text-[#7A1F2B] font-semibold">{t('nav.walletPayouts')}</span>
        </nav>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-[#211E1A] tracking-tight">{t('payouts.title')}</h1>
            <p className="text-sm text-[#756F66] font-medium mt-0.5">
              {t('payouts.subtitle')}
            </p>
          </div>

          {toast && (
            <div className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 animate-in fade-in shadow-md ${
              toast.type === 'success' ? 'bg-emerald-100 border border-emerald-300 text-emerald-800' : 'bg-rose-100 border border-rose-300 text-rose-800'
            }`}>
              <CheckCircle2 className="w-4 h-4" />
              <span>{toast.message}</span>
            </div>
          )}
        </div>
      </div>

      {/* Summary Chips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-gradient-to-br from-white via-[#FBF9F4] to-[#7A1F2B]/5 border border-[#D8D0C1] rounded-2xl p-6 shadow-xs relative overflow-hidden group hover:shadow-lg transition-all">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#7A1F2B]/10 text-[#7A1F2B] rounded-2xl ring-4 ring-[#7A1F2B]/5">
              <ArrowUpRight className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-[#756F66]">{t('payouts.pendingWithdrawals')}</p>
              <p className="text-2xl font-black text-[#7A1F2B] mt-0.5">
                ₹{pendingWithdrawalTotal.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white via-[#FBF9F4] to-[#28553F]/5 border border-[#D8D0C1] rounded-2xl p-6 shadow-xs relative overflow-hidden group hover:shadow-lg transition-all">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#28553F]/10 text-[#28553F] rounded-2xl ring-4 ring-[#28553F]/5">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-[#756F66]">{t('payouts.totalApprovedToday')}</p>
              <p className="text-2xl font-black text-[#28553F] mt-0.5">₹1,12,000</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white via-[#FBF9F4] to-[#B8953D]/10 border border-[#D8D0C1] rounded-2xl p-6 shadow-xs relative overflow-hidden group hover:shadow-lg transition-all">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#B8953D]/15 text-[#B8953D] rounded-2xl ring-4 ring-[#B8953D]/5">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-[#756F66]">{t('payouts.bonusesDisbursed')}</p>
              <p className="text-2xl font-black text-[#B8953D] mt-0.5">₹47,500</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between bg-white border border-[#D8D0C1] rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#756F66]">Type:</span>
          <div className="flex items-center bg-[#F4F0E6] p-1 rounded-full border border-[#D8D0C1]">
            {[
              { key: 'All', label: t('payouts.allTypes') },
              { key: 'Withdrawal', label: t('payouts.withdrawals') },
              { key: 'Deposit', label: t('payouts.deposits') },
              { key: 'Bonus', label: t('payouts.bonuses') }
            ].map((type) => (
              <button
                key={type.key}
                onClick={() => setTypeFilter(type.key)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  typeFilter === type.key
                    ? 'bg-[#7A1F2B] text-white shadow-xs'
                    : 'text-[#756F66] hover:text-[#211E1A]'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        <span className="text-xs font-bold text-[#756F66]">
          Showing {filteredTxns.length} records
        </span>
      </div>

      {/* Transactions Table */}
      <DataTable
        title="Transaction & Payout Queue"
        subtitle="Approve or reject pending member withdrawal requests in real-time"
        headers={['Member Name', 'Type', 'Amount', 'Status', 'Date', 'Payment Details', 'Actions']}
      >
        {filteredTxns.length === 0 ? (
          <tr>
            <td colSpan={7} className="px-6 py-12 text-center text-[#756F66]">
              No transaction records found.
            </td>
          </tr>
        ) : (
          filteredTxns.map((txn) => (
            <tr key={txn.id} className="hover:bg-[#F4F0E6]/50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex flex-col">
                  <span className="font-extrabold text-[#211E1A] text-xs">{txn.memberName}</span>
                  <span className="text-[10px] font-mono text-[#756F66]">{txn.id}</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <StatusBadge type={txn.type} />
              </td>
              <td className="px-6 py-4 font-black text-[#211E1A] text-sm">{txn.amount}</td>
              <td className="px-6 py-4">
                <StatusBadge status={txn.status} />
              </td>
              <td className="px-6 py-4 text-xs text-[#756F66] font-medium">{txn.date}</td>
              <td className="px-6 py-4 text-xs text-[#756F66]">
                <div className="font-bold text-[#211E1A]">{txn.paymentMethod}</div>
                <div className="text-[10px] font-mono text-[#756F66] mt-0.5">{txn.accountDetails}</div>
              </td>
              <td className="px-6 py-4">
                {txn.status === 'Pending' ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprove(txn.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-full bg-emerald-700 hover:bg-emerald-800 text-white transition-all shadow-xs cursor-pointer active:scale-95"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{t('payouts.approve')}</span>
                    </button>
                    <button
                      onClick={() => handleReject(txn.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-full border border-rose-300 text-rose-700 hover:bg-rose-100 transition-all cursor-pointer active:scale-95"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>{t('payouts.reject')}</span>
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-[#756F66] italic font-medium">Completed</span>
                )}
              </td>
            </tr>
          ))
        )}
      </DataTable>
    </div>
  );
}
