import React, { useState, useEffect } from 'react';
import { Flag, AlertTriangle, Package, Activity, Loader2, Sparkles } from 'lucide-react';
import api from '../services/api';

export default function Dashboard() {
  const [role, setRole] = useState('Operator');
  const [aiOverview, setAiOverview] = useState(null);
  const [levelSuggestions, setLevelSuggestions] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [stats, setStats] = useState({ active: 0, critical: 0, levels: { Critical: 0, High: 0, Medium: 0, Low: 0 } });

  useEffect(() => {
    const savedRole = localStorage.getItem('resq_role');
    if (savedRole) setRole(savedRole);
    
    if (savedRole === 'Operator') {
      const fetchAiOverview = async () => {
        try {
          setLoadingAi(true);
          const response = await api.get('/dashboard/ai-overview');
          if (response.data.success && response.data.data.globalSuggestion) {
            setAiOverview(response.data.data.globalSuggestion);
            if (response.data.data.levelSuggestions) {
              setLevelSuggestions(response.data.data.levelSuggestions);
            }
          }
        } catch (error) {
          console.error("Failed to fetch AI overview:", error);
        } finally {
          setLoadingAi(false);
        }
      };
      fetchAiOverview();
    }
    
    const fetchIncidents = async () => {
      try {
        const response = await api.get('/incidents');
        if (response.data.success) {
          const incs = response.data.data;
          const active = incs.filter(i => !['resolved', 'closed'].includes(i.status)).length;
          const critical = incs.filter(i => i.severity === 'critical' && !['resolved', 'closed'].includes(i.status)).length;
          const levels = {
            Critical: incs.filter(i => i.severity === 'critical' && !['resolved', 'closed'].includes(i.status)).length,
            High: incs.filter(i => i.severity === 'high' && !['resolved', 'closed'].includes(i.status)).length,
            Medium: incs.filter(i => i.severity === 'medium' && !['resolved', 'closed'].includes(i.status)).length,
            Low: incs.filter(i => i.severity === 'low' && !['resolved', 'closed'].includes(i.status)).length,
          };
          setStats({ active, critical, levels });
        }
      } catch (error) {
        console.error("Failed to fetch incidents for stats:", error);
      }
    };
    fetchIncidents();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header Block */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="text-primary text-xs font-bold tracking-widest uppercase mb-2">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} · OPERATIONS CENTER
          </div>
          <h2 className="text-3xl font-bold mb-1">
            {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'}, {role} ✦
          </h2>
          <p className="text-textSecondary">Here's your overview of disaster response activity (demo data).</p>
        </div>
        <div className="border border-borderSubtle text-textSecondary text-xs px-3 py-1.5 rounded-full flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>
          Simulated monitoring
        </div>
      </div>

      {/* Stats Row */}
      <div className={`grid grid-cols-1 md:grid-cols-2 ${role === 'Operator' ? 'xl:grid-cols-4' : ''} gap-4`}>
        {[
          { label: 'Active incidents', value: stats.active.toString().padStart(2, '0'), icon: Flag, iconBg: 'bg-red-500/10', iconColor: 'text-critical', change: 'Live from database', changeColor: 'text-primary', roles: ['Operator', 'User'] },
          { label: 'Critical alerts', value: stats.critical.toString().padStart(2, '0'), icon: AlertTriangle, iconBg: 'bg-amber-500/10', iconColor: 'text-warning', change: 'Requires immediate attention', changeColor: 'text-warning', roles: ['Operator', 'User'] },
          { label: 'Resources deployed', value: '78%', icon: Package, iconBg: 'bg-blue-500/10', iconColor: 'text-primary', change: '↑ 12% utilization this week', changeColor: 'text-success', roles: ['Operator'] },
          { label: 'Network uptime', value: '96.8%', icon: Activity, iconBg: 'bg-teal-500/10', iconColor: 'text-success', change: '+ 1.4% since last check', changeColor: 'text-success', roles: ['Operator'] },
        ]
        .filter(stat => stat.roles.includes(role))
        .map((stat, i) => (
          <div key={i} className="bg-surface rounded-xl p-5 border border-borderSubtle flex flex-col animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="flex justify-between items-start mb-4">
              <span className="text-sm text-textSecondary font-medium">{stat.label}</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.iconBg} ${stat.iconColor}`}>
                <stat.icon size={18} />
              </div>
            </div>
            <div className="text-3xl font-bold mb-2">{stat.value}</div>
            <div className={`text-xs font-medium mt-auto ${stat.changeColor}`}>{stat.change}</div>
          </div>
        ))}
      </div>

      {/* Charts & Lists Row */}
      <div className="grid grid-cols-1 gap-6 pt-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
        {role === 'Operator' && (
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-5 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
            <div className="flex items-center gap-2 text-primary font-bold mb-2">
              <Sparkles size={18} />
              AI Operations Suggestion
            </div>
            {loadingAi ? (
              <div className="flex items-center gap-2 text-textSecondary text-sm py-2">
                <Loader2 size={16} className="animate-spin" />
                Analyzing global incident data...
              </div>
            ) : aiOverview ? (
              <p className="text-textPrimary text-sm leading-relaxed">
                {aiOverview}
              </p>
            ) : (
              <p className="text-textSecondary text-sm">
                No AI suggestions available at this time.
              </p>
            )}
          </div>
        )}

        <div className="bg-surface border border-borderSubtle rounded-xl p-5 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold">Current open incidents</h3>
            <button className="text-primary text-sm hover:underline">View all ↗</button>
          </div>
          
          <div className="space-y-4 flex-1">
            {[
              { level: 'Critical', count: stats.levels.Critical.toString().padStart(2, '0'), desc: 'Immediate response required', color: 'text-critical', bg: 'bg-critical/10' },
              { level: 'High', count: stats.levels.High.toString().padStart(2, '0'), desc: 'Urgent field response', color: 'text-warning', bg: 'bg-warning/10' },
              { level: 'Medium', count: stats.levels.Medium.toString().padStart(2, '0'), desc: 'Monitor closely', color: 'text-primary', bg: 'bg-primary/10' },
              { level: 'Low', count: stats.levels.Low.toString().padStart(2, '0'), desc: 'Standard procedure', color: 'text-success', bg: 'bg-success/10' },
            ].map((sev, idx) => (
              <div key={sev.level} className="flex items-center gap-4 animate-slide-up" style={{ animationDelay: `${300 + idx * 50}ms` }}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${sev.bg} ${sev.color}`}>
                  <Flag size={20} />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{sev.level}</div>
                  <div className="text-xs text-textSecondary mt-1">
                    {role === 'Operator' && levelSuggestions && levelSuggestions[sev.level]
                      ? <span className="text-primary/90 flex items-center gap-1"><Sparkles size={10} className="inline" /> {levelSuggestions[sev.level]}</span>
                      : sev.desc}
                  </div>
                </div>
                <div className={`text-xl font-bold ${sev.color}`}>{sev.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="text-center text-xs text-textSecondary pt-8">
        Demo data mode. Real-time connections are simulated.
      </div>
    </div>
  );
}
