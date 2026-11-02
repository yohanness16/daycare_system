import React, { useState, useEffect, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../core/auth/AuthContext';
import { useLanguage } from '../../../core/i18n/LanguageContext';


export const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(0);

  // Live Lockout Countdown Timer
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setErrorMessage(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;
    setErrorMessage(null);

    const isEmail = email.includes('@');
    const result = await login({
      email: isEmail ? email.trim() : undefined,
      username: email.trim(),
      password,
    });

    if (result.success) {
      const stored = localStorage.getItem('daycare_user');
      let mustChange = false;
      let role = 'Admin';
      if (stored) {
        try {
          const u = JSON.parse(stored);
          mustChange = Boolean(u.mustChangePassword);
          role = u.role || 'Admin';
        } catch {
          // ignore
        }
      }

      if (mustChange) {
        navigate('/change-password', { replace: true });
        return;
      }

      const from = (location.state as { from?: { pathname?: string } })?.from?.pathname;
      if (from && from !== '/' && from !== '/dashboard' && from !== '/login' && from !== '/parent/login') {
        navigate(from, { replace: true });
        return;
      }

      // One unified login for all roles: Parents -> /parent, Admins -> /dashboard, Staff -> /today
      const r = role.toLowerCase();
      if (r === 'parent' || r === 'guardian') {
        const onboardingDone = localStorage.getItem('parent_onboarding_done');
        if (!onboardingDone) {
          navigate('/parent/welcome', { replace: true });
        } else {
          navigate('/parent', { replace: true });
        }
      } else if (r === 'admin' || r === 'administrator') {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/today', { replace: true });
      }
    } else {
      const err = result.error;
      if (err?.code === 'ACCOUNT_LOCKED') {
        const secs = err.retryAfterSeconds || 300;
        setLockoutSeconds(secs);
        setErrorMessage(
          err.message || (language === 'am' ? 'መለያዎ ለጊዜው ታግዷል። እባክዎ ጥቂት ይጠብቁ።' : 'Account temporarily locked. Please wait.')
        );
      } else if (err?.code === 'ACCOUNT_DISABLED') {
        setErrorMessage(
          err.message || (language === 'am' ? 'መለያዎ ተዘግቷል። እባክዎ ዋና አስተዳዳሪን ያነጋግሩ።' : 'Account deactivated. Please contact your center administrator.')
        );
      } else {
        setErrorMessage(
          err?.message || (language === 'am' ? 'የተሳሳተ ኢሜይል ወይም የይለፍ ቃል አስገብተዋል።' : 'Incorrect email or password.')
        );
      }
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#FAF8F5] dark:bg-[#0B0F19] flex flex-col justify-center items-center p-4 sm:p-6 text-slate-900 dark:text-slate-100 relative overflow-hidden select-none transition-colors duration-200">
      {/* Ambient Background Glow Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 sm:w-[500px] sm:h-[500px] rounded-full bg-primary-500/10 dark:bg-primary-500/15 blur-[100px] animate-ambient-drift-a" />
        <div className="absolute top-1/2 -right-24 w-80 h-80 sm:w-[460px] sm:h-[460px] rounded-full bg-amber-500/10 dark:bg-amber-500/10 blur-[110px] animate-ambient-drift-b" />
        <div className="absolute -bottom-32 left-1/3 w-88 h-88 sm:w-[480px] sm:h-[480px] rounded-full bg-emerald-500/10 dark:bg-emerald-500/10 blur-[120px] animate-ambient-drift-c" />
      </div>

      {/* Top Utility Controls: Theme & Language Switchers */}
      <div className="absolute top-4 sm:top-6 right-4 sm:right-6 z-20 flex items-center gap-2">
        {/* Dark/Light Mode Toggle */}
        

        {/* Language Switcher Pill */}
        <div className="flex items-center rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-1 shadow-xs border border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`px-2.5 py-1 rounded-lg transition-all text-xs font-bold cursor-pointer ${
              language === 'en'
                ? 'bg-primary-600 text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setLanguage('am')}
            className={`px-2.5 py-1 rounded-lg transition-all text-xs font-bold cursor-pointer ${
              language === 'am'
                ? 'bg-primary-600 text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            አማ
          </button>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md relative z-10 rounded-3xl bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/60 dark:shadow-black/40 border border-[#E3DCCE] dark:border-slate-800 p-7 sm:p-9 transition-all duration-300">
        {/* Brand & Greeting */}
        <div className="mb-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary-600 to-amber-500 flex items-center justify-center text-white mx-auto shadow-md shadow-primary-600/20 mb-3">
            <span className="material-symbols-outlined text-[30px]">child_care</span>
          </div>

          

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {t('signIn', 'Sign In')}
          </h1>
          
        </div>

        {/* Lockout Notification Banner */}
        {lockoutSeconds > 0 && (
          <div className="mb-5 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs shadow-xs">
            <div className="flex items-center justify-between font-bold">
              <span className="uppercase tracking-wider text-[11px] text-amber-700 dark:text-amber-400">
                {language === 'am' ? 'መለያው ተቆልፏል' : 'Account Locked'}
              </span>
              <span className="font-mono text-xs text-amber-800 dark:text-amber-300 font-bold">
                {Math.floor(lockoutSeconds / 60)}m {String(lockoutSeconds % 60).padStart(2, '0')}s
              </span>
            </div>
            <div className="mt-1 text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
              {language === 'am'
                ? 'በርካታ ያልተሳኩ ሙከራዎች ተደርገዋል። እባክዎ ሰዓቱ እስኪያበቃ ድረስ ይጠብቁ።'
                : 'Multiple failed login attempts detected. Please wait for the timer to expire.'}
            </div>
          </div>
        )}

        {/* Error Notification Banner */}
        {errorMessage && lockoutSeconds === 0 && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs shadow-xs">
            <div className="font-bold text-rose-900 dark:text-rose-300 mb-0.5">
              {language === 'am' ? 'ማስታወሻ' : 'Notice'}
            </div>
            <div>{errorMessage}</div>
          </div>
        )}

        {/* Unified Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              {language === 'am' ? 'ኢሜይል ወይም የተጠቃሚ ስም' : 'Email or Username'}
            </label>
            <div className="relative">
              <input
                id="email"
                type="text"
                required
                autoFocus
                autoComplete="username"
                disabled={lockoutSeconds > 0}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={language === 'am' ? 'ለምሳሌ፡ parent@daycare.local ወይም admin' : 'e.g. parent@daycare.local or admin'}
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all disabled:opacity-50"
              />
              <span className="material-symbols-outlined text-[18px] text-slate-400 dark:text-slate-500 absolute left-3 top-3 pointer-events-none">
                person
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                {language === 'am' ? 'የይለፍ ቃል' : 'Password'}
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={lockoutSeconds > 0}
                className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 transition-colors cursor-pointer"
              >
                {showPassword
                  ? (language === 'am' ? 'ደብቅ' : 'Hide')
                  : (language === 'am' ? 'አሳይ' : 'Show')}
              </button>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                disabled={lockoutSeconds > 0}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all disabled:opacity-50"
              />
              <span className="material-symbols-outlined text-[18px] text-slate-400 dark:text-slate-500 absolute left-3 top-3 pointer-events-none">
                lock
              </span>
            </div>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={isLoading || lockoutSeconds > 0}
            className="w-full h-11 mt-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 active:scale-[0.99] text-white text-sm font-bold tracking-wide transition-all shadow-md shadow-primary-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{language === 'am' ? 'በመግባት ላይ...' : 'Signing in...'}</span>
              </>
            ) : lockoutSeconds > 0 ? (
              <span>{language === 'am' ? `ተቆልፏል (${lockoutSeconds}ሰ)` : `Locked (${lockoutSeconds}s)`}</span>
            ) : (
              <>
                <span>{t('signIn', 'Sign In')}</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </>
            )}
          </button>

          
        </form>
      </div>
    </div>
  );
};
