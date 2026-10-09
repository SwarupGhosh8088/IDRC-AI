import React, { useState, useEffect } from 'react';
import { Save, Shield, Bell, Moon, Database, Check } from 'lucide-react';

export default function Settings() {
  const [criticalAlerts, setCriticalAlerts] = useState(true);
  const [audioAlarms, setAudioAlarms] = useState(false);
  const [profile, setProfile] = useState({ city: '', state: '', country: '' });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load from local storage
    const settings = JSON.parse(localStorage.getItem('resq_settings') || '{}');
    if (settings.criticalAlerts !== undefined) setCriticalAlerts(settings.criticalAlerts);
    if (settings.audioAlarms !== undefined) setAudioAlarms(settings.audioAlarms);
    if (settings.profile) setProfile(settings.profile);
  }, []);

  const handleSave = () => {
    const settings = { criticalAlerts, audioAlarms, profile };
    localStorage.setItem('resq_settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const Toggle = ({ active, onChange }) => (
    <div 
      onClick={onChange}
      className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${active ? 'bg-primary' : 'bg-surfaceSecondary border border-borderSubtle'}`}
    >
      <div className={`w-4 h-4 rounded-full absolute top-1 transition-all ${active ? 'bg-white right-1' : 'bg-textSecondary left-1'}`}></div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-textPrimary">System Settings</h2>
        <p className="text-textSecondary text-sm mt-1">Configure workspace preferences and operational defaults.</p>
      </div>

      <div className="bg-surface border border-borderSubtle rounded-xl overflow-hidden">
        <div className="border-b border-borderSubtle p-4 bg-surfaceSecondary/50 font-semibold flex items-center gap-2">
          <Shield size={18} className="text-primary" /> User Profile
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-textSecondary mb-1">City</label>
              <input type="text" className="w-full bg-surface border border-borderSubtle rounded-md px-3 py-2 text-sm text-textPrimary outline-none focus:border-primary" value={profile.city} onChange={e => setProfile({...profile, city: e.target.value})} placeholder="Enter city" />
            </div>
            <div>
              <label className="block text-sm font-medium text-textSecondary mb-1">State / Province</label>
              <input type="text" className="w-full bg-surface border border-borderSubtle rounded-md px-3 py-2 text-sm text-textPrimary outline-none focus:border-primary" value={profile.state} onChange={e => setProfile({...profile, state: e.target.value})} placeholder="Enter state" />
            </div>
            <div>
              <label className="block text-sm font-medium text-textSecondary mb-1">Country</label>
              <input type="text" className="w-full bg-surface border border-borderSubtle rounded-md px-3 py-2 text-sm text-textPrimary outline-none focus:border-primary" value={profile.country} onChange={e => setProfile({...profile, country: e.target.value})} placeholder="Enter country" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-borderSubtle rounded-xl overflow-hidden">
        <div className="border-b border-borderSubtle p-4 bg-surfaceSecondary/50 font-semibold flex items-center gap-2">
          <Bell size={18} className="text-primary" /> Notifications
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium">Critical Incident Alerts</h4>
              <p className="text-xs text-textSecondary mt-1">Push notifications for Priority 1 events.</p>
            </div>
            <Toggle active={criticalAlerts} onChange={() => setCriticalAlerts(!criticalAlerts)} />
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-borderSubtle">
            <div>
              <h4 className="text-sm font-medium">Audio Alarms</h4>
              <p className="text-xs text-textSecondary mt-1">Play sound on critical updates.</p>
            </div>
            <Toggle active={audioAlarms} onChange={() => setAudioAlarms(!audioAlarms)} />
          </div>
        </div>
      </div>

      <div className="flex justify-end items-center gap-4">
        {saved && (
          <span className="text-success flex items-center gap-1 text-sm font-medium">
            <Check size={16} /> Settings saved
          </span>
        )}
        <button 
          onClick={handleSave}
          className="bg-primary hover:bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(79,125,243,0.3)]"
        >
          <Save size={16} /> Save Changes
        </button>
      </div>
    </div>
  );
}
