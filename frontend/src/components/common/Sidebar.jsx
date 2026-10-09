import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Activity, Package, CheckSquare, Map, Settings, RefreshCw, X } from 'lucide-react';

const allNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Overview', roles: ['Operator', 'User'] },
  { to: '/incidents', icon: FileText, label: 'Incident Reports', roles: ['Operator', 'User'] },
  { to: '/map', icon: Map, label: 'Live Disaster Map', roles: ['Operator', 'User'] },
  { to: '/network-resilience', icon: Activity, label: 'Network Resilience', roles: ['Operator'] },
  { to: '/resources', icon: Package, label: 'Resource Management', roles: ['Operator'] },
  { to: '/allocations', icon: CheckSquare, label: 'Allocation Results', roles: ['Operator'] },
];

export default function Sidebar({ onClose }) {
  const [role, setRole] = useState('Operator');

  useEffect(() => {
    const savedRole = localStorage.getItem('resq_role');
    if (savedRole) setRole(savedRole);
  }, []);

  const navItems = allNavItems.filter(item => item.roles.includes(role));

  return (
    <div className="w-64 bg-surface h-full flex flex-col border-r border-borderSubtle">
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="IDRC-Ai Logo" className="w-10 h-10 rounded-md object-cover" />
            <div>
              <h1 className="font-bold text-xl leading-tight text-textPrimary">IDRC-Ai</h1>
              <p className="text-[10px] text-textSecondary uppercase tracking-widest mt-0.5">Intelligence Rescue Co-ordination</p>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="lg:hidden text-textSecondary hover:text-textPrimary">
              <X size={20} />
            </button>
          )}
        </div>

        <div className="mb-2 text-xs font-semibold text-textSecondary uppercase tracking-wider">Workspace</div>
        <nav className="flex flex-col gap-1 mb-8">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  isActive
                    ? 'bg-primary/20 text-primary'
                    : 'text-textSecondary hover:bg-surfaceSecondary hover:text-textPrimary'
                }`
              }
            >
              <item.icon size={18} />
              <span className="font-medium text-sm">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {role === 'Operator' && (
          <>
            <div className="mb-2 text-xs font-semibold text-textSecondary uppercase tracking-wider">System</div>
            <nav className="flex flex-col gap-1">
              <NavLink to="/sync" onClick={onClose} className="flex items-center justify-between px-3 py-2 rounded-md text-textSecondary hover:bg-surfaceSecondary hover:text-textPrimary">
                <div className="flex items-center gap-3">
                  <RefreshCw size={18} />
                  <span className="font-medium text-sm">Sync Center</span>
                </div>
                <span className="text-xs text-success flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-success"></span> Online
                </span>
              </NavLink>
              <NavLink to="/settings" onClick={onClose} className="flex items-center gap-3 px-3 py-2 rounded-md text-textSecondary hover:bg-surfaceSecondary hover:text-textPrimary">
                <Settings size={18} />
                <span className="font-medium text-sm">Settings</span>
              </NavLink>
            </nav>
          </>
        )}
      </div>

      <div className="mt-auto p-4 border-t border-borderSubtle">
        <div className="bg-surfaceSecondary p-3 rounded-lg flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-success"></span>
          <span className="text-sm font-medium">All systems operational</span>
        </div>
      </div>
    </div>
  );
}
