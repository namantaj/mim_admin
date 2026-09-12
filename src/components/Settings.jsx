import React, { useState, useEffect } from 'react';
import { initialAdminProfile } from '../data/mockData';
import { User, Shield, Lock, Globe, Mail, Save, CheckCircle2, Sliders } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAdmin } from '../context/AdminContext';
import { supabase } from '../lib/supabase';

export default function Settings({ triggerToast }) {
  const { t } = useLanguage();
  const { adminProfile, adminName, updateAdminProfile } = useAdmin();

  const [profile, setProfile] = useState({
    name: adminName || initialAdminProfile.name,
    email: adminProfile?.email || initialAdminProfile.email,
    role: adminProfile?.role || initialAdminProfile.role,
    platformName: initialAdminProfile.platformName,
    supportEmail: initialAdminProfile.supportEmail,
    currency: initialAdminProfile.currency,
    timezone: initialAdminProfile.timezone
  });

  useEffect(() => {
    if (adminProfile || adminName) {
      setProfile((prev) => ({
        ...prev,
        name: adminName,
        email: adminProfile?.email || prev.email,
        role: adminProfile?.role || prev.role
      }));
    }
  }, [adminProfile, adminName]);

  // Two independent React state variables for password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [notifications, setNotifications] = useState({ emailAlerts: true, autoApproveSmallPayouts: false, kycReminders: true });

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateAdminProfile({ full_name: profile.name });
      if (triggerToast) triggerToast('Admin Profile updated successfully!');
    } catch (err) {
      console.error('Error updating admin profile:', err);
      if (triggerToast) triggerToast(err.message || 'Failed to update profile', 'danger');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    const current = currentPassword.trim();
    const newPwd = newPassword;

    // Form validations
    if (!current) {
      setPasswordError('Current password is required.');
      return;
    }

    if (!newPwd) {
      setPasswordError('New password is required.');
      return;
    }

    if (newPwd.length < 6) {
      setPasswordError('New password must contain at least 6 characters.');
      return;
    }

    if (current === newPwd) {
      setPasswordError('New password must be different from current password.');
      return;
    }

    try {
      setUpdatingPassword(true);

      // 1. Get currently authenticated Supabase user
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user || !user.email) {
        throw new Error('Unable to identify currently authenticated admin session.');
      }

      // 2. Verify current password by re-authenticating
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: current
      });

      if (signInError) {
        setPasswordError('Current password is incorrect.');
        if (triggerToast) {
          triggerToast('Current password is incorrect.', 'danger');
        }
        setUpdatingPassword(false);
        return;
      }

      // 3. Update password via Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPwd
      });

      if (updateError) {
        if (
          updateError.code === 'same_password' ||
          updateError.message?.includes('same_password') ||
          updateError.message?.toLowerCase().includes('different')
        ) {
          setPasswordError('New password must be different from current password.');
          if (triggerToast) {
            triggerToast('New password must be different from current password.', 'danger');
          }
        } else {
          setPasswordError(updateError.message || 'Failed to update password.');
          if (triggerToast) {
            triggerToast(updateError.message || 'Failed to update password.', 'danger');
          }
        }
        setUpdatingPassword(false);
        return;
      }

      // 4. On success: clear input states, show notification, keep logged in
      setPasswordSuccess('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');

      if (triggerToast) {
        triggerToast('Password updated successfully.', 'success');
      }

    } catch (err) {
      const msg = err.message || 'An error occurred while updating the password.';
      setPasswordError(msg);
      if (triggerToast) {
        triggerToast(msg, 'danger');
      }
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handlePlatformSubmit = (e) => {
    e.preventDefault();
    if (triggerToast) triggerToast('Platform Configuration saved!');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in pb-12">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-espresso dark:text-bone tracking-tight">{t('settings.title')}</h1>
          <p className="text-sm text-warm-gray font-medium mt-0.5">
            {t('settings.subtitle')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Admin Profile Summary */}
        <div className="space-y-6">
          <div className="bg-cream dark:bg-surface border border-sand dark:border-outline-variant rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-sand dark:border-outline-variant pb-4">
              <User className="w-5 h-5 text-primary dark:text-rose-400" />
              <div>
                <h2 className="text-base font-bold text-espresso dark:text-bone">{t('settings.adminProfile')}</h2>
                <p className="text-xs text-warm-gray">Manage administrator account information</p>
              </div>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-warm-gray mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full h-10 px-3.5 bg-bone dark:bg-espresso border border-sand dark:border-outline-variant rounded-lg text-[13px] font-medium text-espresso dark:text-bone focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-warm-gray mb-1">
                  Admin Email Address
                </label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full h-10 px-3.5 bg-bone dark:bg-espresso border border-sand dark:border-outline-variant rounded-lg text-[13px] font-medium text-espresso dark:text-bone focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-warm-gray mb-1">
                  System Clearance Role
                </label>
                <input
                  type="text"
                  value={profile.role}
                  disabled
                  className="w-full h-10 px-3.5 bg-ivory dark:bg-[#1E1B18] border border-sand dark:border-outline-variant rounded-lg text-[13px] font-medium text-warm-gray cursor-not-allowed"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary-hover text-white px-6 h-10 rounded-lg text-[13px] font-semibold transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{t('settings.saveProfile')}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Card */}
          <div className="bg-cream dark:bg-surface border border-sand dark:border-outline-variant rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-espresso dark:text-bone">
              <Lock className="w-4 h-4 text-primary dark:text-rose-400" />
              <span>Security & Password</span>
            </div>

            {passwordError && (
              <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-950/30 px-3.5 py-2.5">
                <p className="text-xs font-semibold text-red-700 dark:text-red-400">
                  {passwordError}
                </p>
              </div>
            )}

            {passwordSuccess && (
              <div className="rounded-lg border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 px-3.5 py-2.5">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  {passwordSuccess}
                </p>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-warm-gray mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full h-10 px-3.5 bg-bone dark:bg-espresso border border-sand dark:border-outline-variant rounded-lg text-[13px] font-medium text-espresso dark:text-bone focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
                  required
                  disabled={updatingPassword}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-warm-gray mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full h-10 px-3.5 bg-bone dark:bg-espresso border border-sand dark:border-outline-variant rounded-lg text-[13px] font-medium text-espresso dark:text-bone focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
                  required
                  disabled={updatingPassword}
                />
              </div>

              <button
                type="submit"
                disabled={updatingPassword}
                className="border border-primary text-primary dark:text-rose-400 hover:bg-primary hover:text-white px-5 h-9 rounded-lg text-[13px] font-semibold transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span>{updatingPassword ? 'Updating Password...' : 'Update Password'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Section 2: Platform Configurations */}
        <div className="space-y-6">
          <div className="bg-cream dark:bg-surface border border-sand dark:border-outline-variant rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-sand dark:border-outline-variant pb-4">
              <Globe className="w-5 h-5 text-gold" />
              <div>
                <h2 className="text-base font-bold text-espresso dark:text-bone">{t('settings.platformParameters')}</h2>
                <p className="text-xs text-warm-gray">System parameters for Bhagwn Solutions</p>
              </div>
            </div>

            <form onSubmit={handlePlatformSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-warm-gray mb-1">
                  Platform Name
                </label>
                <input
                  type="text"
                  value={profile.platformName}
                  onChange={(e) => setProfile({ ...profile, platformName: e.target.value })}
                  className="w-full h-10 px-3.5 bg-bone dark:bg-espresso border border-sand dark:border-outline-variant rounded-lg text-[13px] font-medium text-espresso dark:text-bone focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-warm-gray mb-1">
                  Support Contact Email
                </label>
                <input
                  type="email"
                  value={profile.supportEmail}
                  onChange={(e) => setProfile({ ...profile, supportEmail: e.target.value })}
                  className="w-full h-10 px-3.5 bg-bone dark:bg-espresso border border-sand dark:border-outline-variant rounded-lg text-[13px] font-medium text-espresso dark:text-bone focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-warm-gray mb-1">
                  Base Currency Unit
                </label>
                <select
                  value={profile.currency}
                  onChange={(e) => setProfile({ ...profile, currency: e.target.value })}
                  className="w-full h-10 px-3.5 bg-bone dark:bg-espresso border border-sand dark:border-outline-variant rounded-lg text-[13px] font-medium text-espresso dark:text-bone focus:outline-none cursor-pointer"
                >
                  <option value="INR (₹)">Indian Rupee (INR ₹)</option>
                  <option value="USD ($)">US Dollar (USD $)</option>
                  <option value="USDT">USDT Tether (TRC20)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-warm-gray mb-1">
                  System Timezone
                </label>
                <input
                  type="text"
                  value={profile.timezone}
                  disabled
                  className="w-full h-10 px-3.5 bg-ivory dark:bg-[#1E1B18] border border-sand dark:border-outline-variant rounded-lg text-[13px] font-medium text-warm-gray cursor-not-allowed"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary-hover text-white px-6 h-10 rounded-lg text-[13px] font-semibold transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{t('settings.saveConfig')}</span>
                </button>
              </div>
            </form>
          </div>

          {/* System Toggles Card */}
          <div className="bg-cream dark:bg-surface border border-sand dark:border-outline-variant rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-espresso dark:text-bone">
              <Sliders className="w-4 h-4 text-primary dark:text-rose-400" />
              <span>Automated Rules & Preferences</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-bone dark:bg-espresso border border-sand dark:border-outline-variant">
                <div>
                  <p className="font-bold text-espresso dark:text-bone">Email Alerts on New Withdrawals</p>
                  <p className="text-[10px] text-warm-gray">Notify admin email for requests &gt; ₹50,000</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.emailAlerts}
                  onChange={(e) => setNotifications({ ...notifications, emailAlerts: e.target.checked })}
                  className="w-4 h-4 accent-primary cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-bone dark:bg-espresso border border-sand dark:border-outline-variant">
                <div>
                  <p className="font-bold text-espresso dark:text-bone">Automate KYC Reminders</p>
                  <p className="text-[10px] text-warm-gray">Send system emails to unverified members</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.kycReminders}
                  onChange={(e) => setNotifications({ ...notifications, kycReminders: e.target.checked })}
                  className="w-4 h-4 accent-primary cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
