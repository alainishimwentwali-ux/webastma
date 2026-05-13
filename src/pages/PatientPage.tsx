import { useEffect, useState } from 'react';
import axios from 'axios';

interface PatientPageProps {
  userName: string;
}

function PatientPage({ userName }: PatientPageProps) {
  const [riskData, setRiskData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRisk = async () => {
      try {
        const { data } = await axios.get('/api/weather/risk');
        setRiskData(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchRisk();
  }, []);

  const kigaliRisk = riskData.kigali || {};

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-xl shadow-slate-950/30">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Patient Profile</p>
          <h2 className="mt-4 text-4xl font-semibold text-white">Hello, {userName || 'Patient'}</h2>
          <p className="mt-4 max-w-2xl text-slate-400">This patient overview gives you a quick summary of your symptom history, medication reminders, and upcoming doctor recommendations.</p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Status</p>
            <p className="mt-4 text-3xl font-semibold text-white">Stable</p>
            <p className="mt-2 text-slate-400">Continue monitoring weather conditions and symptoms daily.</p>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Next check-in</p>
            <p className="mt-4 text-3xl font-semibold text-white">2 days</p>
            <p className="mt-2 text-slate-400">Make sure to update your symptom record before the next consultation.</p>
          </div>
          <div className="rounded-3xl border border-cyan-800/40 bg-cyan-950/30 p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-400">Temperature</p>
            <p className="mt-4 text-3xl font-semibold text-white">{loading ? '...' : kigaliRisk.temperature || 'N/A'}</p>
            <p className="mt-2 text-slate-400">Current air temperature in your location.</p>
          </div>
          <div className={`rounded-3xl border p-6 ${
            kigaliRisk.level === 'High' ? 'border-rose-800/40 bg-rose-950/30' :
            kigaliRisk.level === 'Moderate' ? 'border-yellow-800/40 bg-yellow-950/30' :
            'border-emerald-800/40 bg-emerald-950/30'
          }`}>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Risk Prediction</p>
            <p className={`mt-4 text-3xl font-semibold ${
              kigaliRisk.level === 'High' ? 'text-rose-300' :
              kigaliRisk.level === 'Moderate' ? 'text-yellow-300' :
              'text-emerald-300'
            }`}>{loading ? '...' : kigaliRisk.level || 'N/A'}</p>
            <p className="mt-2 text-slate-400">{loading ? 'Loading...' : kigaliRisk.details || 'No data available'}</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
        <h3 className="text-2xl font-semibold text-white">Health Management</h3>
        <p className="mt-2 text-slate-400">Track your asthma triggers and maintain regular communication with your healthcare provider.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <article className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <p className="font-semibold text-white">Track triggers</p>
            <p className="mt-2 text-sm text-slate-400">Add pollen exposure, weather changes, and activity to your symptom notes for better insights.</p>
          </article>
          <article className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <p className="font-semibold text-white">Doctor support</p>
            <p className="mt-2 text-sm text-slate-400">Use the consultation page to ask questions and request telemedicine support from your doctor.</p>
          </article>
        </div>
      </section>
    </div>
  );
}

export default PatientPage;
