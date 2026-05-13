import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';

const backendUrl = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:4000';

interface Message { text: string; sender: string; role: 'doctor' | 'patient'; timestamp: string; }
interface Prescription { medicine: string; dosage: string; duration: string; instructions: string; }

function WaitingRoom({ doctorName }: { doctorName: string }) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-green-50 to-teal-50 p-8">
      <div className="rounded-3xl bg-white p-12 shadow-xl text-center max-w-md w-full">
        <div className="relative mx-auto mb-6 h-24 w-24">
          <div className="absolute inset-0 animate-ping rounded-full bg-green-200 opacity-75" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-green-100">
            <span className="text-4xl">🩺</span>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Waiting for {doctorName} to join…</h2>
        <p className="text-gray-500 mb-6">Please stay on this page. Your doctor will join shortly.</p>
        <div className="rounded-2xl bg-green-50 p-4 mb-4">
          <p className="text-sm text-gray-500">Wait time</p>
          <p className="text-3xl font-mono font-bold text-green-600">{fmt(seconds)}</p>
        </div>
        <div className="flex items-center justify-center gap-2 text-sm text-green-600">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          Secure &amp; Encrypted
        </div>
      </div>
    </div>
  );
}

function CallPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  const [status, setStatus] = useState('Connecting…');
  const [error, setError] = useState('');
  const [role, setRole] = useState<'doctor' | 'patient'>('patient');
  const [remoteSocketId, setRemoteSocketId] = useState<string | null>(null);
  const [remoteJoined, setRemoteJoined] = useState(false);

  // Controls
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);

  // Chat
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Doctor extras
  const [notes, setNotes] = useState('');
  const [showRx, setShowRx] = useState(false);
  const [rx, setRx] = useState<Prescription>({ medicine: '', dosage: '', duration: '', instructions: '' });

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const fullName = localStorage.getItem('fullName') || (role === 'doctor' ? 'Dr. Smith' : 'Patient');

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    const storedRole = localStorage.getItem('role') as 'doctor' | 'patient' | null;
    const token = localStorage.getItem('token');
    if (!roomId || !storedRole || !token) { setError('Missing session info. Please log in again.'); return; }
    setRole(storedRole);

    const socket = io(backendUrl, { auth: { token } });
    socketRef.current = socket;

    socket.on('connect', () => {
      setStatus('Connected to signaling server.');
      socket.emit('join-call', { roomId, role: storedRole });
    });

    socket.on('user-joined', (data: { role: string; socketId: string }) => {
      setRemoteSocketId(data.socketId);
      setRemoteJoined(true);
      setStatus('Remote user joined.');
      if (storedRole === 'patient') createOffer(data.socketId);
    });

    socket.on('offer', async (data: { offer: RTCSessionDescriptionInit; from: string }) => {
      setRemoteSocketId(data.from);
      setRemoteJoined(true);
      await ensureLocalStream();
      await createPeerConnection(data.from);
      if (pcRef.current) {
        await pcRef.current.setRemoteDescription(data.offer);
        const answer = await pcRef.current.createAnswer();
        await pcRef.current.setLocalDescription(answer);
        socket.emit('answer', { answer, to: data.from });
      }
    });

    socket.on('answer', async (data: { answer: RTCSessionDescriptionInit }) => {
      if (pcRef.current) { await pcRef.current.setRemoteDescription(data.answer); setStatus('Call connected.'); }
    });

    socket.on('ice-candidate', async (data: { candidate: RTCIceCandidateInit }) => {
      if (pcRef.current && data.candidate) {
        try { await pcRef.current.addIceCandidate(data.candidate); } catch {}
      }
    });

    socket.on('message', (msg: Message) => setMessages(prev => [...prev, msg]));

    socket.on('user-left', () => { setRemoteJoined(false); setStatus('Remote user left the call.'); });
    socket.on('user-disconnected', () => { setRemoteJoined(false); setStatus('Remote user disconnected.'); });
    socket.on('connect_error', (err: Error) => setError(`Connection error: ${err.message}`));

    initMedia().catch(() => setError('Unable to access camera or microphone.'));

    return () => {
      socket.emit('leave-call', { roomId });
      socket.disconnect();
      pcRef.current?.close();
      localStreamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [roomId]);

  const initMedia = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    setStatus('Waiting for remote participant…');
  };

  const ensureLocalStream = async () => { if (!localStreamRef.current) await initMedia(); };

  const createPeerConnection = async (remoteId: string) => {
    if (pcRef.current) return pcRef.current;
    await ensureLocalStream();
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    pc.onicecandidate = e => {
      if (e.candidate) socketRef.current?.emit('ice-candidate', { candidate: e.candidate.toJSON(), to: remoteId });
    };
    pc.ontrack = e => { if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0]; };
    localStreamRef.current?.getTracks().forEach(t => pc.addTrack(t, localStreamRef.current!));
    pcRef.current = pc;
    return pc;
  };

  const createOffer = async (remoteId: string) => {
    const pc = await createPeerConnection(remoteId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socketRef.current?.emit('offer', { offer, to: remoteId });
    setStatus('Offer sent…');
  };

  const toggleMic = () => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !micOn; });
    setMicOn(v => !v);
  };

  const toggleCam = () => {
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !camOn; });
    setCamOn(v => !v);
  };

  const sendMessage = (text: string) => {
    if (!text.trim() || !roomId) return;
    const msg: Message = { text, sender: fullName, role, timestamp: new Date().toISOString() };
    socketRef.current?.emit('message', { roomId, text, sender: fullName });
    setMessages(prev => [...prev, msg]);
    setChatInput('');
  };

  const leaveCall = () => {
    socketRef.current?.emit('leave-call', { roomId });
    socketRef.current?.disconnect();
    pcRef.current?.close();
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    navigate(role === 'doctor' ? '/doctor-dashboard' : '/');
  };

  const quickReplies = ['Please describe your symptoms', "I'll send a prescription shortly", 'Everything looks fine'];

  const isDoctor = role === 'doctor';
  const themeAccent = isDoctor ? 'teal' : 'green';

  if (error) return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-8">
      <div className="rounded-2xl bg-red-50 border border-red-200 p-8 text-center max-w-md">
        <p className="text-2xl mb-2">⚠️</p>
        <p className="text-red-700 font-medium">{error}</p>
        <button onClick={() => navigate(-1)} className="mt-4 rounded-xl bg-red-500 px-6 py-2 text-white font-medium hover:bg-red-600">Go Back</button>
      </div>
    </div>
  );

  if (!remoteJoined && role === 'patient') return <WaitingRoom doctorName="your doctor" />;

  return (
    <div className={`flex min-h-screen flex-col bg-gradient-to-br ${isDoctor ? 'from-teal-50 to-blue-50' : 'from-green-50 to-teal-50'}`}>

      {/* Header */}
      <header className="flex items-center justify-between bg-white px-6 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-teal-700">🛡️ Asthma Shield</span>
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> Secure &amp; Encrypted
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isDoctor ? 'bg-teal-100 text-teal-700' : 'bg-green-100 text-green-700'}`}>
            {isDoctor ? '👨‍⚕️ Doctor' : '🧑 Patient'}
          </span>
          <span className="text-xs text-gray-400">Room: {roomId?.slice(0, 8)}…</span>
          <span className={`flex items-center gap-1 text-xs ${remoteJoined ? 'text-green-600' : 'text-red-400'}`}>
            <span className={`h-2 w-2 rounded-full ${remoteJoined ? 'bg-green-500' : 'bg-red-400'}`} />
            {remoteJoined ? 'Connected' : 'Waiting…'}
          </span>
        </div>
      </header>

      {/* Doctor top bar */}
      {isDoctor && (
        <div className="bg-teal-700 px-6 py-3 flex flex-wrap items-center gap-4">
          <div className="text-white">
            <p className="text-xs opacity-75">Patient</p>
            <p className="font-semibold">Consultation Session</p>
          </div>
          <div className="flex-1 min-w-48">
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Consultation notes…"
              rows={1}
              className="w-full rounded-xl bg-teal-600 px-3 py-2 text-sm text-white placeholder-teal-300 outline-none resize-none"
            />
          </div>
          <button
            onClick={() => setShowRx(true)}
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50 transition"
          >
            📋 Send Prescription
          </button>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">

        {/* Video area */}
        <div className="relative flex-1 bg-gray-900">
          {/* Remote video (full) */}
          <video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-cover" />
          {!remoteJoined && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="text-6xl mb-4 animate-pulse">👤</div>
                <p className="text-lg opacity-75">{status}</p>
              </div>
            </div>
          )}

          {/* Local video (thumbnail) */}
          <div className="absolute bottom-24 right-4 w-36 overflow-hidden rounded-2xl border-2 border-white shadow-lg">
            <video ref={localVideoRef} autoPlay muted playsInline className="w-full object-cover" style={{ transform: 'scaleX(-1)' }} />
            {!camOn && <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-white text-2xl">📷</div>}
            <div className="bg-black/50 px-2 py-1 text-center text-xs text-white">You</div>
          </div>

          {/* Controls bar */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 rounded-2xl bg-black/70 px-6 py-3 backdrop-blur">
            <button
              onClick={toggleMic}
              className={`flex h-12 w-12 items-center justify-center rounded-full text-xl transition ${micOn ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-500 text-white'}`}
              title={micOn ? 'Mute' : 'Unmute'}
            >
              {micOn ? '🎤' : '🔇'}
            </button>
            <button
              onClick={toggleCam}
              className={`flex h-12 w-12 items-center justify-center rounded-full text-xl transition ${camOn ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-500 text-white'}`}
              title={camOn ? 'Camera off' : 'Camera on'}
            >
              {camOn ? '📷' : '🚫'}
            </button>
            <button
              onClick={leaveCall}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-2xl text-white hover:bg-red-600 transition shadow-lg"
              title="End call"
            >
              📞
            </button>
            <button
              onClick={() => setChatOpen(v => !v)}
              className={`flex h-12 w-12 items-center justify-center rounded-full text-xl transition ${chatOpen ? `bg-${themeAccent}-500 text-white` : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
              title="Toggle chat"
            >
              💬
            </button>
          </div>
        </div>

        {/* Chat panel */}
        {chatOpen && (
          <div className="flex w-80 flex-col bg-white shadow-xl">
            <div className={`bg-${isDoctor ? 'teal' : 'green'}-600 px-4 py-3 text-white font-semibold flex items-center justify-between`}>
              <span>💬 In-Call Chat</span>
              <button onClick={() => setChatOpen(false)} className="text-white/70 hover:text-white">✕</button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && <p className="text-center text-sm text-gray-400 mt-8">No messages yet</p>}
              {messages.map((m, i) => {
                const isMine = m.sender === fullName;
                return (
                  <div key={i} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${isMine
                      ? isDoctor ? 'bg-teal-500 text-white' : 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-800'}`}>
                      {m.text}
                    </div>
                    <span className="mt-1 text-xs text-gray-400">
                      {m.sender} · {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Quick replies for doctor */}
            {isDoctor && (
              <div className="border-t px-3 py-2 space-y-1">
                {quickReplies.map(q => (
                  <button key={q} onClick={() => sendMessage(q)}
                    className="w-full rounded-xl bg-teal-50 px-3 py-1.5 text-left text-xs text-teal-700 hover:bg-teal-100 transition">
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="border-t p-3 flex gap-2">
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage(chatInput)}
                placeholder="Type a message…"
                className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-teal-400"
              />
              <button
                onClick={() => sendMessage(chatInput)}
                className={`rounded-xl px-3 py-2 text-white text-sm font-medium ${isDoctor ? 'bg-teal-500 hover:bg-teal-600' : 'bg-green-500 hover:bg-green-600'}`}
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Prescription modal */}
      {showRx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">📋 Send Prescription</h3>
              <button onClick={() => setShowRx(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="space-y-3">
              {(['medicine', 'dosage', 'duration', 'instructions'] as const).map(field => (
                <div key={field}>
                  <label className="block text-xs font-medium text-gray-500 mb-1 capitalize">{field}</label>
                  <input
                    value={rx[field]}
                    onChange={e => setRx(prev => ({ ...prev, [field]: e.target.value }))}
                    placeholder={field === 'medicine' ? 'e.g. Salbutamol' : field === 'dosage' ? 'e.g. 2 puffs' : field === 'duration' ? 'e.g. 7 days' : 'e.g. Use when needed'}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-teal-400"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                sendMessage(`📋 Prescription: ${rx.medicine} — ${rx.dosage} for ${rx.duration}. ${rx.instructions}`);
                setShowRx(false);
                setRx({ medicine: '', dosage: '', duration: '', instructions: '' });
              }}
              className="mt-4 w-full rounded-xl bg-teal-600 py-3 font-semibold text-white hover:bg-teal-700 transition"
            >
              Send to Patient
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CallPage;
