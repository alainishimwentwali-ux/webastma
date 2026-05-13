import { useEffect, useRef, useState } from 'react';
import { Routes, Route, Link, Navigate, NavLink, useNavigate, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import PatientPage from './pages/PatientPage';
import SymptomRecordPage from './pages/SymptomRecordPage';
import AnalyticsPage from './pages/AnalyticsPage';
import EnvironmentPage from './pages/EnvironmentPage';
import DoctorPage from './pages/DoctorPage';
import DoctorDashboard from './pages/DoctorDashboard';
import SettingsPage from './pages/SettingsPage';
import AdminDashboard from './pages/AdminDashboard';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import CallPage from './pages/CallPage';
import DoctorPatientPage from './pages/DoctorPatientPage';
import DoctorSettingsPage from './pages/DoctorSettingsPage';
import { setAuthToken } from './api';
import api from './api';

function RequireAuth({ authenticated, children }: { authenticated: boolean; children: JSX.Element }) {
  const hasToken = authenticated || !!localStorage.getItem('token');
  return hasToken ? children : <Navigate to="/login" replace />;
}

function DashboardLayout({ children, onLogout }: { children: JSX.Element; onLogout: () => void }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[260px_1fr]">
      <aside className="rounded-3xl border border-slate-800 bg-slate-900/95 p-6 shadow-lg shadow-slate-950/20">
        <div className="space-y-6">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Dashboard</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Navigation</h2>
          </div>
          <nav className="space-y-3 text-slate-300">
            <Link className="block rounded-2xl px-4 py-3 hover:bg-slate-800" to="/">Dashboard</Link>
            <Link className="block rounded-2xl px-4 py-3 hover:bg-slate-800" to="/patient">Patient</Link>
            <Link className="block rounded-2xl px-4 py-3 hover:bg-slate-800" to="/symptoms">Symptoms</Link>
            <Link className="block rounded-2xl px-4 py-3 hover:bg-slate-800" to="/analytics">Analytics</Link>
            <Link className="block rounded-2xl px-4 py-3 hover:bg-slate-800" to="/environment">Environment</Link>
            <Link className="block rounded-2xl px-4 py-3 hover:bg-slate-800" to="/consultation">Consultation</Link>
            <Link className="block rounded-2xl px-4 py-3 hover:bg-slate-800" to="/settings">Settings</Link>
            <button onClick={onLogout} className="w-full rounded-2xl px-4 py-3 text-left text-slate-300 hover:bg-slate-800">
              Logout
            </button>
          </nav>
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Tips</p>
            <p className="mt-3 text-sm text-slate-400">Use the sidebar to move between patient, symptom, analytics, and consultation pages.</p>
          </div>
        </div>
      </aside>
      <div>{children}</div>
    </div>
  );
}

function AsthmaShieldLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="shieldGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#0e7490" />
        </linearGradient>
        <linearGradient id="pulseGrad" x1="0" y1="0" x2="24" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
          <stop offset="50%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.6" />
        </linearGradient>
      </defs>
      <path d="M20 3L5 9v10c0 9 6.5 16.5 15 18.5C29.5 35.5 36 28 36 19V9L20 3z" fill="url(#shieldGrad)" />
      <path d="M20 3L5 9v10c0 9 6.5 16.5 15 18.5C29.5 35.5 36 28 36 19V9L20 3z" fill="none" stroke="#67e8f9" strokeWidth="0.8" strokeOpacity="0.5" />
      <polyline points="8,20 12,20 14,14 17,26 20,18 22,22 25,20 32,20" fill="none" stroke="url(#pulseGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const features = [
  {
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
      </svg>
    ),
    title: 'Weather Risk Alerts',
    desc: 'Real-time AQI, humidity, temperature and pollen data for Kigali, Huye, Musanze and Rubavu.',
  },
  {
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
      </svg>
    ),
    title: 'Symptom Tracking',
    desc: 'Log daily symptoms, triggers and medication. Share records directly with your doctor.',
  },
  {
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
    title: 'Video Consultations',
    desc: 'Connect with certified doctors via secure video calls — no travel required.',
  },
  {
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    title: 'Analytics Dashboard',
    desc: 'Visualise trends in your asthma episodes, risk scores and environmental correlations.',
  },
];

const cities = [
  { name: 'Kigali', risk: 'Moderate', color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20', dot: 'bg-amber-400' },
  { name: 'Huye', risk: 'Low', color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20', dot: 'bg-emerald-400' },
  { name: 'Musanze', risk: 'Low', color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20', dot: 'bg-emerald-400' },
  { name: 'Rubavu', risk: 'High', color: 'text-rose-400', bg: 'bg-rose-400/10 border-rose-400/20', dot: 'bg-rose-400' },
];

const stats = [
  { value: '4', label: 'Cities Monitored' },
  { value: '24/7', label: 'Live Weather Data' },
  { value: '100%', label: 'Secure & Private' },
  { value: 'Free', label: 'For Patients' },
];

function LandingPage() {
  return (
    <div className="-mx-4 -mt-10">
      {/* Hero */}
      <section className="relative overflow-hidden px-6 py-24 text-center">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-cyan-500/5 blur-3xl" />
          <div className="absolute left-1/4 top-20 h-64 w-64 rounded-full bg-cyan-600/10 blur-2xl" />
          <div className="absolute right-1/4 top-32 h-48 w-48 rounded-full bg-teal-500/10 blur-2xl" />
        </div>

        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6">
          <div className="flex items-center gap-3 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-5 py-2">
            <AsthmaShieldLogo size={28} />
            <span className="text-sm font-semibold tracking-widest text-cyan-300 uppercase">Asthma Shield</span>
          </div>

          <h1 className="text-5xl font-bold leading-tight text-white sm:text-6xl">
            Breathe Easier,{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
              Live Better
            </span>
          </h1>

          <p className="max-w-xl text-lg text-slate-400">
            Rwanda's first weather-powered asthma management platform. Monitor air quality, track symptoms, and consult doctors — all in one place.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/signup"
              className="rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 px-8 py-3 font-semibold text-slate-950 shadow-lg shadow-cyan-500/25 transition hover:from-cyan-400 hover:to-teal-400"
            >
              Get Started Free
            </Link>
            <Link
              to="/login"
              className="rounded-full border border-slate-700 bg-slate-800/60 px-8 py-3 font-semibold text-slate-200 transition hover:border-cyan-500/50 hover:bg-slate-800"
            >
              Sign In
            </Link>
          </div>

          <p className="text-xs text-slate-500">No credit card required &nbsp;·&nbsp; Free for patients &nbsp;·&nbsp; Rwanda-focused</p>
        </div>
      </section>

      {/* Stats bar */}
      <section id="features" className="border-y border-slate-800 bg-slate-900/60 px-6 py-8">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-bold text-cyan-400">{s.value}</p>
              <p className="mt-1 text-sm text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Live city risk preview */}
      <section id="cities" className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-cyan-400">Live Risk Overview</p>
          <h2 className="mt-3 text-center text-3xl font-bold text-white">Rwanda Cities at a Glance</h2>
          <p className="mt-3 text-center text-slate-400">Current asthma risk levels based on weather and air quality data.</p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cities.map((c) => (
              <div key={c.name} className={`rounded-2xl border p-5 ${c.bg}`}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">{c.name}</span>
                  <span className={`flex items-center gap-1.5 text-xs font-semibold ${c.color}`}>
                    <span className={`h-2 w-2 rounded-full ${c.dot} animate-pulse`} />
                    {c.risk}
                  </span>
                </div>
                <p className="mt-3 text-xs text-slate-400">Tap to view full weather breakdown</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-slate-900/40 px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-cyan-400">Features</p>
          <h2 className="mt-3 text-center text-3xl font-bold text-white">Everything You Need</h2>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {features.map((f) => (
              <div key={f.title} className="group rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-cyan-500/40 hover:bg-slate-800/60">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 transition group-hover:bg-cyan-500/20">
                  {f.icon}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400">How It Works</p>
          <h2 className="mt-3 text-3xl font-bold text-white">Three Simple Steps</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {[
              { step: '01', title: 'Create Account', desc: 'Sign up as a patient or doctor in under a minute.' },
              { step: '02', title: 'Monitor Your City', desc: 'Get live asthma risk scores for your Rwanda location.' },
              { step: '03', title: 'Consult a Doctor', desc: 'Book a video call with a certified doctor instantly.' },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full border border-cyan-500/40 bg-cyan-500/10 text-lg font-bold text-cyan-400">
                  {item.step}
                </span>
                <h3 className="font-semibold text-white">{item.title}</h3>
                <p className="text-sm text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-2xl rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/60 to-slate-900 p-10 text-center shadow-xl shadow-cyan-950/30">
          <AsthmaShieldLogo size={48} />
          <h2 className="mt-5 text-3xl font-bold text-white">Start Protecting Your Lungs Today</h2>
          <p className="mt-3 text-slate-400">Join patients and doctors across Rwanda using Asthma Shield.</p>
          <Link
            to="/signup"
            className="mt-8 inline-block rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 px-10 py-3 font-semibold text-slate-950 shadow-lg shadow-cyan-500/25 transition hover:from-cyan-400 hover:to-teal-400"
          >
            Create Free Account
          </Link>
        </div>
      </section>
    </div>
  );
}

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [userName, setUserName] = useState('');
  const [role, setRole] = useState<'doctor' | 'patient' | ''>('');
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState<{ id: number | string; title: string; message: string; createdAt: string; type?: string; requestId?: string; roomId?: string }[]>([]);
  const [patientCallRequests, setPatientCallRequests] = useState<{ id: string; status: string; reason: string; doctorName: string; roomId?: string }[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileImage, setProfileImage] = useState(() => localStorage.getItem('profileImage') || '');
  const notifRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedName = localStorage.getItem('fullName');
    const storedRole = localStorage.getItem('role') as 'doctor' | 'patient' | null;

    if (token && storedName && storedRole) {
      setAuthToken(token);
      setAuthenticated(true);
      setUserName(storedName);
      setRole(storedRole);
    }

    const onProfileUpdated = (e: Event) => {
      const img = (e as CustomEvent).detail?.profileImage || '';
      setProfileImage(img);
    };
    window.addEventListener('profileImageUpdated', onProfileUpdated);
    return () => window.removeEventListener('profileImageUpdated', onProfileUpdated);
  }, []);

  // Close notification dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Poll notifications
  useEffect(() => {
    if (!authenticated) return;
    const fetchNotifs = async () => {
      const currentRole = role || localStorage.getItem('role');
      if (!localStorage.getItem('token')) return;
      try {
        if (currentRole === 'doctor') {
          const { data } = await api.get('/doctor/notifications');
          const notifs = data.notifications ?? [];
          setNotifications(notifs);
          setNotificationCount(notifs.length);
        } else {
          const { data } = await api.get('/calls/patient-status');
          const requests = data.requests ?? [];
          setPatientCallRequests(requests);
          const accepted = requests.filter((r: any) => r.status === 'accepted' && r.roomId);
          setNotificationCount(accepted.length);
          setNotifications(accepted.map((r: any) => ({
            id: r.id,
            title: '📹 Doctor Accepted Your Call',
            message: `Dr. ${r.doctorName} accepted your call. Click to join now.`,
            createdAt: new Date().toISOString(),
            type: 'call-accepted',
            roomId: r.roomId,
          })));
        }
      } catch {}
    };
    fetchNotifs();
    const t = setInterval(fetchNotifs, 8000);
    return () => clearInterval(t);
  }, [authenticated, role]);

  const handleLogin = (data: { token: string; fullName: string; role: 'doctor' | 'patient' }) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('fullName', data.fullName);
    localStorage.setItem('role', data.role);
    setAuthToken(data.token);
    setAuthenticated(true);
    setUserName(data.fullName);
    setRole(data.role);
    navigate(data.role === 'doctor' ? '/doctor-dashboard' : '/', { replace: true });
  };

  const handleLogout = () => {
    setAuthenticated(false);
    setUserName('');
    setRole('');
    setNotificationCount(0);
    setAuthToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('fullName');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const location = useLocation();
  const isLanding = !authenticated && location.pathname === '/';
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);



  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-3 py-2 text-sm transition ${
      isActive ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`;

  const dashboardLinks = [
    { label: 'Dashboard', to: '/' },
    { label: 'Patient', to: '/patient' },
    { label: 'Symptoms', to: '/symptoms' },
    { label: 'Analytics', to: '/analytics' },
    { label: 'Environment', to: '/environment' },
    { label: 'Consultation', to: '/consultation' },
    ...(role === 'doctor' ? [{ label: '🩺 Doctor Dashboard', to: '/doctor-dashboard' }] : []),
    { label: 'Settings', to: '/settings' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          {/* Logo */}
          <Link to="/" className="flex shrink-0 items-center gap-3">
            <AsthmaShieldLogo size={36} />
            <div>
              <p className="text-lg font-bold leading-none text-white">Asthma Shield</p>
              <p className="mt-0.5 text-[11px] leading-none text-cyan-400/70">Rwanda Health Platform</p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 lg:flex">
            {!authenticated ? (
              <>
                <a href="#features" className="rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white">Features</a>
                <a href="#cities" className="rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white">Cities</a>
                <a href="#how" className="rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white">How It Works</a>
                <div className="mx-2 h-5 w-px bg-slate-700" />
                <Link className="rounded-lg px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white" to="/login">Sign In</Link>
                <Link className="rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 px-5 py-2 text-sm font-semibold text-slate-950 shadow shadow-cyan-500/20 transition hover:from-cyan-400 hover:to-teal-400" to="/signup">Get Started</Link>
              </>
            ) : (
              <>
                {/* Notifications */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setNotifOpen(o => !o)}
                    className="relative rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 transition hover:bg-slate-700"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {notificationCount > 0 && (
                      <span className="absolute -right-1.5 -top-1.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                        {notificationCount}
                      </span>
                    )}
                  </button>
                  {notifOpen && (
                    <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-slate-700 bg-slate-900 shadow-xl shadow-slate-950/50 z-50">
                      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                        <span className="font-semibold text-white text-sm">Notifications</span>
                        <button onClick={() => { setNotificationCount(0); setNotifOpen(false); }} className="text-xs text-slate-400 hover:text-white">Mark all read</button>
                      </div>
                      <div className="max-h-72 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <p className="px-4 py-6 text-center text-sm text-slate-500">No notifications yet</p>
                        ) : (
                          notifications.map(n => (
                            <div key={n.id} className="border-b border-slate-800 px-4 py-3 hover:bg-slate-800">
                              <p className="text-sm font-medium text-white">{n.title}</p>
                              <p className="mt-0.5 text-xs text-slate-400">{n.message}</p>
                              {(n.type === 'call' || n.type === 'call-accepted') && n.roomId && (
                                <button
                                  onClick={() => { navigate(`/call/${n.roomId}`); setNotifOpen(false); }}
                                  className="mt-2 rounded-full bg-cyan-500 px-3 py-1 text-xs font-semibold text-slate-950 hover:bg-cyan-400"
                                >
                                  Join Call →
                                </button>
                              )}
                              {n.type === 'call' && !n.roomId && (
                                <button
                                  onClick={() => { navigate('/doctor-patients'); setNotifOpen(false); }}
                                  className="mt-2 rounded-full border border-cyan-500/40 px-3 py-1 text-xs text-cyan-400 hover:bg-slate-700"
                                >
                                  View Request →
                                </button>
                              )}
                              <p className="mt-1 text-[10px] text-slate-600">{new Date(n.createdAt).toLocaleTimeString()}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {/* User menu */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen((o) => !o)}
                    className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 transition hover:bg-slate-700"
                  >
                    {profileImage ? (
                      <img src={profileImage} alt="avatar" className="h-6 w-6 rounded-full object-cover" />
                    ) : (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-bold text-cyan-400">
                        {userName.charAt(0).toUpperCase() || 'U'}
                      </span>
                    )}
                    <span className="max-w-[100px] truncate">{userName || 'User'}</span>
                    <svg className={`h-3.5 w-3.5 text-slate-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-44 rounded-xl border border-slate-700 bg-slate-900 py-1 shadow-xl shadow-slate-950/50">
                      <Link to="/settings" className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        Settings
                      </Link>
                      <Link to="/admin" className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        Admin
                      </Link>
                      <div className="my-1 border-t border-slate-800" />
                      <button onClick={handleLogout} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-rose-400 hover:bg-slate-800">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </nav>

          {/* Mobile hamburger */}
          <button
            className="flex items-center justify-center rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-300 transition hover:bg-slate-700 lg:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
            )}
          </button>
        </div>

        {/* Mobile menu panel */}
        {mobileOpen && (
          <div className="border-t border-slate-800 bg-slate-900/95 px-6 py-4 lg:hidden">
            <div className="flex flex-col gap-1">
              {!authenticated ? (
                <>
                  <a href="#features" className="rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white">Features</a>
                  <a href="#cities" className="rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white">Cities</a>
                  <a href="#how" className="rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white">How It Works</a>
                  <div className="my-2 border-t border-slate-800" />
                  <Link to="/login" className="rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white">Sign In</Link>
                  <Link to="/signup" className="mt-1 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-2.5 text-center text-sm font-semibold text-slate-950">Get Started</Link>
                </>
              ) : (
                <>
                  <div className="my-2 border-t border-slate-800" />
                  <Link to="/settings" className="rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white">Settings</Link>
                  <Link to="/admin" className="rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white">Admin</Link>
                  <button onClick={handleLogout} className="mt-1 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-rose-400 hover:bg-slate-800">Logout</button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10">
        <Routes>
          <Route
            path="/"
            element={authenticated ? (
              <RequireAuth authenticated={authenticated}>
                <DashboardLayout onLogout={handleLogout}>
                  <HomePage userName={userName} onNotificationCountChange={setNotificationCount} />
                </DashboardLayout>
              </RequireAuth>
            ) : (
              <LandingPage />
            )}
          />
          <Route
            path="/patient"
            element={
              <RequireAuth authenticated={authenticated}>
                {role === 'doctor' ? <Navigate to="/doctor-dashboard" replace /> : (
                  <DashboardLayout onLogout={handleLogout}>
                    <PatientPage userName={userName} />
                  </DashboardLayout>
                )}
              </RequireAuth>
            }
          />
          <Route
            path="/symptoms"
            element={
              <RequireAuth authenticated={authenticated}>
                {role === 'doctor' ? <Navigate to="/doctor-symptoms" replace /> : (
                  <DashboardLayout onLogout={handleLogout}>
                    <SymptomRecordPage />
                  </DashboardLayout>
                )}
              </RequireAuth>
            }
          />
          <Route
            path="/analytics"
            element={
              <RequireAuth authenticated={authenticated}>
                {role === 'doctor' ? <Navigate to="/doctor-analytics" replace /> : (
                  <DashboardLayout onLogout={handleLogout}>
                    <AnalyticsPage />
                  </DashboardLayout>
                )}
              </RequireAuth>
            }
          />
          <Route
            path="/environment"
            element={
              <RequireAuth authenticated={authenticated}>
                {role === 'doctor' ? <Navigate to="/doctor-environment" replace /> : (
                  <DashboardLayout onLogout={handleLogout}>
                    <EnvironmentPage />
                  </DashboardLayout>
                )}
              </RequireAuth>
            }
          />
          <Route
            path="/consultation"
            element={
              <RequireAuth authenticated={authenticated}>
                {role === 'doctor' ? <Navigate to="/doctor-patients" replace /> : (
                  <DashboardLayout onLogout={handleLogout}>
                    <DoctorPage />
                  </DashboardLayout>
                )}
              </RequireAuth>
            }
          />
          <Route
            path="/settings"
            element={
              <RequireAuth authenticated={authenticated}>
                {role === 'doctor' ? <Navigate to="/doctor-settings" replace /> : (
                  <DashboardLayout onLogout={handleLogout}>
                    <SettingsPage />
                  </DashboardLayout>
                )}
              </RequireAuth>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireAuth authenticated={authenticated}>
                <DashboardLayout onLogout={handleLogout}>
                  <AdminDashboard />
                </DashboardLayout>
              </RequireAuth>
            }
          />
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="/signup" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="/call/:roomId" element={<CallPage />} />
          <Route
            path="/doctor-dashboard"
            element={
              <RequireAuth authenticated={authenticated}>
                {role === 'doctor' ? (
                  <DoctorDashboard onLogout={handleLogout} userName={userName} />
                ) : (
                  <Navigate to="/" replace />
                )}
              </RequireAuth>
            }
          />
          <Route
            path="/doctor-patients"
            element={
              <RequireAuth authenticated={authenticated}>
                {role === 'doctor' ? <DoctorPatientPage /> : <Navigate to="/" replace />}
              </RequireAuth>
            }
          />
          <Route
            path="/doctor-symptoms"
            element={
              <RequireAuth authenticated={authenticated}>
                {role === 'doctor' ? <DoctorDashboard onLogout={handleLogout} userName={userName} /> : <Navigate to="/" replace />}
              </RequireAuth>
            }
          />
          <Route
            path="/doctor-analytics"
            element={
              <RequireAuth authenticated={authenticated}>
                {role === 'doctor' ? <DoctorDashboard onLogout={handleLogout} userName={userName} /> : <Navigate to="/" replace />}
              </RequireAuth>
            }
          />
          <Route
            path="/doctor-environment"
            element={
              <RequireAuth authenticated={authenticated}>
                {role === 'doctor' ? <DoctorDashboard onLogout={handleLogout} userName={userName} /> : <Navigate to="/" replace />}
              </RequireAuth>
            }
          />
          <Route
            path="/doctor-settings"
            element={
              <RequireAuth authenticated={authenticated}>
                {role === 'doctor' ? <DoctorSettingsPage /> : <Navigate to="/" replace />}
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="border-t border-slate-800 bg-slate-900/90 px-6 py-10 text-slate-400">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-3">
              <AsthmaShieldLogo size={28} />
              <div>
                <p className="text-sm font-semibold text-white">Asthma Shield</p>
                <p className="text-xs text-slate-500">Rwanda Health Platform</p>
              </div>
            </div>
            <div className="flex gap-6 text-sm">
              <Link to="/login" className="hover:text-cyan-400 transition">Sign In</Link>
              <Link to="/signup" className="hover:text-cyan-400 transition">Sign Up</Link>
            </div>
          </div>
          <div className="mt-6 border-t border-slate-800 pt-6 text-center text-xs text-slate-600">
            &copy; 2026 Asthma Shield. Built for Rwanda. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
