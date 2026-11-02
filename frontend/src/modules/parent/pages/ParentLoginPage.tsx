import React, { useState, type FormEvent } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../../core/auth/AuthContext';

export const ParentLoginPage: React.FC = () => {
  const { login, mustChangePassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState('john.connor');
  const [password, setPassword] = useState('Child123!');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lockoutSeconds, setLockoutSeconds] = useState<number | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!identifier || !password || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const isEmail = identifier.includes('@');
    const result = await login({
      username: isEmail ? undefined : identifier.trim(),
      email: isEmail ? identifier.trim() : undefined,
      password,
    });

    if (result.success) {
      if (mustChangePassword) {
        navigate('/parent/change-password', { replace: true });
        return;
      }

      // Check if first-run onboarding has been completed
      const onboardingDone = localStorage.getItem('parent_onboarding_done');
      if (!onboardingDone) {
        navigate('/parent/welcome', { replace: true });
        return;
      }

      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/parent';
      navigate(from, { replace: true });
    } else {
      setIsSubmitting(false);
      if (result.error?.retryAfterSeconds) {
        setLockoutSeconds(result.error.retryAfterSeconds);
      }
      setErrorMessage(result.error?.message || 'Incorrect username/email or password.');
    }
  };

  const setDemoCredentials = (user: string, pass: string) => {
    setIdentifier(user);
    setPassword(pass);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen w-full bg-[#0d1117] flex items-center justify-center p-4 sm:p-6 text-slate-100 relative overflow-hidden select-none">
      {/* Smooth Ambient Background Motion Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 sm:w-[520px] sm:h-[520px] rounded-full bg-amber-500/15 blur-[130px] animate-ambient-drift-a" />
        <div className="absolute top-1/3 -left-24 w-80 h-80 sm:w-[480px] sm:h-[480px] rounded-full bg-blue-600/20 blur-[130px] animate-ambient-drift-b" />
        <div className="absolute -bottom-32 right-1/4 w-88 h-88 sm:w-[500px] sm:h-[500px] rounded-full bg-purple-500/15 blur-[140px] animate-ambient-drift-c" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md relative z-10 rounded-3xl bg-slate-900/80 backdrop-blur-2xl border border-slate-800/80 shadow-2xl p-6 sm:p-8 transition-all duration-300">
        {/* Brand Header */}
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-800/60">
          <div>
            <div className="text-[10px] font-mono tracking-widest uppercase text-amber-400 font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              DAYCARE FAMILY PORTAL
            </div>
            <div className="text-xl font-bold tracking-tight text-white mt-0.5">
              Child & Parent Access
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-mono font-bold text-amber-400">
            PORTAL
          </span>
        </div>

        {/* Demo Credential Quick Fill Chips */}
        <div className="mb-5 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/60">
          <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>QUICK-FILL TEST ACCOUNTS</span>
            <span className="text-amber-400 text-[9px]">1-CLICK</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setDemoCredentials('john.connor', 'Child123!')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium border transition-all cursor-pointer ${
                identifier === 'john.connor'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-xs'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700/60'
              }`}
            >
              👦 John Connor
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('tommy.doe', 'Child123!')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium border transition-all cursor-pointer ${
                identifier === 'tommy.doe'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-xs'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700/60'
              }`}
            >
              👦 Tommy Doe
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('damian.wayne', 'Child123!')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium border transition-all cursor-pointer ${
                identifier === 'damian.wayne'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-xs'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700/60'
              }`}
            >
              👦 Damian Wayne
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('sarah.connor@example.com', 'parent123')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium border transition-all cursor-pointer ${
                identifier === 'sarah.connor@example.com'
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-xs'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-700/60'
              }`}
            >
              👩 Guardian Sarah
            </button>
          </div>
        </div>

        {/* Lockout Notice */}
        {lockoutSeconds && lockoutSeconds > 0 && (
          <div className="mb-5 p-3.5 rounded-2xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs">
            <div className="flex items-center justify-between font-bold">
              <span className="tracking-wide uppercase text-[10px] font-mono text-amber-400">LOCKOUT ACTIVE</span>
              <span className="font-mono text-xs text-amber-300">{lockoutSeconds}s</span>
            </div>
            <div className="mt-1 text-[11px] text-amber-300/80 leading-snug">
              Too many attempts. Wait before trying again.
            </div>
          </div>
        )}

        {/* Error Notice */}
        {errorMessage && (!lockoutSeconds || lockoutSeconds <= 0) && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-rose-200 text-xs">
            <div className="font-mono uppercase text-[10px] text-rose-400 font-bold tracking-wider mb-0.5">
              NOTICE
            </div>
            <div className="text-xs text-rose-200">{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="parent-identifier"
                className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider"
              >
                CHILD USERNAME OR EMAIL
              </label>
              <span className="text-[10px] font-mono text-amber-400/80">e.g. john.connor</span>
            </div>
            <input
              id="parent-identifier"
              type="text"
              required
              autoFocus
              autoComplete="username"
              disabled={Boolean(lockoutSeconds && lockoutSeconds > 0)}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. john.connor or name@example.com"
              className="w-full h-11 px-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-sm font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all disabled:opacity-50"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="parent-password"
                className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider"
              >
                PASSWORD
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={Boolean(lockoutSeconds && lockoutSeconds > 0)}
                className="text-[10px] font-mono font-bold text-amber-400 hover:text-amber-300 transition-colors uppercase tracking-wider cursor-pointer"
              >
                {showPassword ? 'HIDE' : 'SHOW'}
              </button>
            </div>
            <input
              id="parent-password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              disabled={Boolean(lockoutSeconds && lockoutSeconds > 0)}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full h-11 px-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-sm font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !identifier || !password || Boolean(lockoutSeconds && lockoutSeconds > 0)}
            className="w-full h-11 mt-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 text-xs font-bold tracking-wider uppercase transition-all duration-150 shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                <span>SIGNING IN...</span>
              </>
            ) : (
              <span>SIGN IN TO FAMILY PORTAL</span>
            )}
          </button>

          <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <Link
              to="/login"
              className="hover:text-amber-400 transition-colors uppercase tracking-wider text-[10px] flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">badge</span>
              <span>STAFF / ADMIN LOGIN</span>
            </Link>
            <span className="text-slate-600">•</span>
            <span className="text-slate-500 text-[10px]">
              CHILD SCOPED
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};
