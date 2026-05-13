import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

interface SignupPageProps {
  onSignup: (data: { token: string; fullName: string; role: 'doctor' | 'patient' }) => void;
}

function SignupPage({ onSignup }: SignupPageProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'patient' | 'doctor'>('patient');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      const response = await api.post('/auth/register', {
        fullName: name,
        email,
        password,
        role
      });
      const { token, role: returnedRole } = response.data;
      onSignup({ token, fullName: name, role: returnedRole });
      navigate('/');
    } catch (error: any) {
      setError(error?.response?.data?.error || 'Signup failed. Please try again.');
    }
  };

  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-xl shadow-slate-950/30">
      <h2 className="text-3xl font-semibold">Create an account</h2>
      <p className="mt-2 text-slate-400">Sign up to manage asthma risk, connect with doctors, and use video consultations.</p>

      <form onSubmit={submit} className="mt-8 space-y-6">
        <div>
          <label className="block text-sm text-slate-300">Full name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-2 w-full bg-slate-950 p-3 text-slate-100"
            placeholder="Your full name"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-300">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full bg-slate-950 p-3 text-slate-100"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-300">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full bg-slate-950 p-3 text-slate-100"
            placeholder="Choose a password"
          />
        </div>

        <div className="space-y-2">
          <p className="block text-sm text-slate-300">Role</p>
          <label className="inline-flex items-center gap-2 text-slate-300">
            <input
              type="radio"
              name="role"
              value="patient"
              checked={role === 'patient'}
              onChange={() => setRole('patient')}
              className="h-4 w-4 text-cyan-500"
            />
            Patient
          </label>
          <label className="inline-flex items-center gap-2 text-slate-300">
            <input
              type="radio"
              name="role"
              value="doctor"
              checked={role === 'doctor'}
              onChange={() => setRole('doctor')}
              className="h-4 w-4 text-cyan-500"
            />
            Doctor
          </label>
        </div>

        {error && <p className="text-sm text-rose-400">{error}</p>}

        <button type="submit" className="w-full rounded-full bg-cyan-500 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-400">
          Create account
        </button>
      </form>

      <div className="mt-6 border-t border-slate-800 pt-6 text-sm text-slate-400">
        Already have an account?{' '}
        <button type="button" onClick={() => navigate('/login')} className="font-semibold text-cyan-300 hover:text-cyan-200">
          Sign in
        </button>
      </div>
    </div>
  );
}

export default SignupPage;
