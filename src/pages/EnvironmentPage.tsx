import { useEffect, useState } from 'react';
import axios from 'axios';

interface CityRisk {
  level: string;
  details: string;
  temperature: string;
  humidity: string;
  condition: string;
  aqi: number;
  pollen: string;
  trigger: string;
  riskScore: number;
}

const riskColors: Record<string, { border: string; bg: string; badge: string; text: string }> = {
  High:     { border: 'border-rose-800/40',    bg: 'bg-rose-950/30',    badge: 'bg-rose-900/60 text-rose-300',    text: 'text-rose-300' },
  Moderate: { border: 'border-yellow-800/40',  bg: 'bg-yellow-950/30',  badge: 'bg-yellow-900/60 text-yellow-300', text: 'text-yellow-300' },
  Low:      { border: 'border-emerald-800/40', bg: 'bg-emerald-950/30', badge: 'bg-emerald-900/60 text-emerald-300', text: 'text-emerald-300' },
};

function EnvironmentPage() {
  const [cities, setCities] = useState<Record<string, CityRisk>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get('/api/weather/risk')
      .then(({ data }) => setCities(data.cities ?? data))
      .catch(() => setError('Failed to load environmental data.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-xl shadow-slate-950/30">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Live Data</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Environment</h2>
        <p className="mt-2 text-slate-400">Weather and air quality factors affecting asthma risk across Rwanda.</p>
      </section>

      {loading ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 text-cyan-300">Loading environmental data...</div>
      ) : error ? (
        <div className="rounded-3xl border border-rose-800/40 bg-rose-950/30 p-6 text-rose-300">{error}</div>
      ) : (
        <section className="grid gap-6 lg:grid-cols-2">
          {Object.entries(cities).map(([city, info]) => {
            const c = riskColors[info.level] ?? riskColors.Low;
            return (
              <div key={city} className={`rounded-3xl border ${c.border} ${c.bg} p-6 space-y-4`}>
                <div className="flex items-center justify-between">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{city.toUpperCase()}</p>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${c.badge}`}>{info.level} Risk</span>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3 text-center">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500">Temp</p>
                    <p className="mt-1 text-lg font-semibold text-white">{info.temperature}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3 text-center">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500">Humidity</p>
                    <p className="mt-1 text-lg font-semibold text-white">{info.humidity}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3 text-center">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500">AQI</p>
                    <p className={`mt-1 text-lg font-semibold ${c.text}`}>{info.aqi}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3 text-center">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500">Pollen</p>
                    <p className={`mt-1 text-lg font-semibold ${c.text}`}>{info.pollen}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-400">{info.details}</p>
                </div>

                <div className="flex items-center gap-3">
                  <p className="text-xs text-slate-500">Risk Score</p>
                  <div className="flex-1 rounded-full bg-slate-800 h-2">
                    <div
                      className={`h-2 rounded-full ${info.level === 'High' ? 'bg-rose-500' : info.level === 'Moderate' ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                      style={{ width: `${info.riskScore}%` }}
                    />
                  </div>
                  <p className={`text-xs font-semibold ${c.text}`}>{info.riskScore}/100</p>
                </div>
              </div>
            );
          })}
        </section>
      )}

      <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
        <h3 className="text-xl font-semibold text-white">Practical Tips</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-400 text-sm">
          <li>Keep your inhaler nearby on high-humidity or windy days.</li>
          <li>Stay indoors when risk alerts increase for your city.</li>
          <li>Track environmental triggers together with symptoms.</li>
        </ul>
      </section>
    </div>
  );
}

export default EnvironmentPage;
