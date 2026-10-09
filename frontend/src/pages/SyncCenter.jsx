import React from 'react';
import { RefreshCw, Database, Cloud, Wifi, CheckCircle } from 'lucide-react';

export default function SyncCenter() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-textPrimary">Sync Center</h2>
        <p className="text-textSecondary text-sm mt-1">Manage data synchronization between local storage, offline nodes, and the cloud backend.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface border border-borderSubtle rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-success/10 rounded-lg text-success">
              <Cloud size={24} />
            </div>
            <div>
              <h3 className="font-bold">Cloud Connection</h3>
              <p className="text-xs text-success flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-success"></span> Online & Active
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-textSecondary">Last synced</span>
              <span className="font-medium text-textPrimary">Just now</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-textSecondary">Pending changes</span>
              <span className="font-medium text-textPrimary">0</span>
            </div>
          </div>
          <button className="w-full mt-6 bg-surfaceSecondary hover:bg-borderSubtle border border-borderSubtle text-textPrimary py-2 rounded-lg text-sm font-medium transition-colors flex justify-center items-center gap-2">
            <RefreshCw size={14} /> Force Sync
          </button>
        </div>

        <div className="bg-surface border border-borderSubtle rounded-xl p-6 opacity-60">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-surfaceSecondary rounded-lg text-textSecondary">
              <Wifi size={24} />
            </div>
            <div>
              <h3 className="font-bold">P2P Mesh Network</h3>
              <p className="text-xs text-textSecondary mt-0.5">Offline mode capability</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-textSecondary">Status</span>
              <span className="font-medium text-textPrimary">Standby</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-textSecondary">Discovered peers</span>
              <span className="font-medium text-textPrimary">0</span>
            </div>
          </div>
          <button className="w-full mt-6 bg-surfaceSecondary border border-borderSubtle text-textSecondary py-2 rounded-lg text-sm font-medium cursor-not-allowed">
            Activate Mesh
          </button>
        </div>
      </div>
      
      <div className="bg-surface border border-borderSubtle rounded-xl p-6 mt-6">
        <h3 className="font-bold mb-4">Sync Logs</h3>
        <div className="bg-[#0a0f18] rounded-lg p-4 font-mono text-xs text-textSecondary h-48 overflow-y-auto space-y-2">
          <div><span className="text-success">[OK]</span> 12:45:01 - Pushed 2 incident updates to cloud.</div>
          <div><span className="text-success">[OK]</span> 12:44:12 - Fetched latest resource allocations.</div>
          <div><span className="text-success">[OK]</span> 12:40:00 - Routine heartbeat check.</div>
          <div><span className="text-warning">[WARN]</span> 12:35:10 - Node ND-03 failed to respond.</div>
          <div><span className="text-success">[OK]</span> 12:30:05 - Connection established.</div>
        </div>
      </div>
    </div>
  );
}
