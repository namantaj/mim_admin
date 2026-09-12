import React, { useState, useEffect } from 'react';

import { supabase } from './lib/supabase';

import Dashboard from './components/Dashboard';
import Members from './components/Members';
import PaymentApproval from './components/PaymentApproval';
import PaymentSettings from './components/PaymentSettings';
import HelpDesk from './components/HelpDesk';
import AdminProfile from './components/AdminProfile';
import Settings from './components/Settings';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';

import {
  LanguageProvider,
  useLanguage,
} from './context/LanguageContext';

import {
  ThemeProvider,
  useTheme,
} from './context/ThemeContext';

import { AdminProvider } from './context/AdminContext';

function AppContent() {
  const { t } = useLanguage();
  const { darkMode, toggleDarkMode } = useTheme();

  // Initialize route state based on URL hash
  const [activeMenu, setActiveMenu] = useState(() => {
    const hash = window.location.hash.replace('#/', '');
    return hash || 'login';
  });

  const [showNotifications, setShowNotifications] =
    useState(false);

  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success',
  });

  // Helper to update route/hash
  const setRoute = (route) => {
    window.location.hash = `#/${route}`;
  };

  // Listen to hash changes for browser navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '');
      setActiveMenu(hash || 'login');
    };

    window.addEventListener(
      'hashchange',
      handleHashChange
    );

    return () => {
      window.removeEventListener(
        'hashchange',
        handleHashChange
      );
    };
  }, []);

  // Supabase Auth session check on mount
  useEffect(() => {
    supabase.auth.getSession().then(
      ({ data: { session } }) => {
        if (!session) {
          const hash =
            window.location.hash.replace('#/', '');

          if (!hash || hash === 'dashboard') {
            setRoute('login');
          }
        }
      }
    );

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setRoute('login');
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  // Update page title
  useEffect(() => {
    const titles = {
      dashboard:
        'Bhagwn Solutions - Admin Dashboard',

      members:
        'Bhagwn Solutions - Member Management',

      'payment-approval':
        'Bhagwn Solutions - Payment Approval',

      'payment-settings':
        'Bhagwn Solutions - Payment Settings',

      'help-desk':
        'Bhagwn Solutions - Help Desk',

      profile:
        'Bhagwn Solutions - Admin Profile Settings',

      settings:
        'Bhagwn Solutions - Platform Settings',

      login:
        'Bhagwn Solutions - Admin Sign In',
    };

    document.title =
      titles[activeMenu] ||
      'Bhagwn Solutions - Admin Portal';
  }, [activeMenu]);

  // Toast notification
  const triggerToast = (
    message,
    type = 'success'
  ) => {
    setToast({
      show: true,
      message,
      type,
    });

    setTimeout(() => {
      setToast({
        show: false,
        message: '',
        type: 'success',
      });
    }, 3000);
  };

  // Login page
  if (activeMenu === 'login') {
    return (
      <div className="min-h-screen bg-background text-on-background font-body-md antialiased transition-colors duration-200">

        {toast.show && (
          <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl bg-[#FBF9F4] dark:bg-[#2B2722] border border-[#D8D0C1] dark:border-[#423C36] animate-fade-in">

            <span
              className={`material-symbols-outlined text-[18px] ${toast.type === 'success'
                  ? 'text-forest'
                  : 'text-primary'
                }`}
            >
              {toast.type === 'success'
                ? 'check_circle'
                : 'info'}
            </span>

            <span className="text-[13px] font-semibold text-espresso dark:text-bone">
              {toast.message}
            </span>

          </div>
        )}

        <Login
          setRoute={setRoute}
          triggerToast={triggerToast}
        />

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-background font-body-md antialiased flex transition-colors duration-200">

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-5 right-5 z-[999] flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl bg-[#FBF9F4] dark:bg-[#2B2722] border border-[#D8D0C1] dark:border-[#423C36] animate-fade-in">

          <span
            className={`material-symbols-outlined text-[18px] ${toast.type === 'success'
                ? 'text-forest'
                : 'text-primary'
              }`}
          >
            {toast.type === 'success'
              ? 'check_circle'
              : 'info'}
          </span>

          <span className="text-[13px] font-semibold text-espresso dark:text-bone">
            {toast.message}
          </span>

        </div>
      )}

      {/* Sidebar */}
      <Sidebar
        activeMenu={activeMenu}
        setRoute={setRoute}
        triggerToast={triggerToast}
      />

      {/* Main Content */}
      <main className="flex-1 md:ml-sidebar-width min-h-screen flex flex-col">

        {/* Top Bar */}
        <TopBar
          activeMenu={activeMenu}
          setRoute={setRoute}
          showNotifications={showNotifications}
          setShowNotifications={setShowNotifications}
          triggerToast={triggerToast}
        />

        {/* Page Content */}
        <div className="mt-[60px] p-6 md:p-8 max-w-[1440px] mx-auto w-full flex-1 animate-fade-in">

          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="flex text-warm-gray text-[13px] mb-6"
          >
            <ol className="inline-flex items-center gap-1.5">

              {/* Dashboard breadcrumb */}
              <li className="inline-flex items-center">

                <a
                  className="hover:text-primary transition-colors cursor-pointer"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setRoute('dashboard');
                  }}
                >
                  {t('nav.dashboard')}
                </a>

              </li>

              {/* Current page */}
              {activeMenu !== 'dashboard' && (
                <li>
                  <div className="flex items-center gap-1.5">

                    <span className="material-symbols-outlined text-[14px]">
                      chevron_right
                    </span>

                    <span className="text-espresso dark:text-bone font-semibold">

                      {activeMenu === 'members' &&
                        t('nav.members')}

                      {activeMenu === 'payment-approval' &&
                        (t('nav.paymentApproval') ||
                          'Payment Approval')}

                      {activeMenu === 'payment-settings' &&
                        'Payment Settings'}

                      {activeMenu === 'help-desk' &&
                        'Help Desk'}

                      {activeMenu === 'profile' &&
                        t('nav.profileSettings')}

                      {activeMenu === 'settings' &&
                        t('nav.settings')}

                    </span>

                  </div>
                </li>
              )}

            </ol>
          </nav>

          {/* Dashboard */}
          {activeMenu === 'dashboard' && (
            <Dashboard
              setRoute={setRoute}
              triggerToast={triggerToast}
            />
          )}

          {/* Members */}
          {activeMenu === 'members' && (
            <Members
              triggerToast={triggerToast}
            />
          )}

          {/* Payment Approval */}
          {activeMenu === 'payment-approval' && (
            <PaymentApproval
              triggerToast={triggerToast}
            />
          )}

          {/* Payment Settings */}
          {activeMenu === 'payment-settings' && (
            <PaymentSettings
              triggerToast={triggerToast}
            />
          )}

          {/* Help Desk */}
          {activeMenu === 'help-desk' && (
            <HelpDesk
              triggerToast={triggerToast}
            />
          )}

          {/* Admin Profile */}
          {activeMenu === 'profile' && (
            <AdminProfile
              triggerToast={triggerToast}
            />
          )}

          {/* Settings */}
          {activeMenu === 'settings' && (
            <Settings
              triggerToast={triggerToast}
            />
          )}

        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AdminProvider>
          <AppContent />
        </AdminProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}