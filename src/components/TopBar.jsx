import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  ChevronDown, 
  LogOut, 
  User, 
  Settings, 
  Globe,
  Sun,
  Moon
} from 'lucide-react';
import { initialAdminProfile } from '../data/mockData';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAdmin } from '../context/AdminContext';
import { supabase } from '../lib/supabase';

export default function TopBar({ setRoute, showNotifications, setShowNotifications, triggerToast }) {
  const { locale, switchLanguage, t } = useLanguage();
  const { darkMode, toggleDarkMode } = useTheme();
  const { adminName, adminProfile } = useAdmin();

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);

  const notificationsList = [
    { id: 1, text: "Aarav Sharma requested withdrawal of ₹25,000", time: "12m ago", unread: true },
    { id: 2, text: "New member registration: Priya Verma sponsored by Vikram", time: "45m ago", unread: true },
    { id: 3, text: "System daily commission batch auto-reconciled", time: "2h ago", unread: false }
  ];

  const handleLogOut = async () => {
    setShowUserDropdown(false);
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Logout error:', e);
    }
    setRoute('login');
    if (triggerToast) triggerToast("Logged out successfully");
  };

  return (
    <header className="flex justify-between items-center px-8 z-40 fixed top-0 right-0 md:left-sidebar-width h-[60px] bg-cream/80 dark:bg-[#2B2722]/80 backdrop-blur-md border-b border-sand dark:border-outline-variant transition-colors duration-200">
      
      {/* Search Input */}
      <div className="flex-1 flex items-center">
        <div className="relative w-56 lg:w-72">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray text-[20px]">search</span>
          <input 
            className="w-full pl-10 pr-4 h-9 bg-bone dark:bg-[#211E1A] border border-sand dark:border-outline-variant rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary/30 placeholder:text-warm-gray/60 text-espresso dark:text-bone transition-colors" 
            placeholder={t('common.searchPlaceholder')} 
            type="text"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && triggerToast) {
                triggerToast(`Searching for "${e.target.value}"`);
              }
            }}
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4 relative">
        
        {/* Notifications trigger */}
        <div className="relative">
          <button 
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserDropdown(false);
            }}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-warm-gray hover:text-espresso dark:hover:text-bone hover:bg-ivory dark:hover:bg-[#36312B] transition-all cursor-pointer relative"
            title="Notifications"
          >
            <Bell className="w-5 h-5 text-primary dark:text-rose-400" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full ring-2 ring-cream dark:ring-surface"></span>
            )}
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-cream dark:bg-surface border border-sand dark:border-outline-variant rounded-xl shadow-xl py-1 z-50 animate-fade-in">
              <div className="px-4 py-3 border-b border-sand dark:border-outline-variant flex items-center justify-between font-semibold text-[13px] text-espresso dark:text-bone">
                <span>{t('common.notifications')}</span>
                {unreadCount > 0 && (
                  <button
                    onClick={() => setUnreadCount(0)}
                    className="text-[11px] font-semibold text-primary dark:text-rose-400 hover:underline cursor-pointer"
                  >
                    Clear badge
                  </button>
                )}
              </div>
              <ul className="divide-y divide-sand/50 dark:divide-outline-variant/50">
                {notificationsList.map(notif => (
                  <li key={notif.id} className="px-4 py-3 hover:bg-bone dark:hover:bg-[#211E1A] cursor-pointer transition-colors" onClick={() => triggerToast && triggerToast(`Clicked: ${notif.text}`)}>
                    <p className={`text-[13px] text-espresso dark:text-bone ${notif.unread ? 'font-semibold' : ''}`}>{notif.text}</p>
                    <span className="text-[11px] text-warm-gray mt-1 block">{notif.time}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Dark Mode toggle */}
        <button 
          onClick={() => {
            toggleDarkMode();
            if (triggerToast) triggerToast(darkMode ? 'Light Mode Enabled' : 'Dark Mode Enabled', 'info');
          }}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-warm-gray hover:text-espresso dark:hover:text-bone hover:bg-ivory dark:hover:bg-[#36312B] transition-all cursor-pointer"
          title="Toggle Theme"
        >
          {darkMode ? (
            <Sun className="w-5 h-5 text-gold" />
          ) : (
            <Moon className="w-5 h-5 text-warm-gray" />
          )}
        </button>

        {/* Language Switcher Button ("EN | हिंदी") */}
        <div className="relative">
          <button 
            onClick={() => {
              const targetLang = locale === 'en' ? 'hi' : 'en';
              switchLanguage(targetLang);
              if (triggerToast) triggerToast(`Language switched to ${targetLang === 'en' ? 'English' : 'हिंदी'}`);
            }}
            className="h-8 px-3 rounded-lg bg-bone dark:bg-[#211E1A] border border-sand dark:border-outline-variant hover:bg-ivory dark:hover:bg-[#36312B] text-[12px] font-semibold text-espresso dark:text-bone transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Switch Language / भाषा बदलें"
          >
            <Globe className="w-4 h-4 text-gold" />
            <span>{locale === 'en' ? 'EN | हिंदी' : 'हिंदी | EN'}</span>
          </button>
        </div>

        {/* Separator */}
        <div className="w-px h-7 bg-sand dark:bg-outline-variant"></div>

        {/* User Avatar & Admin Name */}
        <div className="relative">
          <div 
            onClick={() => {
              setShowUserDropdown(!showUserDropdown);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2.5 cursor-pointer group pl-1"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary via-[#641722] to-[#4A1019] text-cream font-extrabold text-xs flex items-center justify-center ring-2 ring-gold/40 shadow-xs group-hover:ring-gold transition-all select-none overflow-hidden">
              {adminProfile?.avatar && !adminProfile.avatar.includes('unsplash') ? (
                <img 
                  alt="Admin Avatar" 
                  className="w-full h-full object-cover" 
                  src={adminProfile.avatar}
                />
              ) : (
                <span>{adminName ? adminName.charAt(0).toUpperCase() : 'A'}</span>
              )}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-[13px] font-semibold text-espresso dark:text-bone leading-tight">
                {adminName}
              </p>
              <p className="text-[11px] text-warm-gray leading-tight">
                {t('profile.administrator')}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-warm-gray hidden lg:block" />
          </div>

          {/* User Profile Dropdown Menu */}
          {showUserDropdown && (
            <div className="absolute right-0 mt-3 w-56 bg-cream dark:bg-surface border border-sand dark:border-outline-variant rounded-xl shadow-xl p-2 z-50 animate-fade-in space-y-1">
              <div className="px-3 py-2 border-b border-sand/50 dark:border-outline-variant/50">
                <p className="text-xs font-extrabold text-espresso dark:text-bone">{adminName}</p>
                <p className="text-[10px] text-warm-gray">{adminProfile?.email || initialAdminProfile.email}</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setRoute('profile');
                  setShowUserDropdown(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-espresso dark:text-bone hover:bg-ivory dark:hover:bg-[#211E1A] transition text-left cursor-pointer"
              >
                <User className="w-4 h-4 text-primary dark:text-rose-400" />
                <span>{t('nav.profileSettings')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRoute('settings');
                  setShowUserDropdown(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-espresso dark:text-bone hover:bg-ivory dark:hover:bg-[#211E1A] transition text-left cursor-pointer"
              >
                <Settings className="w-4 h-4 text-primary dark:text-rose-400" />
                <span>{t('nav.settings')}</span>
              </button>

              <div className="pt-1 border-t border-sand/50 dark:border-outline-variant/50">
                <button
                  onClick={handleLogOut}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer text-left"
                >
                  <LogOut className="w-4 h-4" />
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
