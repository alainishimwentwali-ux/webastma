import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const cities = ['Kigali', 'Huye', 'Musanze', 'Rubavu'];

interface DoctorNotification {
  id: number;
  title: string;
  message: string;
  createdAt: string;
}

interface HomePageProps {
  userName: string;
  onNotificationCountChange?: (count: number) => void;
}

function HomePage({ userName, onNotificationCountChange }: HomePageProps) {
  const [riskData, setRiskData] = useState<Record<string, any>>({});
  const [locationRisk, setLocationRisk] = useState<Record<string, any> | null>(null);
  const [butareWeather, setButareWeather] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [butareLoading, setButareLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [doctorNotifications, setDoctorNotifications] = useState<DoctorNotification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [dashboardImageUrl, setDashboardImageUrl] = useState('');
  const [weatherAlertShown, setWeatherAlertShown] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchRisk = async (lat?: number, lon?: number) => {
      try {
        const url = lat !== undefined && lon !== undefined ? `weather/risk?lat=${lat}&lon=${lon}` : 'weather/risk';
        const { data } = await api.get(url);
        const cities = data.cities ?? data;
        setRiskData(cities);
        setLocationRisk(data.location ?? null);
        setLastUpdated(new Date().toLocaleTimeString());
        // Fire weather alerts for high-risk cities
        Object.entries(cities).forEach(([city, risk]: [string, any]) => {
          if (risk.level === 'High') {
            setWeatherAlertShown(prev => {
              if (!prev.has(city)) {
                if (Notification.permission === 'granted') {
                  new Notification(`⚠️ High Asthma Risk — ${city.charAt(0).toUpperCase() + city.slice(1)}`, {
                    body: risk.details,
                    icon: '/favicon.svg'
                  });
                }
                return new Set([...prev, city]);
              }
              return prev;
            });
          }
        });
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => fetchRisk(position.coords.latitude, position.coords.longitude),
        () => fetchRisk(),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      fetchRisk();
    }

    const interval = setInterval(() => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => fetchRisk(position.coords.latitude, position.coords.longitude),
          () => fetchRisk(),
          { enableHighAccuracy: true, timeout: 10000 }
        );
      } else {
        fetchRisk();
      }
    }, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const sendBrowserNotification = (title: string, body: string) => {
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.svg' });
    }
  };

  const fetchDoctorNotifications = async () => {
    const currentRole = localStorage.getItem('role');
    if (currentRole !== 'doctor') {
      setNotificationsLoading(false);
      return;
    }
    try {
      setNotificationsLoading(true);
      const { data } = await api.get('doctor/notifications');
      const notifications: DoctorNotification[] = data.notifications ?? [];
      setDoctorNotifications(prev => {
        const prevIds = new Set(prev.map(n => n.id));
        const newOnes = notifications.filter(n => !prevIds.has(n.id));
        newOnes.forEach(n => sendBrowserNotification(n.title, n.message));
        return notifications;
      });
      onNotificationCountChange?.(notifications.length);
    } catch (error) {
      console.error(error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const fetchButareWeather = async () => {
    try {
      setButareLoading(true);
      const { data } = await api.get('weather/butare');
      setButareWeather(data.butare ?? null);
    } catch (error) {
      console.error('Failed to load Butare weather:', error);
    } finally {
      setButareLoading(false);
    }
  };

  useEffect(() => {
    Notification.requestPermission();
    fetchDoctorNotifications();
    const notificationInterval = setInterval(fetchDoctorNotifications, 10000);
    return () => clearInterval(notificationInterval);
  }, []);

  useEffect(() => {
    fetchButareWeather();
    const butareInterval = setInterval(fetchButareWeather, 15 * 60 * 1000);
    return () => clearInterval(butareInterval);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('asthmaShieldSettings');
    if (saved) {
      const settings = JSON.parse(saved);
      if (settings.dashboardImageUrl) {
        setDashboardImageUrl(settings.dashboardImageUrl);
      }
    }

    const onSettingsUpdated = (event: any) => {
      const newUrl = event.detail?.dashboardImageUrl;
      if (newUrl) {
        setDashboardImageUrl(newUrl);
      }
    };

    window.addEventListener('dashboardSettingsUpdated', onSettingsUpdated);
    return () => window.removeEventListener('dashboardSettingsUpdated', onSettingsUpdated);
  }, []);

  const overview = butareWeather || locationRisk || riskData.butare || riskData.kigali || {};
  const overviewKeys = {
    temperature: overview.temperature || 'N/A',
    humidity: overview.humidity || 'N/A',
    aqi: overview.aqi || 'N/A',
    pollen: overview.pollen || 'N/A',
    level: overview.level || 'Unknown',
    condition: overview.condition || 'N/A'
  };
  const predictionScore = overview.riskScore ?? 0;
  const predictionPercent = Math.min(100, Math.max(0, Math.round((predictionScore / 90) * 100)));

  const getRiskColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low':
        return 'bg-emerald-500';
      case 'moderate':
        return 'bg-amber-500';
      case 'high':
        return 'bg-rose-500';
      default:
        return 'bg-slate-500';
    }
  };

  const getRiskColorByScore = (score: number) => {
    if (score >= 70) return 'bg-rose-500';
    if (score >= 45) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getPredictionTrend = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low':
        return { label: 'Decreasing', color: 'bg-emerald-500', icon: '▼', description: 'Risk prediction is easing down.' };
      case 'moderate':
        return { label: 'Stable', color: 'bg-amber-500', icon: '▶', description: 'Risk prediction is holding steady.' };
      case 'high':
        return { label: 'Increasing', color: 'bg-rose-500', icon: '▲', description: 'Risk prediction is rising toward high alert.' };
      default:
        return { label: 'Unknown', color: 'bg-slate-500', icon: '•', description: 'Trend data is not available.' };
    }
  };

  const getRecommendations = (level: string, condition: string, aqi: any, humidity: any) => {
    const h = parseInt(humidity) || 0;
    const q = parseInt(aqi) || 0;
    const recs: { icon: string; text: string; priority: 'high' | 'medium' | 'low' }[] = [];

    if (level === 'High') {
      recs.push({ icon: '🏠', text: 'Stay indoors and keep windows closed to avoid outdoor air pollutants.', priority: 'high' });
      recs.push({ icon: '💊', text: 'Keep your rescue inhaler within reach at all times.', priority: 'high' });
      recs.push({ icon: '🚫', text: 'Avoid all strenuous outdoor activity until risk drops.', priority: 'high' });
    } else if (level === 'Moderate') {
      recs.push({ icon: '⚠️', text: 'Limit outdoor exercise — opt for indoor activities today.', priority: 'medium' });
      recs.push({ icon: '💊', text: 'Take your preventive medication as prescribed.', priority: 'medium' });
    } else {
      recs.push({ icon: '✅', text: 'Conditions are safe. Enjoy outdoor activities with normal precautions.', priority: 'low' });
    }

    if (h >= 70) recs.push({ icon: '💧', text: 'High humidity detected — use a dehumidifier indoors if possible.', priority: 'medium' });
    if (q >= 100) recs.push({ icon: '😷', text: 'Poor air quality — wear a mask if you must go outside.', priority: 'high' });
    if (['Rain', 'Mist', 'Fog', 'Haze'].includes(condition)) recs.push({ icon: '🌧️', text: 'Wet conditions can increase mold spores — check indoor air quality.', priority: 'medium' });
    if (['Smoke', 'Dust', 'Sand', 'Ash'].includes(condition)) recs.push({ icon: '🔥', text: 'Smoke or dust in the air — stay indoors and seal gaps in doors/windows.', priority: 'high' });

    recs.push({ icon: '📋', text: 'Log your symptoms today to help your doctor track your condition.', priority: 'low' });
    recs.push({ icon: '💧', text: 'Stay well hydrated — drink at least 8 glasses of water.', priority: 'low' });

    return recs;
  };

  const recommendations = getRecommendations(overviewKeys.level, overviewKeys.condition, overviewKeys.aqi, overviewKeys.humidity);
  const priorityStyle = { high: 'border-rose-500/40 bg-rose-950/30', medium: 'border-amber-500/40 bg-amber-950/30', low: 'border-emerald-500/40 bg-emerald-950/30' };
  const priorityBadge = { high: 'bg-rose-500 text-white', medium: 'bg-amber-500 text-slate-900', low: 'bg-emerald-500 text-slate-900' };

  const currentPrediction = overviewKeys.level?.toLowerCase() || 'unknown';
  const predictionTrend = getPredictionTrend(currentPrediction);
  const latestNotification = doctorNotifications[0];

  return (
    <div className="space-y-10">
      <section
        className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-xl shadow-slate-950/30"
        style={
          dashboardImageUrl
            ? {
                backgroundImage: `linear-gradient(rgba(15,23,42,0.88), rgba(15,23,42,0.88)), url(${dashboardImageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }
            : undefined
        }
      >
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Welcome back</p>
            <h1 className="mt-4 text-4xl font-semibold text-white">Asthma Shield for Rwanda</h1>
            <p className="mt-4 max-w-xl text-slate-400">
              Hello {userName || 'user'}, monitor asthma risk across Kigali, Huye, Musanze, and Rubavu with weather-driven predictions and doctor collaboration.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Current focus</p>
            <h2 className="mt-3 text-2xl font-semibold">Live weather risk insights</h2>
            <p className="mt-3 text-slate-400">Your homepage shows the latest asthma risk forecast and direct links to doctor consultation or admin controls.</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-2xl font-semibold text-white">Butare Weather Metrics</h3>
            <p className="mt-1 text-slate-400">Last updated: {lastUpdated || 'Loading...'}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-300">
            <span className="font-semibold text-white">Doctor alerts</span>
            <span className="ml-2 inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-rose-500 text-xs font-semibold text-white">
              {doctorNotifications.length}
            </span>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {butareLoading ? (
            <div className="col-span-full rounded-3xl border border-slate-800 bg-slate-950 p-6 text-center text-slate-400">
              Loading Butare weather metrics...
            </div>
          ) : (
            [
              { label: 'Temperature', value: overviewKeys.temperature, subtext: 'Butare air temperature' },
              { label: 'Humidity', value: overviewKeys.humidity, subtext: 'Butare moisture in the air' },
              { label: 'Air Quality (AQI)', value: overviewKeys.aqi, subtext: 'Butare air quality index' },
              { label: 'Pollen', value: overviewKeys.pollen, subtext: 'Butare pollen level' }
            ].map((item) => (
              <div key={item.label} className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
                <p className="mt-4 text-3xl font-semibold text-white">{item.value}</p>
                <p className="mt-2 text-xs text-slate-400">{item.subtext}</p>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ── Recommendations ── */}
      <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400">Live Recommendations</p>
            <h3 className="mt-1 text-2xl font-semibold text-white">What You Should Do Now</h3>
            <p className="mt-1 text-sm text-slate-400">Based on current weather risk: <span className={`font-semibold ${ overviewKeys.level === 'High' ? 'text-rose-400' : overviewKeys.level === 'Moderate' ? 'text-amber-400' : 'text-emerald-400'}`}>{overviewKeys.level}</span></p>
          </div>
          <div className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold ${
            overviewKeys.level === 'High' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
            overviewKeys.level === 'Moderate' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
            'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
          }`}>
            <span className="h-2 w-2 rounded-full animate-pulse" style={{ background: 'currentColor' }} />
            {overviewKeys.level === 'High' ? '⚠️ High Alert' : overviewKeys.level === 'Moderate' ? '⚡ Moderate Alert' : '✅ All Clear'}
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {recommendations.map((rec, i) => (
            <div key={i} className={`flex items-start gap-3 rounded-2xl border p-4 ${priorityStyle[rec.priority]}`}>
              <span className="text-2xl">{rec.icon}</span>
              <div className="flex-1">
                <p className="text-sm text-slate-200 leading-snug">{rec.text}</p>
                <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${priorityBadge[rec.priority]}`}>
                  {rec.priority}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/symptoms" className="rounded-xl bg-cyan-500/10 border border-cyan-500/30 px-4 py-2 text-sm font-medium text-cyan-300 hover:bg-cyan-500/20 transition">📋 Log Symptoms</Link>
          <Link to="/consultation" className="rounded-xl bg-teal-500/10 border border-teal-500/30 px-4 py-2 text-sm font-medium text-teal-300 hover:bg-teal-500/20 transition">👨‍⚕️ Consult Doctor</Link>
          <Link to="/environment" className="rounded-xl bg-slate-700/50 border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 transition">🌍 View Environment</Link>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
        <p className="mt-2 text-slate-400">Live alerts from your care team with recommendations on what to do next.</p>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {notificationsLoading ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 text-slate-400">Loading doctor alerts...</div>
          ) : doctorNotifications.length === 0 ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 text-slate-400">No doctor alerts yet. Submit symptoms on the consultation page to receive recommendations.</div>
          ) : (
            doctorNotifications.map((notification) => (
              <div key={notification.id} className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-sm shadow-slate-950/10">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.26em] text-cyan-300">{notification.title}</p>
                    <p className="mt-2 text-base font-semibold text-white">{notification.message}</p>
                  </div>
                  <span className="whitespace-nowrap rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">{new Date(notification.createdAt).toLocaleTimeString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
        <h3 className="text-2xl font-semibold text-white">Risk Prediction Table</h3>
        <p className="mt-2 text-slate-400">This table shows how temperature and humidity maps to asthma risk levels.</p>
        <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr] lg:items-center">
          <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-sm shadow-slate-950/20">
            <div className="flex items-center gap-6">
              <div className={`grid h-36 w-56 place-items-center rounded-full ${getRiskColorByScore(predictionScore)} text-white shadow-xl shadow-slate-950/25`}>
                <div className="text-5xl font-semibold">{predictionScore}</div>
                <div className="text-sm uppercase tracking-[0.3em] text-slate-200">Risk score</div>
                <div className="mt-2 text-xs text-slate-300">{predictionPercent}% of max</div>
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Weather ML prediction</p>
                <h4 className="mt-3 text-2xl font-semibold text-white">{predictionScore >= 70 ? 'High risk' : predictionScore >= 45 ? 'Moderate risk' : 'Low risk'}</h4>
                <p className="mt-2 max-w-md text-slate-400">This score reflects current weather conditions and how they affect asthma risk. Higher values mean greater risk.</p>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
            <div className="inline-flex items-center gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-sm text-slate-200">
              <span className={`inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full ${predictionTrend.color} text-[10px] font-bold`}>{predictionTrend.icon}</span>
              <div>
                <p className="font-semibold text-white">Prediction trend: {predictionTrend.label}</p>
                <p className="text-xs text-slate-400">{predictionTrend.description}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 text-left">
            <thead>
              <tr className="bg-slate-950">
                <th className="border border-slate-800 px-4 py-3 text-sm text-slate-400">Risk Level</th>
                <th className="border border-slate-800 px-4 py-3 text-sm text-slate-400">Temperature</th>
                <th className="border border-slate-800 px-4 py-3 text-sm text-slate-400">Humidity</th>
                <th className="border border-slate-800 px-4 py-3 text-sm text-slate-400">Condition</th>
                <th className="border border-slate-800 px-4 py-3 text-sm text-slate-400">Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  level: 'Low',
                  temperature: '< 27°C',
                  humidity: '< 60%',
                  condition: 'Clear / mild',
                  recommendation: 'Safe to go outside with usual care.'
                },
                {
                  level: 'Moderate',
                  temperature: '27-30°C',
                  humidity: '60-70%',
                  condition: 'Cloudy / light rain',
                  recommendation: 'Monitor symptoms and reduce outdoor activity.'
                },
                {
                  level: 'High',
                  temperature: '≥ 30°C',
                  humidity: '≥ 70%',
                  condition: 'Rain / fog / smoke',
                  recommendation: 'Stay indoors and use asthma medication if needed.'
                }
              ].map((row) => {
                const active = row.level.toLowerCase() === currentPrediction;
                return (
                  <tr
                    key={row.level}
                    className={`even:bg-slate-950 odd:bg-slate-900 ${active ? 'ring-2 ring-rose-500/40 bg-slate-900' : ''}`}
                  >
                    <td className="border border-slate-800 px-4 py-4 text-sm text-white">
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex h-3.5 w-3.5 rounded-full ${getRiskColor(row.level)}`} />
                        <span>{row.level}</span>
                      </div>
                    </td>
                    <td className="border border-slate-800 px-4 py-4 text-sm text-slate-300">{row.temperature}</td>
                    <td className="border border-slate-800 px-4 py-4 text-sm text-slate-300">{row.humidity}</td>
                    <td className="border border-slate-800 px-4 py-4 text-sm text-slate-300">{row.condition}</td>
                    <td className="border border-slate-800 px-4 py-4 text-sm text-slate-300">{row.recommendation}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-sm shadow-slate-950/10">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Jump to</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {[
            { label: 'Patient', to: '/patient' },
            { label: 'Symptom Record', to: '/symptoms' },
            { label: 'Analytics', to: '/analytics' },
            { label: 'Environment', to: '/environment' },
            { label: 'Consultation', to: '/consultation' },
            { label: 'Settings', to: '/settings' }
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm font-medium text-slate-100 transition hover:bg-slate-800"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
          <h3 className="text-xl font-semibold">City Risk Overview</h3>
          <p className="mt-2 text-slate-400">Weather-based risk levels for Rwanda's major cities.</p>

          {loading ? (
            <div className="mt-6 text-cyan-300">Loading risk data...</div>
          ) : (
            <div className="mt-6 space-y-4">
              {cities.map((city) => {
                const risk = riskData[city.toLowerCase()] || { level: 'Unknown', details: 'No data available' };
                return (
                  <div key={city} className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                    <h4 className="text-lg font-semibold">{city}</h4>
                    <p className="mt-2 text-slate-300">Risk level: <span className="font-semibold text-cyan-300">{risk.level}</span></p>
                    <p className="mt-1 text-slate-400">{risk.details}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
          <h3 className="text-xl font-semibold">Project Body</h3>
          <p className="mt-2 text-slate-400">Asthma Shield combines weather prediction, patient symptom logging, doctor consultation, and admin management into a single responsive web app.</p>
          <div className="mt-6 space-y-4 text-slate-300">
            <div>
              <h4 className="font-semibold">Patient insights</h4>
              <p className="mt-1 text-slate-400">Submit symptoms and get tailored guidance before or after an asthma event.</p>
            </div>
            <div>
              <h4 className="font-semibold">Doctor coordination</h4>
              <p className="mt-1 text-slate-400">Request video sessions and review patient status through the doctor tools.</p>
            </div>
            <div>
              <h4 className="font-semibold">Admin oversight</h4>
              <p className="mt-1 text-slate-400">Track usage metrics, recent consultations, and system health from the admin dashboard.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
        <h3 className="text-xl font-semibold">Why Asthma Shield?</h3>
        <p className="mt-2 text-slate-400">This app is designed to support people living with asthma in Rwanda by using weather data and care collaboration to reduce the likelihood of attacks.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <p className="text-lg font-semibold">Weather-based predictions</p>
            <p className="mt-2 text-slate-400">Forecast asthma risk from humidity, temperature, and air conditions in each city.</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <p className="text-lg font-semibold">Patient and doctor connection</p>
            <p className="mt-2 text-slate-400">Send symptoms, receive recommendations, and schedule video consultations.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
