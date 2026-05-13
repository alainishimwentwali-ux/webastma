import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

interface DoctorInfo {
  id: string;
  fullName: string;
  email: string;
  role: 'doctor' | 'patient';
}

interface CallRequest {
  id: string;
  patientId: string;
  doctorId: string;
  reason: string;
  status: string;
  createdAt: string;
}

function DoctorPage() {
  const [role, setRole] = useState<'doctor' | 'patient' | ''>('');
  const [doctors, setDoctors] = useState<DoctorInfo[]>([]);
  const [pendingRequests, setPendingRequests] = useState<CallRequest[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [reason, setReason] = useState('');
  const [statusText, setStatusText] = useState('');
  const [loading, setLoading] = useState(false);
  const [roomLink, setRoomLink] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const storedRole = localStorage.getItem('role') as 'doctor' | 'patient' | null;
    setRole(storedRole || '');
  }, []);

  useEffect(() => {
    if (role === 'patient') {
      fetchDoctors();
    } else if (role === 'doctor') {
      fetchPendingRequests();
    }
  }, [role]);

  const fetchDoctors = async () => {
    try {
      const { data } = await api.get('/doctors');
      setDoctors(data || []);
      if (data.length) {
        setSelectedDoctor(data[0].id);
      }
    } catch (error) {
      console.error(error);
      setStatusText('Unable to load doctors. Please try again later.');
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const { data } = await api.get('/calls/pending');
      setPendingRequests(data || []);
    } catch (error) {
      console.error(error);
      setStatusText('Unable to load pending requests.');
    }
  };

  const requestVideoCall = async () => {
    if (!selectedDoctor || !reason) {
      setStatusText('Please select a doctor and provide a reason for the call.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/calls/request', { doctorId: selectedDoctor, reason });
      setStatusText('Call request sent. Your doctor will accept the call when they are ready.');
      setReason('');
    } catch (error) {
      console.error(error);
      setStatusText('Unable to request a call. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const acceptRequest = async (requestId: string) => {
    try {
      const { data } = await api.post('/calls/accept', { requestId });
      setRoomLink(`/call/${data.roomId}`);
      setStatusText('Call accepted. Opening call room...');
      navigate(`/call/${data.roomId}`);
    } catch (error) {
      console.error(error);
      setStatusText('Unable to accept the call.');
    }
  };

  const declineRequest = async (requestId: string) => {
    try {
      await api.post('/calls/decline', { requestId });
      setStatusText('Call request declined.');
      fetchPendingRequests();
    } catch (error) {
      console.error(error);
      setStatusText('Unable to decline the call.');
    }
  };

  if (!role) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl shadow-slate-950/30">
        <h2 className="text-3xl font-semibold">Doctor Consultation</h2>
        <p className="mt-3 text-slate-400">Please log in to request or manage video consultations.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl shadow-slate-950/30">
        <h2 className="text-3xl font-semibold">Doctor Consultation</h2>
        <p className="mt-2 text-slate-400">Use secure video calls to connect with a doctor or respond to incoming patient requests.</p>
      </section>

      {role === 'patient' && (
        <section className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
            <h3 className="text-xl font-semibold">Request a video call</h3>
            <label className="mt-6 block text-sm text-slate-300">Doctor</label>
            <select
              value={selectedDoctor}
              onChange={(event) => setSelectedDoctor(event.target.value)}
              className="mt-2 w-full rounded-2xl bg-slate-950 p-3 text-slate-100"
            >
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>{doctor.fullName}</option>
              ))}
            </select>

            <label className="mt-6 block text-sm text-slate-300">Reason for call</label>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="mt-2 h-40 w-full rounded-3xl bg-slate-950 p-4 text-slate-100"
              placeholder="Describe your symptoms and why you'd like a video consultation."
            />

            <button
              className="mt-5 inline-flex items-center justify-center rounded-full bg-cyan-500 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-400"
              onClick={requestVideoCall}
              disabled={loading}
            >
              {loading ? 'Requesting call...' : 'Request video call'}
            </button>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
            <h3 className="text-xl font-semibold">Doctor availability</h3>
            <p className="mt-4 text-slate-400">Your selected doctor will receive the request and can join the video room when they accept.</p>
            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-200">
              {statusText || 'No call requests yet. Select a doctor and describe your symptoms to begin.'}
            </div>
          </div>
        </section>
      )}

      {role === 'doctor' && (
        <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
          <h3 className="text-xl font-semibold">Pending patient requests</h3>
          <div className="mt-4 space-y-4">
            {pendingRequests.length === 0 ? (
              <p className="text-slate-400">No pending requests right now. Refresh the page to check again.</p>
            ) : (
              pendingRequests.map((request) => (
                <div key={request.id} className="rounded-3xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-sm text-slate-400">Request from patient ID: {request.patientId}</p>
                  <p className="mt-2 text-white">“{request.reason}”</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      className="rounded-full bg-cyan-500 px-4 py-2 font-semibold text-slate-950 hover:bg-cyan-400"
                      onClick={() => acceptRequest(request.id)}
                    >
                      Accept
                    </button>
                    <button
                      className="rounded-full border border-slate-700 px-4 py-2 text-slate-200 hover:bg-slate-800"
                      onClick={() => declineRequest(request.id)}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-200">
            {statusText || 'Accept a request to open the doctor-patient video room.'}
          </div>
          {roomLink && (
            <p className="mt-4 text-cyan-300">
              Join call room: <button onClick={() => navigate(roomLink)} className="underline">{roomLink}</button>
            </p>
          )}
        </section>
      )}
    </div>
  );
}

export default DoctorPage;
