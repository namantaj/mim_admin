'use client';

import React, { useState } from 'react';
import { initialAdminProfile } from '../../data/mockData';
import { User, Shield, Lock, Globe, Mail, Save, CheckCircle2, Bell, Sliders } from 'lucide-react';

export default function SettingsPage() {
  const [profile, setProfile] = useState(initialAdminProfile);
  const [passwords, setPasswords] = useState({ current: '', newPassword: '', confirm: '' });
  const [notifications, setNotifications] = useState({ emailAlerts: true, autoApproveSmallPayouts: false, kycReminders: true });
  const [saveMessage, setSaveMessage] = useState(null);

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    setSaveMessage('Admin Profile updated successfully!');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handlePlatformSubmit = (e) => {
    e.preventDefault();
    setSaveMessage('Platform Configuration saved!');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  return (
    <div className="space-y-8 max-w-6xl animate-in fade-in duration-300">
      {/* Breadcrumb & Header */}
      <div>
        <nav className="flex items-center gap-2 text-xs text-[#756F66] font-medium mb-1">
          <span>Home</span>
          <span>/</span>
          <span className="text-[#7A1F2B] font-semibold">Settings</span>
        </nav>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-[#211E1A] tracking-tight">Admin & Platform Settings</h1>
            <p className="text-sm text-[#756F66] font-medium mt-0.5">
              Manage your administrator credentials, system security, and platform parameters.
            </p>
          </div>
          {saveMessage && (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-full animate-in fade-in shadow-md">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{saveMessage}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Section 1: Admin Profile & Security */}
        <div className="space-y-6">
          <div className="bg-white border border-[#D8D0C1] rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-[#D8D0C1]/60 pb-4">
              <div className="w-10 h-10 rounded-xl bg-[#7A1F2B]/10 text-[#7A1F2B] flex items-center justify-center font-bold ring-4 ring-[#7A1F2B]/5">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-[#211E1A]">Admin Profile</h2>
                <p className="text-xs text-[#756F66]">Manage administrator account information</p>
              </div>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#756F66] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full px-4 py-2.5 text-xs bg-[#F4F0E6]/50 border border-[#D8D0C1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1F2B] text-[#211E1A] font-bold shadow-inner"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#756F66] mb-1">
                  Admin Email Address
                </label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full px-4 py-2.5 text-xs bg-[#F4F0E6]/50 border border-[#D8D0C1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1F2B] text-[#211E1A] font-bold shadow-inner"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#756F66] mb-1">
                  System Clearance Role
                </label>
                <input
                  type="text"
                  value={profile.role}
                  disabled
                  className="w-full px-4 py-2.5 text-xs bg-[#EAE3D5] border border-[#D8D0C1] rounded-xl text-[#756F66] font-bold cursor-not-allowed"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#7A1F2B] hover:bg-[#621822] text-white font-bold text-xs rounded-full shadow-lg shadow-[#7A1F2B]/20 transition-all cursor-pointer active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Profile</span>
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Card */}
          <div className="bg-white border border-[#D8D0C1] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-sm font-extrabold text-[#211E1A]">
              <Lock className="w-4 h-4 text-[#7A1F2B]" />
              <span>Security & Password</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#756F66] mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={passwords.current}
                  onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                  className="w-full px-4 py-2.5 text-xs bg-[#F4F0E6]/50 border border-[#D8D0C1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1F2B] text-[#211E1A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#756F66] mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                  className="w-full px-4 py-2.5 text-xs bg-[#F4F0E6]/50 border border-[#D8D0C1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1F2B] text-[#211E1A]"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setSaveMessage('Password updated successfully!');
                setPasswords({ current: '', newPassword: '', confirm: '' });
                setTimeout(() => setSaveMessage(null), 3000);
              }}
              className="inline-flex items-center gap-2 px-5 py-2 border border-[#7A1F2B] text-[#7A1F2B] hover:bg-[#7A1F2B] hover:text-white font-bold text-xs rounded-full transition-all cursor-pointer active:scale-95"
            >
              <span>Update Password</span>
            </button>
          </div>
        </div>

        {/* Section 2: Platform Configurations & Rules */}
        <div className="space-y-6">
          <div className="bg-white border border-[#D8D0C1] rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-[#D8D0C1]/60 pb-4">
              <div className="w-10 h-10 rounded-xl bg-[#B8953D]/15 text-[#B8953D] flex items-center justify-center font-bold ring-4 ring-[#B8953D]/5">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-[#211E1A]">Platform Parameters</h2>
                <p className="text-xs text-[#756F66]">System parameters for Bhagwn Solutions</p>
              </div>
            </div>

            <form onSubmit={handlePlatformSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#756F66] mb-1">
                  Platform Name
                </label>
                <input
                  type="text"
                  value={profile.platformName}
                  onChange={(e) => setProfile({ ...profile, platformName: e.target.value })}
                  className="w-full px-4 py-2.5 text-xs bg-[#F4F0E6]/50 border border-[#D8D0C1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1F2B] text-[#211E1A] font-bold shadow-inner"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#756F66] mb-1">
                  Support Contact Email
                </label>
                <input
                  type="email"
                  value={profile.supportEmail}
                  onChange={(e) => setProfile({ ...profile, supportEmail: e.target.value })}
                  className="w-full px-4 py-2.5 text-xs bg-[#F4F0E6]/50 border border-[#D8D0C1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1F2B] text-[#211E1A] font-bold shadow-inner"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#756F66] mb-1">
                  Base Currency Unit
                </label>
                <select
                  value={profile.currency}
                  onChange={(e) => setProfile({ ...profile, currency: e.target.value })}
                  className="w-full px-4 py-2.5 text-xs bg-[#F4F0E6]/50 border border-[#D8D0C1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1F2B] text-[#211E1A] font-bold cursor-pointer"
                >
                  <option value="INR (₹)">Indian Rupee (INR ₹)</option>
                  <option value="USD ($)">US Dollar (USD $)</option>
                  <option value="USDT">USDT Tether (TRC20)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#756F66] mb-1">
                  System Timezone
                </label>
                <input
                  type="text"
                  value={profile.timezone}
                  disabled
                  className="w-full px-4 py-2.5 text-xs bg-[#EAE3D5] border border-[#D8D0C1] rounded-xl text-[#756F66] font-bold cursor-not-allowed"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#7A1F2B] hover:bg-[#621822] text-white font-bold text-xs rounded-full shadow-lg shadow-[#7A1F2B]/20 transition-all cursor-pointer active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Configuration</span>
                </button>
              </div>
            </form>
          </div>

          {/* System Toggles Card */}
          <div className="bg-white border border-[#D8D0C1] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-sm font-extrabold text-[#211E1A]">
              <Sliders className="w-4 h-4 text-[#7A1F2B]" />
              <span>Automated Rules & Preferences</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F4F0E6]/60 border border-[#D8D0C1]/50">
                <div>
                  <p className="font-bold text-[#211E1A]">Email Alerts on New Withdrawals</p>
                  <p className="text-[10px] text-[#756F66]">Notify admin email for requests &gt; ₹50,000</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.emailAlerts}
                  onChange={(e) => setNotifications({ ...notifications, emailAlerts: e.target.checked })}
                  className="w-4 h-4 accent-[#7A1F2B] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F4F0E6]/60 border border-[#D8D0C1]/50">
                <div>
                  <p className="font-bold text-[#211E1A]">Automate KYC Reminders</p>
                  <p className="text-[10px] text-[#756F66]">Send system emails to unverified members</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.kycReminders}
                  onChange={(e) => setNotifications({ ...notifications, kycReminders: e.target.checked })}
                  className="w-4 h-4 accent-[#7A1F2B] cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
