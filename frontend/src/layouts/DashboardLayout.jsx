import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import Navbar from '../components/common/Navbar';

const allTabs = [
  { label: 'Overview', path: '/dashboard', roles: ['Operator', 'User'] },
  { label: 'Incidents', path: '/incidents', roles: ['Operator', 'User'] },
  { label: 'Disaster map', path: '/map', roles: ['Operator', 'User'] },
  { label: 'Network resilience', path: '/network-resilience', roles: ['Operator'] },
  { label: 'Resources', path: '/resources', roles: ['Operator'] },
  { label: 'Allocations', path: '/allocations', roles: ['Operator'] }
];

export default function DashboardLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [role, setRole] = useState('Operator');

  useEffect(() => {
    const savedRole = localStorage.getItem('resq_role');
    if (savedRole) setRole(savedRole);
  }, []);

  const tabs = allTabs.filter(t => t.roles.includes(role));
  
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar - Hidden on mobile unless toggled */}
      <div className={`fixed lg:static inset-y-0 left-0 z-50 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out h-full`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="flex flex-col flex-1 min-w-0">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        
        {/* Secondary Tab Bar (Desktop/Mobile Scrollable) */}
        <div className="bg-[#101827] border-b border-borderSubtle px-4 md:px-6 py-2 flex items-center gap-4 md:gap-6 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const isActive = location.pathname.startsWith(tab.path);
            return (
              <NavLink 
                key={tab.path} 
                to={tab.path}
                className={`text-sm whitespace-nowrap px-3 py-1.5 rounded-full transition-colors ${isActive ? 'bg-surfaceSecondary text-textPrimary font-medium' : 'text-textSecondary hover:text-textPrimary'}`}
              >
                {tab.label}
              </NavLink>
            );
          })}
        </div>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
