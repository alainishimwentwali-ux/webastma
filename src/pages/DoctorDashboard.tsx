import { useEffect, useState } from 'react';
import { useNavigate, Link, NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Bell, Calendar, Activity, Wind,
  Pill, FileText, MessageSquare, Settings, LogOut, Video,
  BarChart2, Leaf,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import api from '../api';

// ── Mock data ────────────────────────────────────────────────────────────────
const ALERTS = [
  { id: 1, name: 'Amara Diallo', severity: 'Critical', trigger: 'High pollen exposure', time: '5 min ago' },
  { id: 2, name: 'Jean Bosco', severity: 'Moderate', trigger: 'Missed inhaler dose', time: '22 min ago' },
  { id: 3, name: 'Claudine Uwera', severity: 'Critical', trigger: 'Peak flow dropped 40%', time: '1 hr ago' },
  { id: 4, name: 'Eric Nshimiyimana', severity: 'Moderate', trigger: 'Cold air exposure', time: '2 hr ago' },
  { id: 5, name: 'Solange Mukamana', severity: 'Moderate', trigger: 'Exercise-induced symptoms', time: '3 hr ago' },
];

const APPOINTMENTS = [
  { id: 1, name: 'Amara Diallo', time: '09:00 AM', type: 'Follow-up', initials: 'AD' },
  { id: 2, name: 'Jean Bosco', time: '11:30 AM', type: 'New patient', initials: 'JB' },
  { id: 3, name: 'Claudine Uwera', time: '02:00 PM', type: 'Review', initials: 'CU' },
];

const PEAK_FLOW = [
  { day: 'Mon', value: 72 }, { day: 'Tue', value: 68 }, { day: 'Wed', value: 75 },
  { day: 'Thu', value: 80 }, { day: 'Fri', value: 77 }, { day: 'Sat', value: 82 },
  { day: 'Sun', value: 78 },
];

const NAV = [
  {
    section: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'patients', label: 'My Patients', icon: Users, badge: '42' },
      { id: 'alerts', label: 'Alerts', icon: Bell, badge: '5', badgeColor: 'bg-red-100 text-red-700' },
      { id: 'appointments', label: 'Appointments', icon: Calendar, badge: '3', badgeColor: 'bg-amber-100 text-amber-700' },
    ],
  },
  {
    section: 'Monitoring',
    items: [
      { id: 'symptoms', label: 'Symptom Tracker', icon: Activity },
      { id: 'peakflow', label: 'Peak Flow Data', icon: Wind },
      { id: 'triggers', label: 'Trigger Exposure', icon: Wind },
      { id: 'meds', label: 'Medication Logs', icon: Pill },
    ],
  },
  {
    section: 'Tools',
    items: [
      { id: 'reports', label: 'Reports', icon: FileText },
      { id: 'messages', label: 'Messages', icon: MessageSquare, badge: '2' },
      { id: 'settings', label: 'Settings', icon: Settings },
    ],
  },
];

// ── Types ────────────────────────────────────────────────────────────────────
interface CallRequest { id: string; patientId: string; reason: string; status: string; createdAt: string; }
interface Notification { id: number; title: string; message: string; createdAt: string; }
interface Props { onLogout: () => void; userName: string; }

// ── Component ────────────────────────────────────────────────────────────────
export default function DoctorDashboard({ onLogout, userName }: Props) {
  const [activeNav, setActiveNav] = useState('dashboard');
  const [pendingRequests, setPendingRequests] = useState<CallRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [statusText, setStatusText] = useState('');
  const navigate = useNavigate();

  const fetchPending = async () => {
    try { const { data } = await api.get('/calls/pending'); setPendingRequests(data || []); }
    catch { setStatusText('Unable to load pending requests.'); }
  };

  const fetchNotifs = async () => {
    try {
      const { data } = await api.get('/doctor/notifications');
      setNotifications(data.notifications ?? []);
    } catch {}
  };

  useEffect(() => {
    fetchPending(); fetchNotifs();
    const t = setInterval(() => { fetchPending(); fetchNotifs(); }, 15000);
    return () => clearInterval(t);
  }, []);

  const acceptRequest = async (requestId: string) => {
    try { const { data } = await api.post('/calls/accept', { requestId }); navigate(`/call/${data.roomId}`); }
    catch { setStatusText('Unable to accept the call.'); }
  };

  const declineRequest = async (requestId: string) => {
    try { await api.post('/calls/decline', { requestId }); fetchPending(); }
    catch { setStatusText('Unable to decline the call.'); }
  };

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const navLinkCls = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
      isActive ? 'bg-teal-50 font-medium text-teal-700' : 'text-gray-600 hover:bg-gray-50'
    }`;

  const Sidebar = () => (
    <aside className="flex h-full w-60 flex-col border-r border-gray-100 bg-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white">
          <Wind size={18} />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">Asthma Shield</p>
          <p className="text-xs text-teal-600">Doctor Portal</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-0.5">
        <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Doctor</p>
        <NavLink to="/doctor-dashboard" end className={navLinkCls}><LayoutDashboard size={16} /><span>Dashboard</span></NavLink>
        <NavLink to="/doctor-patients" className={navLinkCls}><Users size={16} /><span>My Patients</span></NavLink>
        <NavLink to="/doctor-symptoms" className={navLinkCls}><Activity size={16} /><span>Symptom Reports</span></NavLink>
        <NavLink to="/doctor-analytics" className={navLinkCls}><BarChart2 size={16} /><span>Analytics</span></NavLink>
        <NavLink to="/doctor-environment" className={navLinkCls}><Leaf size={16} /><span>Environment</span></NavLink>

        {/* Video Call Requests */}
        <button
          onClick={() => setActiveNav('videocalls')}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
            activeNav === 'videocalls' ? 'bg-teal-50 font-medium text-teal-700' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Video size={16} />
          <span className="flex-1 text-left">Video Calls</span>
          {pendingRequests.length > 0 && (
            <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">
              {pendingRequests.length}
            </span>
          )}
        </button>

        <p className="mt-4 mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Other</p>
        <NavLink to="/doctor-settings" className={navLinkCls}><Settings size={16} /><span>Settings</span></NavLink>
      </nav>

      {/* Doctor profile */}
      <div className="border-t border-gray-100 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white">
            {userName ? userName.charAt(0).toUpperCase() : 'DR'}
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">{userName || 'Doctor'}</p>
            <p className="text-xs text-gray-400">Pulmonologist</p>
          </div>
          <button onClick={onLogout} className="ml-auto text-gray-400 hover:text-red-500" title="Logout">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans">
      <div className="flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-lg font-bold text-gray-900">Dashboard</h1>
              <p className="text-xs text-gray-400">{today}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/consultation" className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50">
              Consultation
            </Link>
            <button className="relative text-gray-500 hover:text-teal-600">
              <Bell size={20} />
              {notifications.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                  {notifications.length}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: 'Total Patients', value: '42', accent: 'text-teal-600', bg: 'bg-teal-50' },
              { label: 'Critical Alerts', value: pendingRequests.length || '5', accent: 'text-red-600', bg: 'bg-red-50' },
              { label: "Today's Appointments", value: '3', accent: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Avg Peak Flow', value: '78%', accent: 'text-teal-600', bg: 'bg-teal-50' },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-gray-100 bg-white p-5">
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className={`mt-1 text-3xl font-bold ${s.accent}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Alerts + Appointments */}
          <div className="flex flex-col gap-4 lg:flex-row">
            {/* Alerts */}
            <div className="flex-[3] rounded-xl border border-gray-100 bg-white p-5">
              <h2 className="mb-4 text-sm font-semibold text-gray-800">Recent Patient Alerts</h2>
              <div className="space-y-3">
                {ALERTS.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 rounded-lg border border-gray-50 bg-gray-50 px-4 py-3">
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      a.severity === 'Critical' ? 'bg-[#FCEBEB] text-[#A32D2D]' : 'bg-[#FAEEDA] text-[#854F0B]'
                    }`}>
                      {a.severity}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-800">{a.name}</p>
                      <p className="truncate text-xs text-gray-400">{a.trigger}</p>
                    </div>
                    <span className="shrink-0 text-xs text-gray-400">{a.time}</span>
                    <button className="shrink-0 rounded-lg border border-teal-200 px-3 py-1 text-xs font-medium text-teal-700 hover:bg-teal-50">
                      View
                    </button>
                  </div>
                ))}
              </div>
              {statusText && <p className="mt-3 text-xs text-amber-500">{statusText}</p>}
            </div>

            {/* Appointments */}
            <div className="flex-[2] rounded-xl border border-gray-100 bg-white p-5">
              <h2 className="mb-4 text-sm font-semibold text-gray-800">Upcoming Appointments</h2>
              <div className="space-y-3">
                {APPOINTMENTS.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 rounded-lg border border-gray-50 bg-gray-50 px-4 py-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">
                      {a.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-800">{a.name}</p>
                      <p className="text-xs text-gray-400">{a.type}</p>
                    </div>
                    <span className="shrink-0 text-xs font-medium text-gray-600">{a.time}</span>
                  </div>
                ))}
              </div>

              {/* Pending call requests inline */}
              {pendingRequests.length > 0 && activeNav !== 'videocalls' && (
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <p className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Live Call Requests</p>
                  {pendingRequests.slice(0, 2).map((req) => (
                    <div key={req.id} className="mb-2 rounded-lg border border-amber-100 bg-amber-50 p-3">
                      <p className="text-xs text-gray-500">Patient: {req.patientId}</p>
                      <p className="text-sm text-gray-800">"{req.reason}"</p>
                      <div className="mt-2 flex gap-2">
                        <button onClick={() => acceptRequest(req.id)} className="rounded-full bg-teal-600 px-3 py-1 text-xs font-semibold text-white hover:bg-teal-700">Accept</button>
                        <button onClick={() => declineRequest(req.id)} className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-500 hover:bg-gray-100">Decline</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Video Call Requests Panel */}
          {activeNav === 'videocalls' && (
            <div className="rounded-xl border border-gray-100 bg-white p-5">
              <div className="flex items-center gap-3 mb-4">
                <Video size={18} className="text-teal-600" />
                <h2 className="text-sm font-semibold text-gray-800">Patient Video Call Requests</h2>
                {pendingRequests.length > 0 && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">{pendingRequests.length} pending</span>
                )}
              </div>
              {pendingRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Video size={40} className="text-gray-200 mb-3" />
                  <p className="text-sm text-gray-400">No pending video call requests</p>
                  <p className="text-xs text-gray-300 mt-1">When a patient sends a call invitation, it will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingRequests.map((req) => (
                    <div key={req.id} className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">P</span>
                            <div>
                              <p className="text-sm font-semibold text-gray-800">Patient ID: {req.patientId}</p>
                              <p className="text-xs text-gray-400">{new Date(req.createdAt).toLocaleString()}</p>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 mt-2 italic">"{req.reason}"</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 uppercase">Pending</span>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => acceptRequest(req.id)}
                          className="flex items-center gap-1.5 rounded-full bg-teal-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 transition"
                        >
                          <Video size={12} /> Accept & Join Call
                        </button>
                        <button
                          onClick={() => declineRequest(req.id)}
                          className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-xs text-gray-500 hover:bg-gray-100 transition"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {statusText && <p className="mt-3 text-xs text-amber-500">{statusText}</p>}
            </div>
          )}

          {/* Peak Flow Chart */}
          <div className="rounded-xl border border-gray-100 bg-white p-5">
            <h2 className="mb-1 text-sm font-semibold text-gray-800">7-Day Average Peak Flow</h2>
            <p className="mb-4 text-xs text-gray-400">All patients · % of predicted</p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={PEAK_FLOW} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1D9E75" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#1D9E75" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v: number) => [`${v}%`, 'Peak Flow']} contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
                <Area type="monotone" dataKey="value" stroke="#1D9E75" strokeWidth={2} fill="url(#tealGrad)" dot={{ r: 3, fill: '#1D9E75' }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

        </main>
      </div>
    </div>
  );
}
