import React, { useState, useEffect } from 'react';
import { Activity, Server, Wifi, AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { incidentService } from '../services/incidentService';

const baseNodes = [
  { id: 'ND-CORE-01', name: 'National HQ Data Center', type: 'Primary Data Center', status: 'Online', uptime: '99.99%', ping: '8ms', lastCheck: '1 min ago' },
];

export default function NetworkResilience() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const data = await incidentService.getIncidents();
        setIncidents(data.filter(i => !['resolved', 'closed'].includes(i.status)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchIncidents();
  }, []);

  const dynamicNodes = incidents.map((inc, i) => {
    const status = inc.aiAnalysis?.networkStatus || (inc.severity === 'critical' ? 'Degraded' : 'Online');
    
    let ping = '15ms';
    let uptime = '99.9%';
    if (status === 'Degraded') {
      ping = Math.floor(Math.random() * (400 - 100) + 100) + 'ms';
      uptime = (90 + Math.random() * 8).toFixed(1) + '%';
    } else if (status === 'Offline') {
      ping = 'Timeout';
      uptime = (60 + Math.random() * 20).toFixed(1) + '%';
    }
    
    return {
      id: `ND-${inc.id ? inc.id.substring(18,24).toUpperCase() : (i + 10).toString()}`,
      name: `${inc.locationName.split(',')[0]} Sector`,
      type: 'Local Relay',
      status: status === 'Unknown' ? 'Online' : status,
      uptime: uptime,
      ping: ping,
      lastCheck: 'Just now'
    };
  });

  const allNodes = [...baseNodes, ...dynamicNodes];
  const onlineCount = allNodes.filter(n => n.status === 'Online').length;
  const degradedCount = allNodes.filter(n => n.status === 'Degraded').length;
  const offlineCount = allNodes.filter(n => n.status === 'Offline').length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-textPrimary">Network Resilience</h2>
          <p className="text-textSecondary text-sm mt-1">Monitor the status of critical communication nodes and servers.</p>
        </div>
        <button className="bg-surfaceSecondary border border-borderSubtle text-textPrimary px-4 py-2 rounded-md text-sm font-medium hover:bg-borderSubtle transition-colors flex items-center gap-2">
          <Activity size={16} /> Run Diagnostics
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface border border-borderSubtle rounded-xl p-5 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mb-3">
            <CheckCircle className="text-success" size={24} />
          </div>
          <h3 className="text-3xl font-bold text-textPrimary">{loading ? '-' : `${onlineCount}/${allNodes.length}`}</h3>
          <p className="text-sm text-textSecondary mt-1">Nodes Online</p>
        </div>
        <div className="bg-surface border border-borderSubtle rounded-xl p-5 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center mb-3">
            <AlertTriangle className="text-warning" size={24} />
          </div>
          <h3 className="text-3xl font-bold text-textPrimary">{loading ? '-' : degradedCount}</h3>
          <p className="text-sm text-textSecondary mt-1">Nodes Degraded</p>
        </div>
        <div className="bg-surface border border-borderSubtle rounded-xl p-5 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-critical/10 flex items-center justify-center mb-3">
            <XCircle className="text-critical" size={24} />
          </div>
          <h3 className="text-3xl font-bold text-textPrimary">{loading ? '-' : offlineCount}</h3>
          <p className="text-sm text-textSecondary mt-1">Nodes Offline</p>
        </div>
      </div>

      <div className="bg-surface border border-borderSubtle rounded-xl overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap min-w-[800px]">
          <thead className="bg-surfaceSecondary text-textSecondary border-b border-borderSubtle">
            <tr>
              <th className="px-6 py-4 font-medium">Node ID & Name</th>
              <th className="px-6 py-4 font-medium">Type</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Uptime</th>
              <th className="px-6 py-4 font-medium">Latency</th>
              <th className="px-6 py-4 font-medium text-right">Last Check</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borderSubtle">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-textSecondary">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 size={18} className="animate-spin" /> Loading network status...
                  </div>
                </td>
              </tr>
            ) : allNodes.map((node) => (
              <tr key={node.id} className="hover:bg-surfaceSecondary/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-textPrimary">{node.name}</div>
                  <div className="text-xs text-textSecondary">{node.id}</div>
                </td>
                <td className="px-6 py-4 text-textSecondary">
                  <div className="flex items-center gap-2">
                    {node.type.includes('Server') || node.type.includes('Data') ? <Server size={14} /> : <Wifi size={14} />}
                    {node.type}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
                    ${node.status === 'Online' ? 'bg-success/10 text-success border-success/20' : 
                      node.status === 'Degraded' ? 'bg-warning/10 text-warning border-warning/20' : 
                      'bg-critical/10 text-critical border-critical/20'}
                  `}>
                    <span className={`w-1.5 h-1.5 rounded-full ${node.status === 'Online' ? 'bg-success' : node.status === 'Degraded' ? 'bg-warning' : 'bg-critical'}`}></span>
                    {node.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-textPrimary font-medium">{node.uptime}</td>
                <td className="px-6 py-4 text-textSecondary">{node.ping}</td>
                <td className="px-6 py-4 text-right text-textSecondary">{node.lastCheck}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
