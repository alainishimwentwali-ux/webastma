import { FormEvent, useState } from 'react';
import api from '../api';

interface LoginPageProps {
  onLogin: (data: { token: string; fullName: string; role: 'doctor' | 'patient' }) => void;
}

function AsthmaShieldLogo() {
  return (
    <svg width={44} height={44} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lgLogin" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#0e7490" />
        </linearGradient>
        <linearGradient id="lgPulse" x1="0" y1="0" x2="24" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.5" />
          <stop offset="50%" stopColor="#fff" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0.5" />
        </linearGradient>
      </defs>
      <path d="M20 3L5 9v10c0 9 6.5 16.5 15 18.5C29.5 35.5 36 28 36 19V9L20 3z" fill="url(#lgLogin)" />
      <path d="M20 3L5 9v10c0 9 6.5 16.5 15 18.5C29.5 35.5 36 28 36 19V9L20 3z" fill="none" stroke="#67e8f9" strokeWidth="0.8" strokeOpacity="0.5" />
      <polyline points="8,20 12,20 14,14 17,26 20,18 22,22 25,20 32,20" fill="none" stroke="url(#lgPulse)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LoginPage({ onLogin }: LoginPageProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [animKey, setAnimKey] = useState(0);
  const [slideDir, setSlideDir] = useState<'right' | 'left'>('right');

  // login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // signup fields
  const [name, setName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [role, setRole] = useState<'patient' | 'doctor'>('patient');
  const [signupError, setSignupError] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);

  const switchTo = (next: 'login' | 'signup') => {
    setSlideDir(next === 'signup' ? 'right' : 'left');
    setAnimKey((k) => k + 1);
    setMode(next);
    setLoginError('');
    setSignupError('');
  };

  const submitLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) { setLoginError('Please enter both email and password.'); return; }
    setLoginLoading(true);
    setLoginError('');
    try {
      const { data } = await api.post('/auth/login', { email: loginEmail, password: loginPassword });
      onLogin({ token: data.token, fullName: data.fullName, role: data.role });
    } catch (err: any) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.error;
      setLoginError(status === 401 ? (msg || 'Invalid email or password.') : (msg || 'Login failed. Please try again.'));
    } finally {
      setLoginLoading(false);
    }
  };

  const submitSignup = async (e: FormEvent) => {
    e.preventDefault();
    if (!name || !signupEmail || !signupPassword) { setSignupError('Please fill in all fields.'); return; }
    setSignupLoading(true);
    setSignupError('');
    try {
      const { data } = await api.post('/auth/register', { fullName: name, email: signupEmail, password: signupPassword, role });
      onLogin({ token: data.token, fullName: name, role: data.role });
    } catch (err: any) {
      setSignupError(err?.response?.data?.error || 'Signup failed. Please try again.');
    } finally {
      setSignupLoading(false);
    }
  };

  const animClass = mode === 'login' && animKey === 0
    ? 'animate-zoom-in'
    : slideDir === 'right' ? 'animate-slide-in-right' : 'animate-slide-in-left';

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md overflow-hidden">
        {/* Card */}
        <div
          key={animKey}
          className={`${animClass} rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl shadow-slate-950/50`}
        >
          {/* Logo + title */}
          <div className="mb-8 flex flex-col items-center gap-3 text-center">
            <AsthmaShieldLogo />
            <div>
              <h2 className="text-2xl font-bold text-white">
                {mode === 'login' ? 'Welcome back' : 'Create account'}
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                {mode === 'login'
                  ? 'Sign in to your Asthma Shield account'
                  : 'Join Asthma Shield — free for patients'}
              </p>
            </div>
          </div>

          {/* Tab switcher */}
          <div className="mb-8 flex rounded-xl border border-slate-800 bg-slate-950 p-1">
            <button
              type="button"
              onClick={() => switchTo('login')}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
                mode === 'login'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchTo('signup')}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
                mode === 'signup'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Login form */}
          {mode === 'login' && (
            <form onSubmit={submitLogin} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm text-slate-300">Email</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full bg-slate-950 px-4 py-3 text-slate-100"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-slate-300">Password</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-slate-950 px-4 py-3 text-slate-100"
                  placeholder="Enter your password"
                />
              </div>
              {loginError && <p className="text-sm text-rose-400">{loginError}</p>}
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 py-3 font-semibold text-slate-950 shadow shadow-cyan-500/20 transition hover:from-cyan-400 hover:to-teal-400 disabled:opacity-60"
              >
                {loginLoading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
          )}

          {/* Signup form */}
          {mode === 'signup' && (
            <form onSubmit={submitSignup} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm text-slate-300">Full name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 px-4 py-3 text-slate-100"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-slate-300">Email</label>
                <input
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  className="w-full bg-slate-950 px-4 py-3 text-slate-100"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-slate-300">Password</label>
                <input
                  type="password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  className="w-full bg-slate-950 px-4 py-3 text-slate-100"
                  placeholder="Choose a password"
                />
              </div>
              <div>
                <p className="mb-2 text-sm text-slate-300">I am a</p>
                <div className="flex gap-3">
                  {(['patient', 'doctor'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`flex-1 rounded-xl border py-2.5 text-sm font-semibold capitalize transition ${
                        role === r
                          ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                          : 'border-slate-700 text-slate-400 hover:border-slate-600 hover:text-white'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              {signupError && <p className="text-sm text-rose-400">{signupError}</p>}
              <button
                type="submit"
                disabled={signupLoading}
                className="w-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 py-3 font-semibold text-slate-950 shadow shadow-cyan-500/20 transition hover:from-cyan-400 hover:to-teal-400 disabled:opacity-60"
              >
                {signupLoading ? 'Creating account…' : 'Create Account'}
              </button>
            </form>
          )}

          {/* Footer switch */}
          <p className="mt-6 text-center text-sm text-slate-500">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => switchTo(mode === 'login' ? 'signup' : 'login')}
              className="font-semibold text-cyan-400 hover:text-cyan-300"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
