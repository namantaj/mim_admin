'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Mail, ArrowRight, CheckCircle2, KeyRound, Globe } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function LoginPage() {
  const router = useRouter();
  const { locale, switchLanguage, t } = useLanguage();
  const [email, setEmail] = useState('admin@bhagwnsolutions.com');
  const [password, setPassword] = useState('admin123');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push('/');
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#F4F0E6] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Top Right Language Selector */}
      <div className="absolute top-6 right-8 z-20 flex items-center bg-white border border-[#D8D0C1] p-1 rounded-full shadow-2xs">
        <Globe className="w-3.5 h-3.5 text-[#7A1F2B] ml-2 mr-1" />
        <button
          onClick={() => switchLanguage('en')}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
            locale === 'en'
              ? 'bg-[#7A1F2B] text-white shadow-2xs'
              : 'text-[#756F66] hover:text-[#211E1A]'
          }`}
        >
          English
        </button>
        <button
          onClick={() => switchLanguage('hi')}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
            locale === 'hi'
              ? 'bg-[#7A1F2B] text-white shadow-2xs'
              : 'text-[#756F66] hover:text-[#211E1A]'
          }`}
        >
          हिंदी
        </button>
      </div>

      {/* Background Decorative Accents */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#7A1F2B]/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#B8953D]/15 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white border border-[#D8D0C1] rounded-3xl p-8 shadow-2xl space-y-7 relative z-10 animate-in fade-in zoom-in-95">
        {/* Brand Logo Header */}
        <div className="text-center space-y-3">
          <img 
            src="/logo.png" 
            alt="Bhagwn Solutions" 
            className="w-[185px] h-auto object-contain mx-auto drop-shadow-xs" 
          />
          <div>
            <span className="text-xs font-black uppercase tracking-[0.15em] text-[#7A1F2B] bg-[#7A1F2B]/10 px-3 py-1 rounded-full border border-[#7A1F2B]/20 inline-block">
              {t('login.title')}
            </span>
          </div>
          <p className="text-xs text-[#756F66] font-medium">
            {t('login.subtitle')}
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#756F66] mb-1.5">
              {t('login.emailLabel')}
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#756F66]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs font-bold bg-[#F4F0E6]/60 border border-[#D8D0C1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1F2B] focus:bg-white text-[#211E1A] shadow-inner transition"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#756F66] mb-1.5">
              {t('login.passwordLabel')}
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#756F66]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs font-bold bg-[#F4F0E6]/60 border border-[#D8D0C1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1F2B] focus:bg-white text-[#211E1A] shadow-inner transition"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 text-[#756F66] font-semibold cursor-pointer">
              <input type="checkbox" defaultChecked className="w-3.5 h-3.5 accent-[#7A1F2B] rounded" />
              <span>Keep session active</span>
            </label>
            <a href="#" onClick={(e) => { e.preventDefault(); alert('Please contact Super Admin to reset your credentials.'); }} className="text-[#7A1F2B] font-bold hover:underline">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-gradient-to-r from-[#7A1F2B] to-[#621822] hover:from-[#621822] hover:to-[#4D121B] text-white font-extrabold text-xs rounded-full shadow-xl shadow-[#7A1F2B]/30 flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 disabled:opacity-70 mt-2"
          >
            {isLoading ? (
              <span>Authenticating Admin...</span>
            ) : (
              <>
                <span>{t('login.signInBtn')}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Pre-filled Demo Credentials Notice */}
        <div className="p-3 bg-[#F4F0E6]/80 rounded-2xl border border-[#D8D0C1]/60 text-center space-y-1">
          <p className="text-[11px] font-bold text-[#211E1A] flex items-center justify-center gap-1">
            <KeyRound className="w-3.5 h-3.5 text-[#B8953D]" />
            {t('login.demoCredentials')}
          </p>
          <div className="text-[10px] text-[#756F66] font-medium space-y-0.5">
            <p><strong>Admin Email ID:</strong> <code className="bg-white px-1.5 py-0.5 rounded border border-[#D8D0C1] text-[#7A1F2B] font-bold">admin@bhagwnsolutions.com</code></p>
            <p><strong>Password:</strong> <code className="bg-white px-1.5 py-0.5 rounded border border-[#D8D0C1] text-[#7A1F2B] font-bold">admin123</code></p>
          </div>
        </div>
      </div>
    </div>
  );
}
