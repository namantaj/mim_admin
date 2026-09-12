import React, { createContext, useContext, useState, useEffect } from 'react';
import enMessages from '../messages/en.json';
import hiMessages from '../messages/hi.json';

const LanguageContext = createContext();

const messages = {
  en: enMessages,
  hi: hiMessages,
};

export function LanguageProvider({ children }) {
  const [locale, setLocale] = useState('en');

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('admin_locale') : null;
    if (saved && (saved === 'en' || saved === 'hi')) {
      setLocale(saved);
    }
  }, []);

  const switchLanguage = (newLocale) => {
    if (newLocale === 'en' || newLocale === 'hi') {
      setLocale(newLocale);
      if (typeof window !== 'undefined') {
        localStorage.setItem('admin_locale', newLocale);
      }
      document.documentElement.lang = newLocale;
    }
  };

  const t = (keyPath, params = {}) => {
    const keys = keyPath.split('.');
    let current = messages[locale] || messages.en;

    for (const key of keys) {
      if (current && current[key] !== undefined) {
        current = current[key];
      } else {
        let fallback = messages.en;
        for (const k of keys) {
          fallback = fallback?.[k];
        }
        current = fallback || keyPath;
        break;
      }
    }

    if (typeof current === 'string') {
      return Object.keys(params).reduce((str, paramKey) => {
        return str.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), params[paramKey]);
      }, current);
    }

    return current || keyPath;
  };

  return (
    <LanguageContext.Provider value={{ locale, switchLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
