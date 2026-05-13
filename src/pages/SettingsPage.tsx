import { ChangeEvent, useEffect, useState } from 'react';

interface SettingsState {
  notifications: boolean;
  weatherAlerts: boolean;
  darkMode: boolean;
  fullName: string;
  email: string;
  dashboardImageUrl: string;
}

const SETTINGS_KEY = 'asthmaShieldSettings';

function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [weatherAlerts, setWeatherAlerts] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [dashboardImageUrl, setDashboardImageUrl] = useState('');
  const [dashboardImagePreview, setDashboardImagePreview] = useState('');
  const [fileError, setFileError] = useState('');
  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      const settings: SettingsState = JSON.parse(saved);
      setNotifications(settings.notifications);
      setWeatherAlerts(settings.weatherAlerts);
      setDarkMode(settings.darkMode);
      setFullName(settings.fullName);
      setEmail(settings.email);
      setDashboardImageUrl(settings.dashboardImageUrl);
      setDashboardImagePreview(settings.dashboardImageUrl);
    }
  }, []);

  const handleImageFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFileError('Please upload a valid image file.');
      return;
    }

    if (file.size > 2_000_000) {
      setFileError('Please choose an image smaller than 2MB.');
      return;
    }

    setFileError('');
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setDashboardImagePreview(dataUrl);
      setDashboardImageUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const saveSettings = () => {
    const settings: SettingsState = {
      notifications,
      weatherAlerts,
      darkMode,
      fullName,
      email,
      dashboardImageUrl
    };

    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    if (dashboardImageUrl) localStorage.setItem('profileImage', dashboardImageUrl);
    else localStorage.removeItem('profileImage');
    setSavedMessage('Settings saved successfully.');
    window.dispatchEvent(new CustomEvent('dashboardSettingsUpdated', { detail: { dashboardImageUrl } }));
    window.dispatchEvent(new CustomEvent('profileImageUpdated', { detail: { profileImage: dashboardImageUrl } }));
  };

  const clearImage = () => {
    setDashboardImageUrl('');
    setDashboardImagePreview('');
  };

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-xl shadow-slate-950/30">
        <h2 className="text-3xl font-semibold text-white">Settings</h2>
        <p className="mt-3 text-slate-400">Update your account details, notification preferences, and dashboard image from this page.</p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
          <h3 className="text-xl font-semibold text-white">Profile and preferences</h3>
          <div className="mt-6 space-y-5">
            <label className="block text-sm text-slate-300">
              Full name
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-cyan-500"
                placeholder="Enter your name"
              />
            </label>
            <label className="block text-sm text-slate-300">
              Email address
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-cyan-500"
                placeholder="you@example.com"
              />
            </label>
            <label className="block text-sm text-slate-300">
              Dashboard image URL
              <input
                type="text"
                value={dashboardImageUrl}
                onChange={(e) => {
                  setDashboardImageUrl(e.target.value);
                  setDashboardImagePreview(e.target.value);
                }}
                className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-cyan-500"
                placeholder="Paste an image URL to use on the dashboard"
              />
            </label>
            <label className="block text-sm text-slate-300">
              Upload dashboard image
              <input
                type="file"
                accept="image/*"
                onChange={handleImageFile}
                className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-slate-100 file:rounded-full file:bg-slate-800 file:px-4 file:py-2 file:text-slate-100"
              />
            </label>
            {fileError && <p className="text-sm text-rose-400">{fileError}</p>}
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={saveSettings} className="rounded-full bg-cyan-500 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-400">
                Save settings
              </button>
              <button onClick={clearImage} className="rounded-full border border-slate-700 bg-slate-900 px-6 py-3 text-slate-200 hover:bg-slate-800">
                Clear image
              </button>
            </div>
            {savedMessage && <p className="text-sm text-emerald-400">{savedMessage}</p>}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
          <h3 className="text-xl font-semibold text-white">Notification controls</h3>
          <div className="mt-6 space-y-4">
            <label className="flex items-center gap-3 text-slate-200">
              <input
                type="checkbox"
                checked={notifications}
                onChange={() => setNotifications((prev) => !prev)}
                className="h-5 w-5 rounded border-slate-700 bg-slate-900"
              />
              Enable patient notifications
            </label>
            <label className="flex items-center gap-3 text-slate-200">
              <input
                type="checkbox"
                checked={weatherAlerts}
                onChange={() => setWeatherAlerts((prev) => !prev)}
                className="h-5 w-5 rounded border-slate-700 bg-slate-900"
              />
              Receive weather risk alerts
            </label>
            <label className="flex items-center gap-3 text-slate-200">
              <input
                type="checkbox"
                checked={darkMode}
                onChange={() => setDarkMode((prev) => !prev)}
                className="h-5 w-5 rounded border-slate-700 bg-slate-900"
              />
              Use dark dashboard mode
            </label>
          </div>
          <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-400">
            <p className="font-semibold text-white">How to update the dashboard image</p>
            <p className="mt-3">Use the image URL field or upload a local image file. Then click Save settings to persist the change.</p>
            <p className="mt-2">The dashboard will load the saved image when you return to the homepage.</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
        <h3 className="text-2xl font-semibold text-white">Profile image preview</h3>
        <p className="mt-2 text-slate-400">This image will appear as your avatar in the header.</p>
        <div className="mt-6 flex items-center gap-6">
          <div className="relative">
            {dashboardImagePreview ? (
              <img src={dashboardImagePreview} alt="Profile preview" className="h-24 w-24 rounded-full object-cover border-4 border-cyan-500/40 shadow-lg" />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-dashed border-slate-700 bg-slate-900 text-3xl font-bold text-cyan-400">
                {fullName.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            {dashboardImagePreview && (
              <span className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-xs text-white">✓</span>
            )}
          </div>
          <div>
            <p className="font-semibold text-white">{fullName || 'Your Name'}</p>
            <p className="text-sm text-slate-400">{email || 'your@email.com'}</p>
            {dashboardImagePreview && <p className="mt-1 text-xs text-green-400">Profile image set — click Save settings to apply.</p>}
          </div>
        </div>
        {dashboardImagePreview && (
          <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-950 p-4">
            <p className="text-xs text-slate-500 mb-2">Banner preview</p>
            <img src={dashboardImagePreview} alt="Banner preview" className="h-40 w-full rounded-2xl object-cover" />
          </div>
        )}
      </section>
    </div>
  );
}

export default SettingsPage;
