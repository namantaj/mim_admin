import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, Globe, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';

export default function Login({ setRoute, triggerToast }) {
  const { locale, switchLanguage, t } = useLanguage();

  const demoEmail = 'admin@bhagwnsolutions.com';
  const demoPassword = 'admin@123';

  const [email, setEmail] = useState(demoEmail);
  const [password, setPassword] = useState(demoPassword);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(demoEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
    if (triggerToast) triggerToast('Admin email copied!');
  };

  const handleCopyPass = () => {
    navigator.clipboard.writeText(demoPassword);
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 2000);
    if (triggerToast) triggerToast('Admin password copied!');
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    setIsLoading(true);
    setError('');

    try {
      // 1. Authenticate with Supabase
      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (loginError) {
        throw loginError;
      }

      // 2. Make sure we actually received a user
      if (!data.user) {
        throw new Error('Unable to authenticate user.');
      }

      // 3. Get the user's profile from public.profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        throw new Error(
          'Your account is authenticated, but your profile could not be found.'
        );
      }

      // 4. Check the user's role
      if (profile.role !== 'admin') {
        await supabase.auth.signOut();
        throw new Error('You do not have permission to access the Admin Portal.');
      }

      // 5. Check whether profile setup is complete
      if (!profile.profile_completed) {
        await supabase.auth.signOut();
        throw new Error(
          'Please complete your profile before accessing the Admin Portal.'
        );
      }

      // 6. Successful login
      if (triggerToast) {
        triggerToast('Welcome back, Admin!');
      }

      setRoute('dashboard');

    } catch (err) {
      console.error('Login error:', err);

      setError(
        err.message || 'Unable to sign in. Please check your credentials.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bone dark:bg-espresso text-espresso dark:text-bone flex flex-col items-center justify-center p-4 relative overflow-hidden transition-colors">

      {/* Language Selector */}
      <div className="absolute top-6 right-8 z-20 flex items-center bg-cream dark:bg-surface border border-sand dark:border-outline-variant p-1 rounded-lg shadow-sm">
        <Globe className="w-4 h-4 text-gold ml-2 mr-1" />

        <button
          type="button"
          onClick={() => switchLanguage('en')}
          className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${locale === 'en'
            ? 'bg-primary text-white shadow-sm'
            : 'text-warm-gray hover:text-espresso dark:hover:text-bone'
            }`}
        >
          English
        </button>

        <button
          type="button"
          onClick={() => switchLanguage('hi')}
          className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${locale === 'hi'
            ? 'bg-primary text-white shadow-sm'
            : 'text-warm-gray hover:text-espresso dark:hover:text-bone'
            }`}
        >
          हिंदी
        </button>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-cream dark:bg-surface border border-sand dark:border-outline-variant rounded-2xl p-8 shadow-xl space-y-6 relative z-10 animate-fade-in">

        {/* Logo */}
        <div className="text-center space-y-3">
          <img
            src="/logo.png"
            alt="Bhagwn Solutions"
            className="w-[170px] h-auto object-contain mx-auto"
          />

          <div className="flex items-center gap-3 w-full my-2">
            <div className="flex-1 h-px bg-gold/30"></div>

            <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-gold select-none">
              {t('common.adminPortal')}
            </span>

            <div className="flex-1 h-px bg-gold/30"></div>
          </div>

          <p className="text-xs text-warm-gray">
            {t('login.subtitle')}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-950/30 px-4 py-3">
            <p className="text-xs font-semibold text-red-700 dark:text-red-400">
              {error}
            </p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">

          {/* Email */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-warm-gray">
                {t('login.emailLabel')}
              </label>
              <button
                type="button"
                onClick={handleCopyEmail}
                className="text-[11px] font-semibold text-gold hover:text-primary dark:hover:text-gold transition-colors flex items-center gap-1 cursor-pointer"
              >
                {copiedEmail ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>admin@bhagwnsolutions.com</span>
              </button>
            </div>

            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray" />

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 h-10 text-xs font-semibold bg-bone dark:bg-espresso border border-sand dark:border-outline-variant rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-espresso dark:text-bone transition font-mono"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-warm-gray">
                {t('login.passwordLabel')}
              </label>
              <button
                type="button"
                onClick={handleCopyPass}
                className="text-[11px] font-semibold text-gold hover:text-primary dark:hover:text-gold transition-colors flex items-center gap-1 cursor-pointer"
              >
                {copiedPass ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>admin@123</span>
              </button>
            </div>

            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray" />

              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 h-10 text-xs font-semibold bg-bone dark:bg-espresso border border-sand dark:border-outline-variant rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-espresso dark:text-bone transition font-mono"
                required
                disabled={isLoading}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-gray hover:text-espresso dark:hover:text-bone transition cursor-pointer p-0.5"
                title={showPassword ? "Hide Password" : "Show Password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Keep Session & Forgot Password */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 text-warm-gray font-medium cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                className="w-3.5 h-3.5 accent-primary rounded"
              />
              <span>Keep session active</span>
            </label>

            <button
              type="button"
              onClick={() =>
                alert('Please contact Super Admin to reset credentials.')
              }
              className="text-primary dark:text-rose-400 font-semibold hover:underline"
            >
              Forgot password?
            </button>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-10 bg-primary hover:bg-primary-hover text-white font-semibold text-xs rounded-lg shadow-sm flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 disabled:opacity-70 mt-2"
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

        {/* Elegant Credentials Notice Pill Matching UI */}
        <div className="pt-2">
          <div className="p-3 bg-bone/70 dark:bg-espresso/60 border border-sand/80 dark:border-outline-variant/60 rounded-xl flex items-center justify-between text-xs font-medium">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              <span className="text-warm-gray text-[11px]">Admin Credentials:</span>
            </div>
            <div className="font-mono text-[11px] text-espresso dark:text-bone flex items-center gap-1.5">
              <span>admin@bhagwnsolutions.com</span>
              <span className="text-warm-gray">•</span>
              <span className="font-bold text-primary dark:text-rose-400">admin@123</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}