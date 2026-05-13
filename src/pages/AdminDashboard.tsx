import { useEffect, useState } from 'react';
import axios from 'axios';

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    openConsultations: 0,
    recentReports: 0,
    consultationCount: 0,
    videoSessionCount: 0,
    recentConsultations: [] as Array<{ id: number; symptoms: string; createdAt: string }>,
    recentVideoSessions: [] as Array<{ id: number; sessionUrl: string; createdAt: string }>
  });
  const [loading, setLoading] = useState(true);
  const [clearLoading, setClearLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchAdmin = async () => {
    try {
      const { data } = await axios.get('/api/admin/overview');
      setStats(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    const confirmed = window.confirm('Clear all consultation and video session history? This cannot be undone.');
    if (!confirmed) {
      return;
    }

    setClearLoading(true);
    try {
      await axios.post('/api/admin/clear-history');
      setMessage('History cleared successfully.');
      fetchAdmin();
    } catch (error) {
      console.error(error);
      setMessage('Failed to clear history.');
    } finally {
      setClearLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmin();
  }, []);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl shadow-slate-950/30">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl font-semibold">Admin Dashboard</h2>
            <p className="mt-2 text-slate-400">Monitor users, review risk analytics, and manage the asthma care workflow.</p>
          </div>
          <button
            className="inline-flex items-center justify-center rounded-full bg-rose-500 px-5 py-3 font-semibold text-white hover:bg-rose-400 disabled:opacity-50"
            onClick={clearHistory}
            disabled={clearLoading}
          >
            {clearLoading ? 'Clearing...' : 'Clear History'}
          </button>
        </div>
        {message && <p className="mt-3 text-sm text-cyan-300">{message}</p>}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {[
          { label: 'Total Users', value: stats.totalUsers },
          { label: 'Open Consultations', value: stats.openConsultations },
          { label: 'Recent Reports', value: stats.recentReports },
          { label: 'Symptom Submissions', value: stats.consultationCount },
          { label: 'Video Sessions', value: stats.videoSessionCount }
        ].map(({ label, value }) => (
          <div key={label} className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">{label}</p>
            <p className="mt-4 text-4xl font-semibold text-white">{loading ? '...' : value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
        <h3 className="text-xl font-semibold">Recent Consultations</h3>
        <p className="mt-2 text-slate-400">Most recent symptom submissions stored for review.</p>
        <div className="mt-4 space-y-3">
          {loading ? (
            <p className="text-slate-400">Loading recent consultations...</p>
          ) : stats.recentConsultations.length ? (
            stats.recentConsultations.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-sm text-slate-500">ID: {item.id} • {new Date(item.createdAt).toLocaleString()}</p>
                <p className="mt-2 text-slate-200">{item.symptoms || 'No symptoms provided.'}</p>
              </div>
            ))
          ) : (
            <p className="text-slate-400">No consultations recorded yet.</p>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
        <h3 className="text-xl font-semibold">Recent Video Sessions</h3>
        <p className="mt-2 text-slate-400">Most recent video session requests for patient follow-up.</p>
        <div className="mt-4 space-y-3">
          {loading ? (
            <p className="text-slate-400">Loading recent video sessions...</p>
          ) : stats.recentVideoSessions.length ? (
            stats.recentVideoSessions.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-sm text-slate-500">ID: {item.id} • {new Date(item.createdAt).toLocaleString()}</p>
                <a className="mt-2 block text-cyan-300 underline" href={item.sessionUrl} target="_blank" rel="noreferrer">
                  {item.sessionUrl}
                </a>
              </div>
            ))
          ) : (
            <p className="text-slate-400">No video sessions recorded yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}

export default AdminDashboard;
