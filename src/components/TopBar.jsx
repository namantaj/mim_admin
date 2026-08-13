'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Bell, 
  Sparkles, 
  Check, 
  ChevronDown, 
  LogOut, 
  User, 
  Settings, 
  Globe
} from 'lucide-react';
import { initialAdminProfile } from '../data/mockData';
import { useLanguage } from '../context/LanguageContext';

export default function TopBar() {
  const router = useRouter();
  const { locale, switchLanguage, t } = useLanguage();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);

  const handleLogOut = () => {
    setShowUserDropdown(false);
    router.push('/login');
  };

  return (
    <header className="sticky top-0 right-0 z-20 bg-[#F4F0E6]/85 backdrop-blur-xl border-b border-[#D8D0C1]/80 px-8 py-3.5 flex items-center justify-between shadow-xs">
      {/* Search Input */}
      <div className="relative w-80 sm:w-96">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#756F66]" />
        <input
          type="text"
          placeholder={t('common.searchPlaceholder')}
          className="w-full pl-10 pr-12 py-2 text-xs font-medium bg-white/90 border border-[#D8D0C1] rounded-full focus:outline-none focus:ring-2 focus:ring-[#7A1F2B] focus:border-[#7A1F2B] focus:bg-white text-[#211E1A] placeholder-[#756F66]/80 transition-all shadow-inner"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 pointer-events-none">
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-[#756F66] bg-[#F4F0E6] border border-[#D8D0C1] rounded-md shadow-2xs">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Actions & User Badge */}
      <div className="flex items-center gap-4">
        {/* Language Switcher Pill Toggle */}
        <div className="flex items-center bg-white border border-[#D8D0C1] p-1 rounded-full shadow-2xs">
          <Globe className="w-3.5 h-3.5 text-[#7A1F2B] ml-2 mr-1" />
          <button
            onClick={() => switchLanguage('en')}
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
              locale === 'en'
                ? 'bg-[#7A1F2B] text-white shadow-2xs'
                : 'text-[#756F66] hover:text-[#211E1A]'
            }`}
          >
            English
          </button>
          <button
            onClick={() => switchLanguage('hi')}
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
              locale === 'hi'
                ? 'bg-[#7A1F2B] text-white shadow-2xs'
                : 'text-[#756F66] hover:text-[#211E1A]'
            }`}
          >
            हिंदी
          </button>
        </div>

        {/* System Online Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-[#28553F]/10 border border-[#28553F]/20 rounded-full text-[11px] font-bold text-[#28553F]">
          <span className="w-2 h-2 rounded-full bg-[#28553F] animate-pulse" />
          <span>{t('common.systemOnline')}</span>
        </div>

        {/* Notifications Button & Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserDropdown(false);
            }}
            className="relative p-2.5 rounded-full text-[#211E1A] bg-white border border-[#D8D0C1] hover:bg-[#EAE3D5] hover:border-[#7A1F2B]/30 transition-all shadow-2xs cursor-pointer active:scale-95"
            title="Notifications"
          >
            <Bell className="w-4 h-4 text-[#7A1F2B]" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-[#7A1F2B] text-white font-extrabold text-[9px] rounded-full flex items-center justify-center ring-2 ring-[#F4F0E6]">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Modal Popover */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-84 bg-white border border-[#D8D0C1] rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-[#D8D0C1]/60">
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-sm text-[#211E1A]">Notifications</h4>
                  <span className="text-[10px] bg-[#7A1F2B]/10 text-[#7A1F2B] font-bold px-2 py-0.5 rounded-full">
                    {unreadCount} New
                  </span>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => setUnreadCount(0)}
                    className="text-[11px] font-semibold text-[#7A1F2B] hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="py-2 space-y-2.5 max-h-72 overflow-y-auto">
                <div className="text-xs p-3 rounded-xl bg-[#F4F0E6]/70 border border-[#D8D0C1]/40 hover:bg-[#EAE3D5]/80 transition">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-[#211E1A]">Payout Requested</p>
                    <span className="text-[9px] text-[#7A1F2B] font-bold">New</span>
                  </div>
                  <p className="text-[#756F66] mt-1 text-[11px]">
                    Aarav Sharma submitted withdrawal request for <strong className="text-[#211E1A]">₹25,000</strong>.
                  </p>
                  <span className="text-[10px] text-[#756F66] mt-1.5 block">12 mins ago</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-6 w-[1px] bg-[#D8D0C1]" />

        {/* Admin Profile Dropdown Button */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserDropdown(!showUserDropdown);
              setShowNotifications(false);
            }}
            className="flex items-center gap-3 p-1.5 rounded-full hover:bg-white/80 border border-transparent hover:border-[#D8D0C1] transition cursor-pointer"
          >
            <div className="relative">
              <img
                src={initialAdminProfile.avatar}
                alt={initialAdminProfile.name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-[#7A1F2B] shadow-sm"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white" />
            </div>
            <div className="hidden sm:block text-left pr-1">
              <h4 className="text-xs font-extrabold text-[#211E1A] leading-tight flex items-center gap-1">
                <span>{initialAdminProfile.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#756F66]" />
              </h4>
              <span className="text-[10px] text-[#7A1F2B] font-bold bg-[#7A1F2B]/10 px-1.5 py-0.2 rounded-md">
                {initialAdminProfile.role}
              </span>
            </div>
          </button>

          {/* User Profile Dropdown Menu */}
          {showUserDropdown && (
            <div className="absolute right-0 mt-3 w-56 bg-white border border-[#D8D0C1] rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 space-y-1">
              <div className="px-3 py-2 border-b border-[#D8D0C1]/50">
                <p className="text-xs font-extrabold text-[#211E1A]">{initialAdminProfile.name}</p>
                <p className="text-[10px] text-[#756F66]">{initialAdminProfile.email}</p>
              </div>

              <Link
                href="/settings"
                onClick={() => setShowUserDropdown(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-[#211E1A] hover:bg-[#F4F0E6] transition"
              >
                <User className="w-4 h-4 text-[#7A1F2B]" />
                <span>Admin Profile</span>
              </Link>

              <Link
                href="/settings"
                onClick={() => setShowUserDropdown(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-[#211E1A] hover:bg-[#F4F0E6] transition"
              >
                <Settings className="w-4 h-4 text-[#7A1F2B]" />
                <span>Platform Settings</span>
              </Link>

              <div className="pt-1 border-t border-[#D8D0C1]/50">
                <button
                  onClick={handleLogOut}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-extrabold text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-700" />
                  <span>{t('common.logOut')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
