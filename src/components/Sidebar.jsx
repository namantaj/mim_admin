'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Wallet, 
  Settings, 
  LogOut, 
  ShieldCheck,
  ChevronRight,
  X,
  AlertTriangle,
  LogIn,
  Crown,
  Sparkles
} from 'lucide-react';
import { initialAdminProfile } from '../data/mockData';
import { useLanguage } from '../context/LanguageContext';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // If on login page, hide sidebar
  if (pathname === '/login') {
    return null;
  }

  const navItems = [
    {
      name: t('nav.dashboard'),
      href: '/',
      icon: LayoutDashboard,
    },
    {
      name: t('nav.members'),
      href: '/members',
      icon: Users,
      badge: '1,248',
    },
    {
      name: t('nav.walletPayouts'),
      href: '/payouts',
      icon: Wallet,
      badge: '18',
      badgeColor: 'bg-[#B8953D] text-white',
    },
    {
      name: t('nav.settings'),
      href: '/settings',
      icon: Settings,
    },
  ];

  const handleConfirmSignOut = () => {
    setShowConfirmModal(false);
    router.push('/login');
  };

  return (
    <>
      <aside className="fixed top-0 left-0 h-screen w-64 bg-[#F4F0E6] border-r border-[#D8D0C1] flex flex-col z-30 select-none shadow-sm">
        {/* Brand Logo Header */}
        <div className="pt-7 pb-5 px-6 border-b border-[#D8D0C1]/70 bg-gradient-to-b from-[#EAE3D5]/50 to-transparent flex flex-col items-center text-center">
          <Link href="/" className="inline-block transition-transform hover:scale-102">
            <img 
              src="/logo.png" 
              alt="Bhagwn Solutions" 
              className="w-[165px] h-auto object-contain drop-shadow-xs" 
            />
          </Link>
          
          <div className="flex items-center gap-1 mt-2.5">
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[#7A1F2B] bg-[#7A1F2B]/10 px-2.5 py-0.5 rounded-full border border-[#7A1F2B]/20 shadow-2xs">
              {t('common.adminPortal')}
            </span>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 py-5 px-3.5 space-y-1 overflow-y-auto">
          <div className="px-3 mb-3 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.15em] text-[#756F66]">
            <span>{t('common.managementMenu')}</span>
            <Sparkles className="w-3 h-3 text-[#B8953D]" />
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group relative flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? 'bg-[#7A1F2B] text-white shadow-md shadow-[#7A1F2B]/25 translate-x-1 font-extrabold'
                    : 'text-[#211E1A] hover:bg-[#EAE3D5] hover:text-[#7A1F2B] hover:translate-x-0.5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-1.5 rounded-lg transition-colors ${
                      isActive ? 'bg-white/15 text-white' : 'text-[#7A1F2B] group-hover:bg-[#7A1F2B]/10'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span>{item.name}</span>
                </div>

                <div className="flex items-center gap-2">
                  {item.badge && (
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : item.badgeColor || 'bg-[#7A1F2B]/10 text-[#7A1F2B]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-4 h-4 opacity-70" />}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Admin Profile Summary & Pinned Log Out Button */}
        <div className="p-4 border-t border-[#D8D0C1]/70 bg-gradient-to-t from-[#EAE3D5]/80 to-[#EAE3D5]/30 space-y-3">
          <div className="flex items-center gap-3 p-2 bg-white/70 backdrop-blur-sm border border-[#D8D0C1] rounded-xl shadow-xs">
            <img
              src={initialAdminProfile.avatar}
              alt={initialAdminProfile.name}
              className="w-9 h-9 rounded-lg object-cover ring-2 ring-[#7A1F2B]/30"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-[#211E1A] truncate">{initialAdminProfile.name}</p>
              <p className="text-[10px] font-medium text-[#756F66] flex items-center gap-1">
                <Crown className="w-3 h-3 text-[#B8953D]" />
                {initialAdminProfile.role}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowConfirmModal(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold text-[#7A1F2B] bg-white hover:bg-[#7A1F2B] hover:text-white border border-[#7A1F2B]/30 shadow-sm transition-all duration-200 active:scale-95 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('common.logOut')}</span>
          </button>
        </div>
      </aside>

      {/* Custom Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-[#D8D0C1] rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-5 relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setShowConfirmModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[#756F66] hover:bg-[#F4F0E6] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#7A1F2B]/10 text-[#7A1F2B] flex items-center justify-center ring-4 ring-[#7A1F2B]/5">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-[#211E1A]">{t('common.logOut')}</h3>
                <p className="text-xs text-[#756F66]">End current administrator session</p>
              </div>
            </div>

            <p className="text-xs text-[#756F66] leading-relaxed bg-[#F4F0E6]/60 p-3 rounded-xl border border-[#D8D0C1]/50">
              Are you sure you want to log out of <strong className="text-[#211E1A]">Bhagwn Solutions Admin Portal</strong>? You will be redirected to the login page.
            </p>

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 px-4 border border-[#D8D0C1] text-[#211E1A] font-bold text-xs rounded-full hover:bg-[#F4F0E6] transition cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleConfirmSignOut}
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-[#7A1F2B] to-[#621822] hover:from-[#621822] hover:to-[#4D121B] text-white font-bold text-xs rounded-full shadow-lg shadow-[#7A1F2B]/25 transition cursor-pointer"
              >
                {t('common.logOut')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
