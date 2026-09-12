import React, { useState } from 'react';

import {
  LayoutDashboard,
  Users,
  CreditCard,
  MessageSquare,
  User,
  Settings,
  LogOut,
  X,
  AlertTriangle,
  QrCode,
} from 'lucide-react';

import { useLanguage } from '../context/LanguageContext';

export default function Sidebar({
  activeMenu,
  setRoute,
  triggerToast,
}) {
  const { t } = useLanguage();

  const [showConfirmModal, setShowConfirmModal] =
    useState(false);

  const navItems = [
    {
      id: 'dashboard',
      name: t('nav.dashboard'),
      icon: LayoutDashboard,
    },

    {
      id: 'members',
      name: t('nav.members'),
      icon: Users,
    },

    {
      id: 'payment-approval',
      name:
        t('nav.paymentApproval') ||
        'Payment Approval',
      icon: CreditCard,
    },

    {
      id: 'payment-settings',
      name: 'Payment Settings',
      icon: QrCode,
    },

    {
      id: 'help-desk',
      name: 'Help Desk',
      icon: MessageSquare,
    },

    {
      id: 'profile',
      name: t('nav.profileSettings'),
      icon: User,
    },

    {
      id: 'settings',
      name: t('nav.settings'),
      icon: Settings,
    },
  ];

  const handleConfirmSignOut = () => {
    setShowConfirmModal(false);

    setRoute('login');

    if (triggerToast) {
      triggerToast(
        'Logged out successfully'
      );
    }
  };

  return (
    <>
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-[280px] bg-bone dark:bg-espresso border-r border-sand dark:border-outline-variant z-50 transition-colors duration-200">

        {/* Logo Branding Area */}
        <div className="flex flex-col items-center pt-8 pb-5 px-6">

          <button
            type="button"
            onClick={() =>
              setRoute('dashboard')
            }
            className="cursor-pointer border-none bg-transparent"
          >
            <img
              src="/logo.png"
              alt="Bhagwn Solutions"
              className="w-[170px] h-auto object-contain hover:opacity-95 transition-opacity"
            />
          </button>

          {/* Gold decorative divider */}
          <div className="flex items-center gap-3 mt-5 w-full">

            <div className="flex-1 h-px bg-gold/30"></div>

            <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-gold select-none">
              {t('common.adminPortal')}
            </span>

            <div className="flex-1 h-px bg-gold/30"></div>

          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 mt-2 overflow-y-auto hide-scrollbar">

          <ul className="space-y-1">

            {navItems.map((item) => {
              const Icon = item.icon;

              const isActive =
                activeMenu === item.id;

              return (
                <li key={item.id}>

                  <button
                    type="button"
                    onClick={() =>
                      setRoute(item.id)
                    }
                    className={`w-full flex items-center justify-between px-4 py-[10px] rounded-lg text-[14px] transition-all duration-200 cursor-pointer ${isActive
                        ? 'bg-primary text-on-primary font-semibold shadow-sm'
                        : 'text-warm-gray dark:text-[#9B9487] hover:text-espresso dark:hover:text-bone hover:bg-ivory/60 dark:hover:bg-[#2B2722] font-medium'
                      }`}
                  >

                    <div className="flex items-center gap-3">

                      <Icon
                        className={`w-5 h-5 ${isActive
                            ? 'text-on-primary'
                            : 'text-current'
                          }`}
                      />

                      <span>
                        {item.name}
                      </span>

                    </div>

                  </button>

                </li>
              );
            })}

          </ul>

        </nav>

        {/* Bottom Actions */}
        <div className="px-5 pb-6 pt-4 space-y-2 border-t border-sand dark:border-outline-variant mt-auto">

          <button
            onClick={() =>
              setShowConfirmModal(true)
            }
            className="w-full border border-primary/30 text-primary dark:text-rose-400 h-10 rounded-lg text-[13px] font-semibold hover:bg-primary/10 transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />

            <span>
              {t('common.signOut')}
            </span>

          </button>

        </div>

      </aside>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">

          <div className="bg-cream dark:bg-surface border border-sand dark:border-outline-variant rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-5 relative animate-fade-in">

            <button
              onClick={() =>
                setShowConfirmModal(false)
              }
              className="absolute top-4 right-4 p-1.5 rounded-full text-warm-gray hover:bg-ivory transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3.5">

              <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center ring-4 ring-primary/5">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div>

                <h3 className="font-extrabold text-base text-espresso dark:text-bone">
                  {t('common.logOut')}
                </h3>

                <p className="text-xs text-warm-gray">
                  End current administrator session
                </p>

              </div>

            </div>

            <p className="text-xs text-warm-gray leading-relaxed bg-bone dark:bg-espresso p-3 rounded-xl border border-sand dark:border-outline-variant">

              Are you sure you want to log out of{' '}

              <strong className="text-espresso dark:text-bone">
                Bhagwn Solutions Admin Portal
              </strong>

              ?

            </p>

            <div className="flex items-center gap-3 pt-1">

              <button
                onClick={() =>
                  setShowConfirmModal(false)
                }
                className="flex-1 py-2.5 px-4 border border-sand text-espresso dark:text-bone font-bold text-xs rounded-lg hover:bg-ivory transition cursor-pointer"
              >
                {t('common.cancel')}
              </button>

              <button
                onClick={handleConfirmSignOut}
                className="flex-1 py-2.5 px-4 bg-primary hover:bg-primary-hover text-white font-bold text-xs rounded-lg shadow-sm transition cursor-pointer"
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