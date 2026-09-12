import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

import {
  User,
  ShieldCheck,
  Lock,
  Globe,
  Mail,
  Phone,
  KeyRound,
  CheckCircle2,
  Eye,
  EyeOff,
  Smartphone,
  Crown,
  Laptop
} from 'lucide-react';

import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAdmin } from '../context/AdminContext';

export default function AdminProfile({ triggerToast }) {
  const { t, locale, switchLanguage } = useLanguage();
  const { darkMode, toggleDarkMode } = useTheme();
  const { updateAdminProfile, changePassword } = useAdmin();

  const [activeTab, setActiveTab] = useState('personal');

  // ================================
  // Profile State
  // ================================
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',

    // These fields will be connected to Supabase later
    dob: '1988-06-15',
    gender: 'Male',
    street: '702 Platinum Tower, Sector 62',
    city: 'Noida',
    state: 'Uttar Pradesh',
    zip: '201301',
    country: 'India'
  });

  // ================================
  // Account State
  // ================================
  const [accountData, setAccountData] = useState({
    id: '',
    role: '',
    createdAt: null,
    updatedAt: null
  });

  // ================================
  // Security State
  // ================================
  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: true
  });

  // ================================
  // UI State
  // ================================
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // ============================================================
  // LOAD ADMIN PROFILE FROM SUPABASE
  // ============================================================
  useEffect(() => {
    const loadAdminProfile = async () => {
      try {
        setLoadingProfile(true);

        // Get currently authenticated Supabase user
        const {
          data: { user },
          error: userError
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          throw new Error('No authenticated user found.');
        }

        // Get corresponding profile
        const {
          data: profile,
          error: profileError
        } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          throw profileError;
        }

        // Make sure this is actually an admin
        if (profile.role !== 'admin') {
          throw new Error('This account does not have admin privileges.');
        }

        // Set profile information
        setProfileData((previous) => ({
          ...previous,
          name: profile.full_name || '',
          email: profile.email || user.email || '',
          phone: profile.phone || ''
        }));

        // Set account information
        setAccountData({
          id: profile.id,
          role: profile.role,
          createdAt: profile.created_at,
          updatedAt: profile.updated_at
        });

      } catch (error) {
        console.error('Failed to load admin profile:', error);

        if (triggerToast) {
          triggerToast(
            error.message || 'Failed to load profile.',
            'danger'
          );
        }
      } finally {
        setLoadingProfile(false);
      }
    };

    loadAdminProfile();
  }, [triggerToast]);

  // ============================================================
  // SAVE PERSONAL PROFILE
  // ============================================================
  const handlePersonalSubmit = async (e) => {
    e.preventDefault();

    try {
      setSavingProfile(true);

      // Get current authenticated user
      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error('No authenticated user found.');
      }

      // Update fields in profiles table & context
      await updateAdminProfile({
        full_name: profileData.name,
        phone: profileData.phone
      });

      if (triggerToast) {
        triggerToast(
          t('profile.saveSuccess') || 'Profile updated successfully.',
          'success'
        );
      }

    } catch (error) {
      console.error('Failed to save admin profile:', error);

      if (triggerToast) {
        triggerToast(
          error.message || 'Failed to save profile.',
          'danger'
        );
      }
    } finally {
      setSavingProfile(false);
    }
  };

  // ============================================================
  // CHANGE PASSWORD
  // ============================================================
  const handleSecuritySubmit = async (e) => {
    e.preventDefault();

    try {
      setChangingPassword(true);

      const currentPassword = securityData.currentPassword.trim();
      const newPassword = securityData.newPassword;
      const confirmPassword = securityData.confirmPassword;

      // Basic validation
      if (!currentPassword || !newPassword || !confirmPassword) {
        throw new Error('Please fill in all password fields.');
      }

      if (newPassword !== confirmPassword) {
        throw new Error('New passwords do not match.');
      }

      if (newPassword.length < 6) {
        throw new Error(
          'New password must contain at least 6 characters.'
        );
      }

      // Change password via Supabase Auth
      await changePassword({
        currentPassword,
        newPassword
      });

      // Clear password fields
      setSecurityData((previous) => ({
        ...previous,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));

      if (triggerToast) {
        triggerToast(
          'Password changed successfully!',
          'success'
        );
      }

    } catch (error) {
      console.error('Failed to change password:', error);

      if (triggerToast) {
        triggerToast(
          error.message || 'Failed to change password.',
          'danger'
        );
      }
    } finally {
      setChangingPassword(false);
    }
  };

  // ============================================================
  // LOADING SCREEN
  // ============================================================
  if (loadingProfile) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />

          <p className="text-xs font-semibold text-warm-gray">
            Loading administrator profile...
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // MAIN UI
  // ============================================================
  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in pb-12">

      {/* ======================================================
          PROFILE HEADER HERO
      ======================================================= */}
      <div className="bg-cream dark:bg-surface border border-sand dark:border-outline-variant rounded-2xl p-6 md:p-8 shadow-sm relative overflow-hidden">

        {/* Background Decorative Accent */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 rounded-full bg-gold/10 blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">

          {/* Avatar & Admin Main Info */}
          <div className="flex items-center gap-5">

            <div className="relative group">

              <img
                src="/logo.png"
                alt={profileData.name || 'Admin'}
                className="w-20 h-20 rounded-2xl object-cover ring-4 ring-gold/40 shadow-md"
              />

              <span
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-forest text-white flex items-center justify-center shadow"
                title="Verified Super Admin"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
              </span>

            </div>

            <div className="space-y-1">

              <div className="flex items-center gap-3 flex-wrap">

                <h1 className="text-2xl font-bold text-espresso dark:text-bone tracking-tight">
                  {profileData.name || 'Administrator'}
                </h1>

                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary dark:text-rose-400 border border-primary/20">
                  <Crown className="w-3 h-3 text-gold" />
                  {t('profile.administrator')}
                </span>

                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-forest/10 text-forest dark:text-emerald-400 border border-forest/20">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified Admin
                </span>

              </div>

              <div className="flex items-center gap-4 text-xs text-warm-gray flex-wrap">

                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-primary dark:text-rose-400" />
                  {profileData.email}
                </span>

                <span className="flex items-center gap-1 font-mono">
                  <KeyRound className="w-3.5 h-3.5 text-gold" />
                  ID: {accountData.id ? accountData.id.substring(0, 8) : '---'}
                </span>

              </div>

            </div>
          </div>

          {/* ==================================================
              ADMIN HEADER STATS
          =================================================== */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto">

            <div className="bg-bone dark:bg-espresso p-3 rounded-xl border border-sand dark:border-outline-variant text-center">
              <span className="text-[10px] text-warm-gray uppercase font-semibold block">
                System Role
              </span>

              <span className="text-xs font-bold text-primary dark:text-rose-400 mt-0.5 block">
                {accountData.role === 'admin' ? 'Super Admin' : accountData.role}
              </span>
            </div>

            <div className="bg-bone dark:bg-espresso p-3 rounded-xl border border-sand dark:border-outline-variant text-center">

              <span className="text-[10px] text-warm-gray uppercase font-semibold block">
                Account Created
              </span>

              <span className="text-xs font-bold text-espresso dark:text-bone mt-0.5 block">
                {accountData.createdAt
                  ? new Date(accountData.createdAt).toLocaleDateString(
                    'en-IN',
                    {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    }
                  )
                  : '---'}
              </span>

            </div>

            <div className="bg-bone dark:bg-espresso p-3 rounded-xl border border-sand dark:border-outline-variant text-center">

              <span className="text-[10px] text-warm-gray uppercase font-semibold block">
                Last Updated
              </span>

              <span className="text-xs font-bold text-espresso dark:text-bone mt-0.5 block">
                {accountData.updatedAt
                  ? new Date(accountData.updatedAt).toLocaleDateString(
                    'en-IN',
                    {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    }
                  )
                  : '---'}
              </span>

            </div>

            <div className="bg-bone dark:bg-espresso p-3 rounded-xl border border-sand dark:border-outline-variant text-center">

              <span className="text-[10px] text-warm-gray uppercase font-semibold block">
                Account Status
              </span>

              <span className="text-xs font-bold text-forest dark:text-emerald-400 mt-0.5 block">
                Active
              </span>

            </div>

          </div>
        </div>

        {/* ====================================================
            TAB NAVIGATION
        ===================================================== */}
        <div className="flex items-center gap-2 border-t border-sand dark:border-outline-variant mt-6 pt-4">

          {[
            {
              id: 'personal',
              label: t('profile.personalInfo'),
              icon: User
            },
            {
              id: 'security',
              label: t('profile.securityTab'),
              icon: Lock
            },
            {
              id: 'settings',
              label: t('profile.accountSettings'),
              icon: Globe
            }
          ].map((tab) => {

            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-warm-gray hover:text-espresso dark:hover:text-bone hover:bg-bone dark:hover:bg-espresso'
                  }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}

        </div>
      </div>

      {/* ======================================================
          TAB 1: PERSONAL INFORMATION
      ======================================================= */}
      {activeTab === 'personal' && (
        <div className="bg-cream dark:bg-surface border border-sand dark:border-outline-variant rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in">

          <div className="border-b border-sand dark:border-outline-variant pb-4">

            <h2 className="text-base font-bold text-espresso dark:text-bone">
              Personal & Contact Details
            </h2>

            <p className="text-xs text-warm-gray">
              Update your administrator details
            </p>

          </div>

          <form
            onSubmit={handlePersonalSubmit}
            className="space-y-4"
          >

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Full Name */}
              <div>

                <label className="block text-xs font-semibold text-warm-gray mb-1">
                  Full Name
                </label>

                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      name: e.target.value
                    })
                  }
                  className="w-full h-10 px-3.5 bg-bone dark:bg-espresso border border-sand dark:border-outline-variant rounded-lg text-[13px] font-medium text-espresso dark:text-bone focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />

              </div>

              {/* Email */}
              <div>

                <label className="block text-xs font-semibold text-warm-gray mb-1">
                  Email Address
                </label>

                <input
                  type="email"
                  value={profileData.email}
                  disabled
                  className="w-full h-10 px-3.5 bg-bone/70 dark:bg-espresso/70 border border-sand dark:border-outline-variant rounded-lg text-[13px] font-medium text-espresso dark:text-bone opacity-70 cursor-not-allowed"
                />

                <p className="text-[10px] text-warm-gray mt-1">
                  Email is managed by Supabase Authentication.
                </p>

              </div>

              {/* Phone */}
              <div>

                <label className="block text-xs font-semibold text-warm-gray mb-1">
                  Phone Number
                </label>

                <div className="relative">

                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray" />

                  <input
                    type="text"
                    value={profileData.phone}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        phone: e.target.value
                      })
                    }
                    className="w-full h-10 pl-10 pr-3.5 bg-bone dark:bg-espresso border border-sand dark:border-outline-variant rounded-lg text-[13px] font-medium text-espresso dark:text-bone focus:outline-none focus:ring-1 focus:ring-primary"
                  />

                </div>

              </div>

              {/* Date of Birth */}
              <div>

                <label className="block text-xs font-semibold text-warm-gray mb-1">
                  Date of Birth
                </label>

                <input
                  type="date"
                  value={profileData.dob}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      dob: e.target.value
                    })
                  }
                  className="w-full h-10 px-3.5 bg-bone dark:bg-espresso border border-sand dark:border-outline-variant rounded-lg text-[13px] font-medium text-espresso dark:text-bone focus:outline-none focus:ring-1 focus:ring-primary"
                />

                <p className="text-[10px] text-warm-gray mt-1">
                  This field will be connected to Supabase later.
                </p>

              </div>

            </div>

            {/* =================================================
                ADDRESS DETAILS
            ================================================== */}
            <div className="pt-2 border-t border-sand dark:border-outline-variant space-y-4">

              <h3 className="text-xs font-bold text-espresso dark:text-bone uppercase tracking-wider">
                Address Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* Street */}
                <div className="md:col-span-3">

                  <label className="block text-xs font-semibold text-warm-gray mb-1">
                    Street Address
                  </label>

                  <input
                    type="text"
                    value={profileData.street}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        street: e.target.value
                      })
                    }
                    className="w-full h-10 px-3.5 bg-bone dark:bg-espresso border border-sand dark:border-outline-variant rounded-lg text-[13px] font-medium text-espresso dark:text-bone focus:outline-none focus:ring-1 focus:ring-primary"
                  />

                </div>

                {/* City */}
                <div>

                  <label className="block text-xs font-semibold text-warm-gray mb-1">
                    City
                  </label>

                  <input
                    type="text"
                    value={profileData.city}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        city: e.target.value
                      })
                    }
                    className="w-full h-10 px-3.5 bg-bone dark:bg-espresso border border-sand dark:border-outline-variant rounded-lg text-[13px] font-medium text-espresso dark:text-bone focus:outline-none focus:ring-1 focus:ring-primary"
                  />

                </div>

                {/* State */}
                <div>

                  <label className="block text-xs font-semibold text-warm-gray mb-1">
                    State
                  </label>

                  <input
                    type="text"
                    value={profileData.state}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        state: e.target.value
                      })
                    }
                    className="w-full h-10 px-3.5 bg-bone dark:bg-espresso border border-sand dark:border-outline-variant rounded-lg text-[13px] font-medium text-espresso dark:text-bone focus:outline-none focus:ring-1 focus:ring-primary"
                  />

                </div>

                {/* Zip */}
                <div>

                  <label className="block text-xs font-semibold text-warm-gray mb-1">
                    Pincode / Zip
                  </label>

                  <input
                    type="text"
                    value={profileData.zip}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        zip: e.target.value
                      })
                    }
                    className="w-full h-10 px-3.5 bg-bone dark:bg-espresso border border-sand dark:border-outline-variant rounded-lg text-[13px] font-medium text-espresso dark:text-bone focus:outline-none focus:ring-1 focus:ring-primary"
                  />

                </div>

              </div>
            </div>

            {/* Save Button */}
            <div className="pt-3">

              <button
                type="submit"
                disabled={savingProfile}
                className="bg-primary hover:bg-primary-hover text-white px-6 h-10 rounded-lg text-[13px] font-semibold transition-colors shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {savingProfile
                  ? 'Saving...'
                  : t('profile.saveChanges')}
              </button>

            </div>

          </form>
        </div>
      )}

      {/* ======================================================
          TAB 2: SECURITY
      ======================================================= */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">

          {/* Password Management Notice */}
          <div className="bg-cream dark:bg-surface border border-sand dark:border-outline-variant rounded-2xl p-6 shadow-sm space-y-4">
            <div className="border-b border-sand dark:border-outline-variant pb-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary dark:text-rose-400" />
              <h2 className="text-base font-bold text-espresso dark:text-bone">
                {t('profile.changePassword')}
              </h2>
            </div>

            <p className="text-xs text-warm-gray leading-relaxed">
              Administrator password updates are managed centrally under Platform Settings.
            </p>

            <a
              href="#/settings"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 h-9 rounded-lg text-xs font-semibold transition-colors shadow-sm cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Go to Password Settings</span>
            </a>
          </div>

          {/* 2FA & Sessions */}
          <div className="space-y-6">

            {/* 2FA */}
            <div className="bg-cream dark:bg-surface border border-sand dark:border-outline-variant rounded-2xl p-6 shadow-sm space-y-4">

              <div className="flex items-center justify-between border-b border-sand dark:border-outline-variant pb-3">

                <div className="flex items-center gap-2">

                  <Smartphone className="w-4 h-4 text-gold" />

                  <h3 className="text-sm font-bold text-espresso dark:text-bone">
                    {t('profile.twoFactor')}
                  </h3>

                </div>

                <span className="text-[11px] font-bold text-forest dark:text-emerald-400 bg-forest/10 px-2.5 py-0.5 rounded-full">
                  Active
                </span>

              </div>

              <p className="text-xs text-warm-gray leading-relaxed">
                Require an authenticator code (TOTP) during admin login.
              </p>

              <button
                onClick={() => {
                  setSecurityData({
                    ...securityData,
                    twoFactorEnabled:
                      !securityData.twoFactorEnabled
                  });

                  if (triggerToast) {
                    triggerToast(
                      `2FA ${!securityData.twoFactorEnabled
                        ? 'Enabled'
                        : 'Disabled'
                      }`
                    );
                  }
                }}
                className="border border-sand hover:bg-bone dark:hover:bg-espresso text-espresso dark:text-bone px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                {securityData.twoFactorEnabled
                  ? 'Disable 2FA'
                  : 'Enable 2FA'}
              </button>

            </div>

            {/* Active Sessions */}
            <div className="bg-cream dark:bg-surface border border-sand dark:border-outline-variant rounded-2xl p-6 shadow-sm space-y-4">

              <h3 className="text-sm font-bold text-espresso dark:text-bone border-b border-sand dark:border-outline-variant pb-3">
                Active Admin Sessions
              </h3>

              <div className="space-y-3 text-xs">

                <div className="flex items-center justify-between p-3 bg-bone dark:bg-espresso rounded-xl border border-sand dark:border-outline-variant">

                  <div className="flex items-center gap-3">

                    <Laptop className="w-4 h-4 text-primary dark:text-rose-400" />

                    <div>

                      <p className="font-bold text-espresso dark:text-bone">
                        Current Browser Session
                      </p>

                      <p className="text-[10px] text-warm-gray">
                        Authenticated through Supabase
                      </p>

                    </div>

                  </div>

                  <span className="text-[10px] font-semibold text-forest dark:text-emerald-400">
                    Online
                  </span>

                </div>

              </div>

            </div>

          </div>
        </div>
      )}

      {/* ======================================================
          TAB 3: ACCOUNT SETTINGS
      ======================================================= */}
      {activeTab === 'settings' && (
        <div className="bg-cream dark:bg-surface border border-sand dark:border-outline-variant rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in">

          <div className="border-b border-sand dark:border-outline-variant pb-3">

            <h2 className="text-base font-bold text-espresso dark:text-bone">
              {t('profile.accountSettings')}
            </h2>

            <p className="text-xs text-warm-gray">
              System preferences for your administrator workspace
            </p>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">

            {/* Language Selection */}
            <div className="p-4 bg-bone dark:bg-espresso rounded-xl border border-sand dark:border-outline-variant space-y-3">

              <div className="flex items-center gap-2 font-bold text-espresso dark:text-bone">

                <Globe className="w-4 h-4 text-gold" />

                <span>
                  Interface Language
                </span>

              </div>

              <p className="text-warm-gray text-[11px]">
                Select your preferred language for the Admin Portal interface
              </p>

              <div className="flex items-center gap-2">

                <button
                  onClick={() => switchLanguage('en')}
                  className={`px-4 py-2 rounded-lg font-semibold transition cursor-pointer ${locale === 'en'
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-cream dark:bg-surface text-warm-gray border border-sand'
                    }`}
                >
                  English (EN)
                </button>

                <button
                  onClick={() => switchLanguage('hi')}
                  className={`px-4 py-2 rounded-lg font-semibold transition cursor-pointer ${locale === 'hi'
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-cream dark:bg-surface text-warm-gray border border-sand'
                    }`}
                >
                  हिंदी (HI)
                </button>

              </div>

            </div>

            {/* Theme Preference */}
            <div className="p-4 bg-bone dark:bg-espresso rounded-xl border border-sand dark:border-outline-variant space-y-3">

              <div className="flex items-center gap-2 font-bold text-espresso dark:text-bone">

                <Crown className="w-4 h-4 text-primary dark:text-rose-400" />

                <span>
                  Theme Appearance
                </span>

              </div>

              <p className="text-warm-gray text-[11px]">
                Switch between Executive Light and Dark themes
              </p>

              <button
                onClick={toggleDarkMode}
                className="px-4 py-2 rounded-lg font-semibold bg-cream dark:bg-surface text-espresso dark:text-bone border border-sand dark:border-outline-variant hover:bg-ivory transition cursor-pointer"
              >
                Current Mode:{' '}
                <strong>
                  {darkMode ? 'Dark Mode' : 'Light Mode'}
                </strong>{' '}
                (Click to Toggle)
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}