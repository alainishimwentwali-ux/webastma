import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

interface Patient {
  id: string;
  fullName: string;
  email: string;
}

interface Symptom {
  id: string;
  patientId: string;
  patientName?: string;
  symptoms: string;
  severity: string;
  notes: string;
  createdAt: string;
}

interface CallRequest {
  id: string;
  patientId: string;
  reason: string;
  status: string;
  createdAt: string;
}

export default function DoctorPatientPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [pendingCalls, setPendingCalls] = useState<CallRequest[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [recommendation, setRecommendation] = useState('');
  const [statusText, setStatusText] = useState('');
  const [activeTab, setActiveTab] = useState<'patients' | 'symptoms' | 'calls'>('patients');
  const navigate = useNavigate();

  const fetchAll = async () => {
    try {
      const [pRes, sRes, cRes] = await Promise.all([
        api.get('/doctors/patients').catch(() => ({ data: [] })),
        api.get('/symptoms/all').catch(() => ({ data: [] })),
        api.get('/calls/pending').catch(() => ({ data: [] })),
      ]);
      setPatients(pRes.data || []);
      setSymptoms(sRes.data || []);
      setPendingCalls(cRes.data || []);
    } catch {}
  };

  useEffect(() => {
    fetchAll();
    const t = setInterval(fetchAll, 15000);
    return () => clearInterval(t);
  }, []);

  const sendRecommendation = async (patientId: string) => {
    if (!recommendation.trim()) return;
    try {
      await api.post('/doctor/notify', { patientId, message: recommendation });
      setStatusText('Recommendation sent successfully.');
      setRecommendation('');
    } catch {
      setStatusText('Failed to send recommendation.');
    }
  };

  const acceptCall = async (requestId: string) => {
    try {
      const { data } = await api.post('/calls/accept', { requestId });
      navigate(`/call/${data.roomId}`);
    } catch {
      setStatusText('Unable to accept the call.');
    }
  };

  const declineCall = async (requestId: string) => {
    try {
      await api.post('/calls/decline', { requestId });
      fetchAll();
    } catch {
      setStatusText('Unable to decline the call.');
    }
  };

  const severityColor = (s: string) => {
    const l = s?.toLowerCase();
    if (l === 'severe' || l === 'high') return 'bg-red-100 text-red-700';
    if (l === 'moderate' || l === 'medium') return 'bg-amber-100 text-amber-700';
    return 'bg-emerald-100 text-emerald-700';
  };

  const tabs = [
    { id: 'patients' as const, label: 'My Patients', count: patients.length },
    { id: 'symptoms' as const, label: 'Symptom Submissions', count: symptoms.length },
    { id: 'calls' as const, label: 'Video Call Requests', count: pendingCalls.length, alert: pendingCalls.length > 0 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Page header */}
      <div className="border-b border-gray-100 bg-white px-8 py-6">
        <h1 className="text-2xl font-bold text-gray-900">Patient Management</h1>
        <p className="mt-1 text-sm text-gray-400">View your patients, review symptom submissions, and manage video call requests.</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-100 bg-white px-8">
        <div className="flex gap-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-5 py-4 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-teal-600 text-teal-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                tab.alert ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-8">
        {statusText && (
          <div className="mb-4 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-700">
            {statusText}
          </div>
        )}

        {/* ── Patients Tab ── */}
        {activeTab === 'patients' && (
          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            {/* Patient list */}
            <div className="rounded-xl border border-gray-100 bg-white p-5">
              <h2 className="mb-4 text-sm font-semibold text-gray-800">Registered Patients</h2>
              {patients.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <span className="text-5xl mb-3">👥</span>
                  <p className="text-sm text-gray-400">No patients assigned yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {patients.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPatient(p)}
                      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition ${
                        selectedPatient?.id === p.id
                          ? 'bg-teal-50 border border-teal-200'
                          : 'border border-gray-50 bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-700">
                        {p.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-800">{p.fullName}</p>
                        <p className="truncate text-xs text-gray-400">{p.email}</p>
                      </div>
                      <span className="shrink-0 text-xs text-teal-600">View →</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Patient detail + recommendation */}
            <div className="rounded-xl border border-gray-100 bg-white p-5">
              {!selectedPatient ? (
                <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                  <span className="text-4xl mb-3">👈</span>
                  <p className="text-sm text-gray-400">Select a patient to view details and send a recommendation.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-600 text-lg font-bold text-white">
                      {selectedPatient.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{selectedPatient.fullName}</p>
                      <p className="text-xs text-gray-400">{selectedPatient.email}</p>
                    </div>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Recent Symptoms</p>
                    {symptoms.filter(s => s.patientId === selectedPatient.id).length === 0 ? (
                      <p className="text-xs text-gray-400">No symptom submissions from this patient.</p>
                    ) : (
                      symptoms.filter(s => s.patientId === selectedPatient.id).slice(0, 3).map(s => (
                        <div key={s.id} className="mb-2 rounded-lg border border-gray-100 bg-white p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${severityColor(s.severity)}`}>
                              {s.severity}
                            </span>
                            <span className="text-[10px] text-gray-400">{new Date(s.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-xs text-gray-700">{s.symptoms}</p>
                          {s.notes && <p className="mt-1 text-xs text-gray-400 italic">{s.notes}</p>}
                        </div>
                      ))
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Send Recommendation</label>
                    <textarea
                      value={recommendation}
                      onChange={e => setRecommendation(e.target.value)}
                      rows={3}
                      placeholder="Type your medical recommendation or advice..."
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-teal-400 resize-none"
                    />
                    <button
                      onClick={() => sendRecommendation(selectedPatient.id)}
                      className="mt-2 w-full rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 transition"
                    >
                      Send to Patient
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Symptoms Tab ── */}
        {activeTab === 'symptoms' && (
          <div className="rounded-xl border border-gray-100 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-gray-800">All Symptom Submissions</h2>
            {symptoms.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="text-5xl mb-3">📋</span>
                <p className="text-sm text-gray-400">No symptom submissions yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {symptoms.map((s) => (
                  <div key={s.id} className="flex items-start gap-4 rounded-xl border border-gray-50 bg-gray-50 px-4 py-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">
                      {(s.patientName || s.patientId).charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-gray-800">{s.patientName || `Patient ${s.patientId.slice(0, 6)}`}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${severityColor(s.severity)}`}>
                          {s.severity}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{s.symptoms}</p>
                      {s.notes && <p className="mt-1 text-xs text-gray-400 italic">{s.notes}</p>}
                    </div>
                    <span className="shrink-0 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Video Calls Tab ── */}
        {activeTab === 'calls' && (
          <div className="rounded-xl border border-gray-100 bg-white p-5">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-sm font-semibold text-gray-800">Patient Video Call Requests</h2>
              {pendingCalls.length > 0 && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                  {pendingCalls.length} pending
                </span>
              )}
            </div>

            {pendingCalls.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="text-5xl mb-3">📹</span>
                <p className="text-sm text-gray-400">No pending video call requests.</p>
                <p className="text-xs text-gray-300 mt-1">When a patient sends a call invitation, it will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingCalls.map((req) => (
                  <div key={req.id} className="rounded-xl border border-amber-100 bg-amber-50 p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-700">P</div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">Patient ID: {req.patientId}</p>
                          <p className="text-xs text-gray-400">{new Date(req.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800 uppercase">Pending</span>
                    </div>

                    <div className="rounded-lg bg-white border border-amber-100 px-4 py-3 mb-4">
                      <p className="text-xs text-gray-400 mb-1">Reason for call</p>
                      <p className="text-sm text-gray-800 italic">"{req.reason}"</p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => acceptCall(req.id)}
                        className="flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 transition"
                      >
                        📹 Accept & Join Call
                      </button>
                      <button
                        onClick={() => declineCall(req.id)}
                        className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm text-gray-500 hover:bg-gray-100 transition"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
