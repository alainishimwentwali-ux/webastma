import { ChangeEvent, useEffect, useState } from 'react';
import { User, Bell, Image, Save, X } from 'lucide-react';

interface SettingsState {
  notifications: boolean;
  weatherAlerts: boolean;
  fullName: string;
  email: string;
  profileImageUrl: string;
}

const SETTINGS_KEY = 'asthmaShieldSettings';

export default function DoctorSettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [weatherAlerts, setWeatherAlerts] = useState(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [profileImagePreview, setProfileImagePreview] = useState('');
  const [fileError, setFileError] = useState('');
  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      const s: SettingsState = JSON.parse(saved);
      setNotifications(s.notifications);
      setWeatherAlerts(s.weatherAlerts);
      setFullName(s.fullName);
      setEmail(s.email);
      setProfileImageUrl(s.profileImageUrl ?? '');
      setProfileImagePreview(s.profileImageUrl ?? '');
    } else {
      setFullName(localStorage.getItem('fullName') || '');
    }
  }, []);

  const handleImageFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setFileError('Please upload a valid image file.'); return; }
    if (file.size > 2_000_000) { setFileError('Image must be smaller than 2MB.'); return; }
    setFileError('');
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      setProfileImagePreview(url);
      setProfileImageUrl(url);
    };
    reader.readAsDataURL(file);
  };

  const saveSettings = () => {
    const settings: SettingsState = { notifications, weatherAlerts, fullName, email, profileImageUrl };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    if (profileImageUrl) localStorage.setItem('profileImage', profileImageUrl);
    else localStorage.removeItem('profileImage');
    setSavedMessage('Settings saved successfully.');
    window.dispatchEvent(new CustomEvent('profileImageUpdated', { detail: { profileImage: profileImageUrl } }));
    setTimeout(() => setSavedMessage(''), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <div className="border-b border-gray-100 bg-white px-8 py-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-400">Manage your account details and notification preferences.</p>
      </div>

      <div className="p-8 space-y-6">
        {savedMessage && (
          <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-700">
            {savedMessage}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Profile */}
          <div className="rounded-xl border border-gray-100 bg-white p-6">
            <div className="flex items-center gap-2 mb-5">
              <User size={16} className="text-teal-600" />
              <h2 className="text-sm font-semibold text-gray-800">Profile Information</h2>
            </div>

            {/* Avatar preview */}
            <div className="flex items-center gap-4 mb-6">
              {profileImagePreview ? (
                <img src={profileImagePreview} alt="avatar" className="h-16 w-16 rounded-full object-cover border-2 border-teal-200" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-100 text-xl font-bold text-teal-700">
                  {fullName.charAt(0).toUpperCase() || 'DR'}
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-900">{fullName || 'Doctor'}</p>
                <p className="text-xs text-gray-400">{email || 'your@email.com'}</p>
                <p className="text-xs text-teal-500 mt-0.5">Pulmonologist</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-teal-400"
                  placeholder="Dr. Your Name"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-teal-400"
                  placeholder="doctor@hospital.rw"
                />
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="rounded-xl border border-gray-100 bg-white p-6">
            <div className="flex items-center gap-2 mb-5">
              <Bell size={16} className="text-teal-600" />
              <h2 className="text-sm font-semibold text-gray-800">Notification Preferences</h2>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Patient alert notifications', sub: 'Get notified when a patient submits critical symptoms', checked: notifications, toggle: () => setNotifications(p => !p) },
                { label: 'Weather risk alerts', sub: 'Receive alerts when city risk levels change', checked: weatherAlerts, toggle: () => setWeatherAlerts(p => !p) },
              ].map(item => (
                <label key={item.label} className="flex items-start gap-3 cursor-pointer">
                  <div className="relative mt-0.5">
                    <input type="checkbox" checked={item.checked} onChange={item.toggle} className="sr-only" />
                    <div className={`h-5 w-9 rounded-full transition-colors ${item.checked ? 'bg-teal-600' : 'bg-gray-200'}`} />
                    <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${item.checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.label}</p>
                    <p className="text-xs text-gray-400">{item.sub}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Profile image upload */}
        <div className="rounded-xl border border-gray-100 bg-white p-6">
          <div className="flex items-center gap-2 mb-5">
            <Image size={16} className="text-teal-600" />
            <h2 className="text-sm font-semibold text-gray-800">Profile Photo</h2>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Upload Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageFile}
                className="block text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-teal-50 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-teal-700 hover:file:bg-teal-100"
              />
              {fileError && <p className="mt-1 text-xs text-red-500">{fileError}</p>}
            </div>
            {profileImagePreview && (
              <button
                onClick={() => { setProfileImageUrl(''); setProfileImagePreview(''); }}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-500 hover:bg-gray-50"
              >
                <X size={12} /> Remove photo
              </button>
            )}
          </div>
        </div>

        {/* Save */}
        <div className="flex justify-end">
          <button
            onClick={saveSettings}
            className="flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 transition"
          >
            <Save size={15} /> Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
