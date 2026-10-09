import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Moon, Sun, Plus, Menu } from 'lucide-react';
import { incidentService } from '../../services/incidentService';

export default function Navbar({ onMenuClick }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [role, setRole] = useState('Operator');
  const [darkMode, setDarkMode] = useState(true);
  const [newReports, setNewReports] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const savedRole = localStorage.getItem('resq_role');
    if (savedRole) setRole(savedRole);
    
    // Always force light mode
    document.documentElement.classList.remove('dark');
    
    // Fetch notifications
    incidentService.getIncidents({ status: 'reported' }).then(data => {
      setNewReports(data.length);
    }).catch(() => {});
  }, []);
  return (
    <header className="h-16 border-b border-borderSubtle bg-surface flex items-center justify-between px-4 md:px-6 shrink-0">
      <div className="flex items-center gap-3">
        <button 
          onClick={onMenuClick}
          className="lg:hidden text-textSecondary hover:text-textPrimary transition-colors"
        >
          <Menu size={24} />
        </button>
        <div className="flex items-center text-sm">
          <span className="text-textSecondary hidden sm:inline">Workspace</span>
          <span className="mx-2 text-textSecondary hidden sm:inline">/</span>
          <span className="font-medium">Overview</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2 md:gap-4">
        <button className="text-textSecondary hover:text-textPrimary transition-colors relative">
          <Bell size={20} />
          {newReports > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center font-bold">
              {newReports}
            </span>
          )}
        </button>
        {role === 'Operator' && (
          <button 
            onClick={() => navigate('/incidents?action=create')}
            className="bg-primary hover:bg-borderSubtle text-textPrimary px-3 py-1.5 md:px-4 md:py-2 rounded-md font-medium text-xs md:text-sm flex items-center gap-1 md:gap-2 transition-all border border-borderSubtle"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Report incident</span>
            <span className="sm:hidden">Report</span>
          </button>
        )}
        <div className="relative">
          <div 
            className="w-8 h-8 rounded-full bg-surfaceSecondary border border-borderSubtle overflow-hidden ml-1 md:ml-2 cursor-pointer shrink-0"
            onClick={() => setProfileOpen(!profileOpen)}
          >
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${role}`} alt="User" />
          </div>
          
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-surface border border-borderSubtle rounded-md shadow-lg py-1 z-50">
              <div className="px-4 py-2 border-b border-borderSubtle">
                <p className="text-sm font-medium text-textPrimary">Signed in as</p>
                <p className="text-xs text-textSecondary truncate">{role}</p>
              </div>
              <button 
                className="w-full text-left px-4 py-2 text-sm text-textSecondary hover:bg-surfaceSecondary hover:text-textPrimary transition-colors"
                onClick={() => {
                  setProfileOpen(false);
                  navigate('/settings');
                }}
              >
                Profile & Settings
              </button>
              <button 
                className="w-full text-left px-4 py-2 text-sm text-critical hover:bg-critical/10 transition-colors"
                onClick={() => {
                  localStorage.removeItem('resq_role');
                  navigate('/login');
                }}
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
